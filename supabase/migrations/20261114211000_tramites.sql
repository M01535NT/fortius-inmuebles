-- TRA-01 · Trámites con pasos (decisiones del titular del 14/11/2026). El primero: cancelación de
-- hipoteca. Fortius lo hace; el propietario paga notario y Registro; es aparte de la venta.
-- Un trámite vive en el registro genérico (colección «tramites») y se ve como los registros del
-- cliente: cada asesor, los de sus clientes; el director, todos. La base decide:
--  · los pasos se cierran de uno en uno, con sus pendientes hechos y, si el paso lo pide, su documento
--    (un archivo privado ligado con tramiteId y pasoClave); regresar un paso lo reabre;
--  · las notas las sella la base (autor y fecha); nadie cambia el texto de una nota ni borra el
--    historial; solo su autor o el director quitan una nota;
--  · quedar en espera crea la tarea «Volver a preguntar» para «Hoy», una sola vez por fecha;
--  · solo el director reasigna cliente o asesor y borra un trámite.
-- No reescribe registros existentes.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

create or replace function public.fortius_inmuebles_replace_once(definition text, anchor text, replacement text, expected integer, fn text)
returns text language plpgsql immutable set search_path='' as $$
begin
 if (length(definition)-length(replace(definition,anchor,'')))/length(anchor)<>expected then
  raise exception 'Unexpected process function %', fn;
 end if;
 return replace(definition,anchor,replacement);
end; $$;

alter table public.fortius_inmuebles_records drop constraint fortius_inmuebles_records_collection_check;
alter table public.fortius_inmuebles_records add constraint fortius_inmuebles_records_collection_check
 check (collection in ('propiedades','asesores','leads','clientes','eventos','tareas','notas','posts','archivos','contenido','config','tramites'));

create or replace function public.fortius_inmuebles_tramite_paso_nombre(acreedor text, clave text)
returns text language sql immutable set search_path='' as $$
 select case clave when 'datos' then 'Datos del crédito' when 'liquidado' then 'Crédito liquidado'
  when 'carta' then case acreedor when 'banco' then 'Carta de finiquito' when 'fovissste' then 'Carta de no adeudo' else 'Carta de cancelación' end
  when 'notario' then 'Notario y presupuesto' when 'firma' then 'Firma' when 'registro' then 'Registro Público'
  when 'certificado' then 'Certificado' when 'entrega' then 'Entrega' end $$;

create or replace function public.fortius_inmuebles_validate_tramite(record_id text, d jsonb)
returns void language plpgsql set search_path='' as $$
declare p jsonb; x jsonb; i integer; claves text[]:=array['datos','liquidado','carta','notario','firma','registro','certificado','entrega']; fecha text;
begin
 if d is null or jsonb_typeof(d)<>'object' or octet_length(d::text)>250000
  or record_id is null or record_id !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$' or d->>'id' is distinct from record_id
  or d->>'tipo' is distinct from 'cancelacion_hipoteca' or coalesce(d->>'acreedor','') not in ('infonavit','banco','fovissste')
  or jsonb_typeof(d->'titulo') is distinct from 'string' or length(btrim(d->>'titulo')) not between 1 and 160
  or coalesce(d->>'clienteId','') !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$' or coalesce(d->>'asesorId','') !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$'
  or coalesce(d->>'estado','') not in ('en_curso','terminado','cancelado')
  or jsonb_typeof(d->'pasoActual') is distinct from 'number' or (d->>'pasoActual') !~ '^[0-8]$'
  or jsonb_typeof(d->'pasos') is distinct from 'array' or jsonb_array_length(d->'pasos')<>8
  or jsonb_typeof(coalesce(d->'notas','[]'::jsonb))<>'array' or jsonb_array_length(coalesce(d->'notas','[]'::jsonb))>1000
  or jsonb_typeof(coalesce(d->'pagos','[]'::jsonb))<>'array' or jsonb_array_length(coalesce(d->'pagos','[]'::jsonb))>30
  or (d ? 'propiedadSlug' and jsonb_typeof(d->'propiedadSlug')<>'string')
  or (d ? 'expedienteId' and jsonb_typeof(d->'expedienteId')<>'string') then
  raise sqlstate 'PT400' using message='Trámite inválido';
 end if;
 if (d->>'estado'='terminado') <> ((d->>'pasoActual')::int=8) then
  raise sqlstate 'PT400' using message='El trámite termina al cerrar el último paso';
 end if;
 for i in 0..7 loop
  p:=d->'pasos'->i;
  if jsonb_typeof(p)<>'object' or p->>'clave' is distinct from claves[i+1] or jsonb_typeof(p->'pendientes') is distinct from 'array'
   or jsonb_array_length(p->'pendientes')>20 then raise sqlstate 'PT400' using message='Pasos del trámite inválidos'; end if;
  for x in select value from jsonb_array_elements(p->'pendientes') loop
   if jsonb_typeof(x)<>'object' or coalesce(x->>'id','') !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$'
    or jsonb_typeof(x->'texto') is distinct from 'string' or length(btrim(x->>'texto')) not between 1 and 300
    or jsonb_typeof(x->'hecho') is distinct from 'boolean' then raise sqlstate 'PT400' using message='Pendiente inválido'; end if;
  end loop;
 end loop;
 for x in select value from jsonb_array_elements(coalesce(d->'notas','[]'::jsonb)) loop
  if jsonb_typeof(x)<>'object' or coalesce(x->>'id','') !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$' or coalesce(x->>'tipo','') not in ('nota','evento')
   or jsonb_typeof(x->'texto') is distinct from 'string' or length(btrim(x->>'texto')) not between 1 and 5000 then
   raise sqlstate 'PT400' using message='Nota inválida'; end if;
 end loop;
 if exists(select 1 from jsonb_array_elements(coalesce(d->'notas','[]'::jsonb)) n group by n->>'id' having count(*)>1) then
  raise sqlstate 'PT400' using message='Nota duplicada'; end if;
 for x in select value from jsonb_array_elements(coalesce(d->'pagos','[]'::jsonb)) loop
  if jsonb_typeof(x)<>'object' or coalesce(x->>'id','') !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$' or jsonb_typeof(x->'concepto') is distinct from 'string'
   or coalesce(x->>'estado','') not in ('pendiente','pagado') or (x ? 'monto' and jsonb_typeof(x->'monto')<>'number') then
   raise sqlstate 'PT400' using message='Pago inválido'; end if;
 end loop;
 if jsonb_typeof(d->'espera')='object' then
  foreach fecha in array array[d->'espera'->>'desde', d->'espera'->>'volver'] loop
   if coalesce(fecha,'') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise sqlstate 'PT400' using message='Fecha de espera inválida'; end if;
   begin perform fecha::date; exception when others then raise sqlstate 'PT400' using message='Fecha de espera inválida'; end;
  end loop;
  if jsonb_typeof(d->'espera'->'quien') is distinct from 'string' or length(btrim(d->'espera'->>'quien')) not between 1 and 120 then
   raise sqlstate 'PT400' using message='Indica a quién se espera'; end if;
 elsif d ? 'espera' and jsonb_typeof(d->'espera')<>'null' then raise sqlstate 'PT400' using message='Espera inválida';
 end if;
 if jsonb_typeof(d->'ultimoAvance')='object' then
  if coalesce(d->'ultimoAvance'->>'medio','') not in ('whatsapp','correo','pdf') then raise sqlstate 'PT400' using message='Medio del avance inválido'; end if;
 elsif d ? 'ultimoAvance' and jsonb_typeof(d->'ultimoAvance')<>'null' then raise sqlstate 'PT400' using message='Avance inválido';
 end if;
end; $$;

create or replace function public.fortius_inmuebles_guard_tramite()
returns trigger language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); admin boolean; stamp text:=to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
 prev jsonb:='{}'::jsonb; antes integer:=0; ahora integer; pasos jsonb:='[]'::jsonb; p jsonb; op jsonb; i integer;
 notas jsonb:='[]'::jsonb; vieja jsonb; n jsonb; eventos text[]:='{}'; texto text; k integer:=0; espera_id text; nombre text;
begin
 -- Documentos del trámite: solo de un trámite existente del mismo cliente.
 if tg_op<>'DELETE' and new.collection='archivos' then
  if coalesce(new.data->>'tramiteId','')<>'' and not exists(select 1 from public.fortius_inmuebles_records t
    where t.collection='tramites' and t.id=new.data->>'tramiteId' and t.data->>'clienteId'=new.data->>'clienteId') then
   raise sqlstate 'PT400' using message='El documento debe ser de un trámite del mismo cliente';
  end if;
  return new;
 end if;
 if coalesce(new.collection,old.collection)<>'tramites' then return coalesce(new,old); end if;
 admin:=public.fortius_inmuebles_is_admin();
 if tg_op='DELETE' then
  if actor is not null and not admin then raise sqlstate 'PT403' using message='Solo el director borra un trámite; márcalo como cancelado'; end if;
  return old;
 end if;
 if actor is null then raise sqlstate 'PT401' using message='Sesión requerida para registrar un trámite'; end if;
 perform public.fortius_inmuebles_validate_tramite(new.id,new.data);
 if tg_op='UPDATE' then prev:=old.data; antes:=(old.data->>'pasoActual')::int; end if;
 ahora:=(new.data->>'pasoActual')::int;
 if not admin then
  if tg_op='INSERT' and new.data->>'asesorId' is distinct from public.fortius_inmuebles_current_asesor_id() then
   raise sqlstate 'PT403' using message='Abre el trámite a tu nombre; el director asigna otros asesores'; end if;
  if tg_op='UPDATE' and new.data->>'asesorId' is distinct from old.data->>'asesorId' then
   raise sqlstate 'PT403' using message='Solo el director reasigna el asesor de un trámite'; end if;
 end if;
 if tg_op='INSERT' and (ahora<>0 or new.data->>'estado'<>'en_curso') then
  raise sqlstate 'PT400' using message='Un trámite empieza en el primer paso'; end if;
 if tg_op='UPDATE' and old.data->>'acreedor' is distinct from new.data->>'acreedor' then
  raise sqlstate 'PT400' using message='El acreedor no cambia; abre otro trámite'; end if;
 if tg_op='UPDATE' and old.data->>'estado'='cancelado' and ahora<>antes then
  raise sqlstate 'PT400' using message='Un trámite cancelado no avanza'; end if;
 if abs(ahora-antes)>1 then raise sqlstate 'PT400' using message='Los pasos se cierran de uno en uno'; end if;

 -- Pasos: los pendientes no cambian de texto; el cierre lo sella la base.
 for i in 0..7 loop
  p:=new.data->'pasos'->i; op:=case when tg_op='UPDATE' then old.data->'pasos'->i else null end;
  if op is not null and (select coalesce(jsonb_agg(x-'hecho'),'[]') from jsonb_array_elements(p->'pendientes') x)
     is distinct from (select coalesce(jsonb_agg(x-'hecho'),'[]') from jsonb_array_elements(op->'pendientes') x) then
   raise sqlstate 'PT400' using message='Los pendientes de un paso no se cambian'; end if;
  p:=(p-'cerradoEl'-'cerradoPor')||jsonb_strip_nulls(jsonb_build_object('cerradoEl',op->'cerradoEl','cerradoPor',op->'cerradoPor'));
  pasos:=pasos||jsonb_build_array(p);
 end loop;
 if ahora=antes+1 then
  p:=pasos->antes; nombre:=public.fortius_inmuebles_tramite_paso_nombre(new.data->>'acreedor',p->>'clave');
  if exists(select 1 from jsonb_array_elements(p->'pendientes') x where x->'hecho'<>'true'::jsonb) then
   raise sqlstate 'PT400' using message='Faltan pendientes de «'||nombre||'»'; end if;
  if p->>'clave' in ('liquidado','carta','certificado') and not exists(select 1 from public.fortius_inmuebles_records a
    where a.collection='archivos' and a.data->>'tramiteId'=new.id and a.data->>'pasoClave'=p->>'clave') then
   raise sqlstate 'PT400' using message='Sube el documento de «'||nombre||'» antes de cerrar el paso'; end if;
  pasos:=jsonb_set(pasos,array[antes::text],p||jsonb_build_object('cerradoEl',stamp,'cerradoPor',actor::text));
  eventos:=eventos||('Se cerró el paso «'||nombre||'»');
 elsif ahora=antes-1 then
  p:=pasos->ahora; nombre:=public.fortius_inmuebles_tramite_paso_nombre(new.data->>'acreedor',p->>'clave');
  pasos:=jsonb_set(pasos,array[ahora::text],p-'cerradoEl'-'cerradoPor');
  eventos:=eventos||('Se reabrió el paso «'||nombre||'»');
 end if;

 -- Espera: crea la tarea de volver a preguntar.
 if jsonb_typeof(new.data->'espera')='object' and (new.data->'espera') is distinct from (prev->'espera') then
  espera_id:='tramite-'||new.id||'-espera-'||replace(new.data->'espera'->>'volver','-','');
  if length(espera_id)>160 then espera_id:='tramite-espera-'||md5(new.id||(new.data->'espera'->>'volver')); end if;
  insert into public.fortius_inmuebles_records(collection,id,data) values('tareas',espera_id,jsonb_strip_nulls(jsonb_build_object(
   'id',espera_id,'titulo',left('Volver a preguntar a '||(new.data->'espera'->>'quien')||' · '||(new.data->>'titulo'),160),
   'descripcion','Trámite de cancelación de hipoteca en espera desde el '||(new.data->'espera'->>'desde')||'.',
   'categoria','documentacion','estado','pendiente','prioridad','normal','pasos','[]'::jsonb,
   'asesorId',new.data->>'asesorId','clienteId',new.data->>'clienteId','propiedadSlug',nullif(new.data->>'propiedadSlug',''),
   'tramiteId',new.id,'vence',new.data->'espera'->>'volver')))
  on conflict do nothing;
  eventos:=eventos||('Quedó en espera de '||(new.data->'espera'->>'quien')||'; volver a preguntar el '||to_char((new.data->'espera'->>'volver')::date,'DD/MM/YYYY'));
 elsif jsonb_typeof(prev->'espera')='object' and jsonb_typeof(new.data->'espera') is distinct from 'object' then
  eventos:=eventos||('Terminó la espera de '||(prev->'espera'->>'quien'));
 end if;

 -- Avance al propietario: la fecha la pone la base.
 if jsonb_typeof(new.data->'ultimoAvance')='object' then
  if (new.data->'ultimoAvance'->>'medio') is distinct from (prev->'ultimoAvance'->>'medio')
   or (new.data->'ultimoAvance'->>'fecha') is distinct from (prev->'ultimoAvance'->>'fecha') then
   new.data:=jsonb_set(new.data,'{ultimoAvance}',jsonb_build_object('medio',new.data->'ultimoAvance'->>'medio','fecha',stamp));
   eventos:=eventos||('Se envió el avance al propietario por '||case new.data->'ultimoAvance'->>'medio' when 'whatsapp' then 'WhatsApp' when 'correo' then 'correo' else 'PDF' end);
  end if;
 end if;
 if new.data->>'estado'='cancelado' and prev->>'estado' is distinct from 'cancelado' then eventos:=eventos||'Se canceló el trámite'::text; end if;

 -- Notas: las nuevas se sellan; las existentes no cambian de texto; el historial no se borra.
 for n in select value from jsonb_array_elements(coalesce(new.data->'notas','[]'::jsonb)) loop
  select value into vieja from jsonb_array_elements(coalesce(prev->'notas','[]'::jsonb)) where value->>'id'=n->>'id';
  if vieja is null then
   if n->>'tipo'<>'nota' then raise sqlstate 'PT400' using message='El historial lo escribe el sistema'; end if;
   n:=(n-'autor'-'fecha')||jsonb_build_object('autor',actor::text,'fecha',stamp);
  elsif (n-'fijada') is distinct from (vieja-'fijada') then
   raise sqlstate 'PT403' using message='Una nota no se cambia; escribe otra';
  end if;
  notas:=notas||jsonb_build_array(n); vieja:=null;
 end loop;
 for vieja in select value from jsonb_array_elements(coalesce(prev->'notas','[]'::jsonb)) loop
  if not exists(select 1 from jsonb_array_elements(notas) x where x->>'id'=vieja->>'id') then
   if vieja->>'tipo'='evento' then raise sqlstate 'PT403' using message='El historial del trámite no se borra'; end if;
   if vieja->>'autor' is distinct from actor::text and not admin then raise sqlstate 'PT403' using message='Solo quien escribió la nota o el director la quitan'; end if;
  end if;
 end loop;
 foreach texto in array eventos loop
  k:=k+1;
  notas:=notas||jsonb_build_array(jsonb_build_object('id','ev-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSUS')||'-'||k,'tipo','evento','texto',texto,'autor',actor::text,'fecha',stamp));
 end loop;

 new.data:=(new.data-array['creadoEl','actualizadoEl'])||jsonb_build_object('pasos',pasos,'notas',notas,'pagos',coalesce(new.data->'pagos','[]'::jsonb),
  'creadoEl',coalesce(prev->>'creadoEl',stamp),'actualizadoEl',stamp);
 if octet_length(new.data::text)>250000 then raise sqlstate 'PT400' using message='El trámite alcanzó el límite de notas'; end if;
 return new;
end; $$;

drop trigger if exists fortius_inmuebles_guard_tramite on public.fortius_inmuebles_records;
create trigger fortius_inmuebles_guard_tramite before insert or update or delete on public.fortius_inmuebles_records
 for each row execute function public.fortius_inmuebles_guard_tramite();

do $$
declare definition text; fn text;
begin
 fn:='public.fortius_inmuebles_validate_record';
 select replace(pg_get_functiondef('public.fortius_inmuebles_validate_record(text,text,jsonb)'::regprocedure),chr(13),'') into definition;
 if position('validate_tramite' in definition)=0 then
  definition:=public.fortius_inmuebles_replace_once(definition,
   $m$if c='tareas' then perform public.fortius_inmuebles_validate_task(record_id,d); return; end if;$m$,
   $m$if c='tareas' then perform public.fortius_inmuebles_validate_task(record_id,d); return; end if;
  if c='tramites' then perform public.fortius_inmuebles_validate_tramite(record_id,d); return; end if;$m$,1,fn);
  execute definition;
 end if;

 fn:='public.fortius_inmuebles_delete_record';
 select replace(pg_get_functiondef('public.fortius_inmuebles_delete_record(text,text,bigint)'::regprocedure),chr(13),'') into definition;
 if position('''tramites''' in definition)=0 then
  definition:=public.fortius_inmuebles_replace_once(definition,
   $m$'archivos','contenido','config') or p_version is null$m$,
   $m$'archivos','contenido','config','tramites') or p_version is null$m$,1,fn);
  execute definition;
 end if;

 fn:='public.fortius_inmuebles_record_visible';
 select replace(pg_get_functiondef('public.fortius_inmuebles_record_visible(text,jsonb)'::regprocedure),chr(13),'') into definition;
 if position('''tramites''' in definition)=0 then
  definition:=public.fortius_inmuebles_replace_once(definition,
   $m$  if c in ('eventos','tareas','notas') and coalesce(d->>'clienteId','')<>'' then$m$,
   $m$  if c='tramites' then
    return coalesce(d->>'clienteId','')<>'' and public.fortius_inmuebles_can_access_client_id(d->>'clienteId');
  end if;
  if c in ('eventos','tareas','notas') and coalesce(d->>'clienteId','')<>'' then$m$,1,fn);
  execute definition;
 end if;

 fn:='public.fortius_inmuebles_guard_private_record';
 select replace(pg_get_functiondef('public.fortius_inmuebles_guard_private_record()'::regprocedure),chr(13),'') into definition;
 if position('''tramites''' in definition)=0 then
  definition:=public.fortius_inmuebles_replace_once(definition,
   $m$(new.collection in ('archivos','eventos','tareas','notas') and$m$,
   $m$(new.collection in ('archivos','eventos','tareas','notas','tramites') and$m$,1,fn);
  execute definition;
 end if;
end; $$;

revoke execute on function public.fortius_inmuebles_validate_tramite(text,jsonb) from public, anon;
revoke execute on function public.fortius_inmuebles_tramite_paso_nombre(text,text) from public, anon;
grant execute on function public.fortius_inmuebles_validate_tramite(text,jsonb) to authenticated, service_role;
grant execute on function public.fortius_inmuebles_tramite_paso_nombre(text,text) to authenticated, service_role;
revoke execute on function public.fortius_inmuebles_guard_tramite() from public, anon, authenticated;

drop function public.fortius_inmuebles_replace_once(text,text,text,integer,text);

notify pgrst,'reload schema';
commit;
