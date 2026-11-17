-- Trámites por tipo (boceto «Trámites», 15/11/2026; DECISIONES «Trámites»). SIN APLICAR: se aplica al integrar.
-- Hasta ahora la base solo aceptaba la cancelación de hipoteca (TRA-01, 20261114211000_tramites). Desde aquí la
-- colección «tramites» guarda también: cambio de nombre de servicios, avalúo, regularización, Catastro, Registro
-- Público y el trámite libre. Dos formas:
--  · ruta: pasos en orden (hasta 12), cada uno con su clave, su nombre (las guías están por confirmar con la fuente
--    oficial, por eso el nombre se guarda) y sus pendientes; se cierran de uno en uno como la hipoteca;
--  · partes: sin pasos (servicios y trámite libre); cada parte se marca pendiente → solicitada → lista y lleva su lista
--    de qué llevar; se pueden agregar partes; el trámite se termina o se reabre entero.
-- Un trámite que no es la hipoteca puede ir ligado a una persona, a un inmueble o a ninguno. Sin persona, lo ve quien
-- lo lleva y el director (record_visible).
--
-- La hipoteca no cambia: 8 pasos con claves fijas, acreedor, propietario obligatorio, su documento por paso, el freno
-- de la firma (ya avisado, DEC-61) y el mismo historial. Reescribe fortius_inmuebles_validate_tramite y
-- fortius_inmuebles_guard_tramite enteras (incluye lo de 20261116110000_tramites_sin_frenos: cerrar con pendientes o
-- sin documento no frena, queda escrito en el historial) y parchea por ancla el bloque de trámites de
-- fortius_inmuebles_record_visible. Se puede volver a correr. No reescribe registros.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

create or replace function public.fortius_inmuebles_tramite_tipo_nombre(tipo text)
returns text language sql immutable set search_path='' as $$
 select case tipo when 'cancelacion_hipoteca' then 'cancelación de hipoteca' when 'servicios' then 'cambio de nombre de servicios'
  when 'avaluo' then 'avalúo' when 'regularizacion' then 'regularización' when 'catastro' then 'trámite en Catastro'
  when 'registro' then 'trámite en el Registro Público' else 'trámite' end $$;

create or replace function public.fortius_inmuebles_validate_tramite(record_id text, d jsonb)
returns void language plpgsql set search_path='' as $$
declare p jsonb; x jsonb; i integer; n integer; hip boolean; claves text[]:=array['datos','liquidado','carta','notario','firma','registro','certificado','entrega']; fecha text;
begin
 if d is null or jsonb_typeof(d)<>'object' or octet_length(d::text)>250000
  or record_id is null or record_id !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$' or d->>'id' is distinct from record_id
  or coalesce(d->>'tipo','') not in ('cancelacion_hipoteca','servicios','avaluo','regularizacion','catastro','registro','libre')
  or jsonb_typeof(d->'titulo') is distinct from 'string' or length(btrim(d->>'titulo')) not between 1 and 160
  or coalesce(d->>'asesorId','') !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$'
  or (d ? 'clienteId' and jsonb_typeof(d->'clienteId')<>'string')
  or (coalesce(d->>'clienteId','')<>'' and d->>'clienteId' !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$')
  or coalesce(d->>'estado','') not in ('en_curso','terminado','cancelado')
  or jsonb_typeof(d->'pasoActual') is distinct from 'number' or (d->>'pasoActual') !~ '^[0-9]{1,2}$'
  or jsonb_typeof(d->'pasos') is distinct from 'array' or jsonb_array_length(d->'pasos')>12
  or jsonb_typeof(coalesce(d->'partes','[]'::jsonb))<>'array' or jsonb_array_length(coalesce(d->'partes','[]'::jsonb))>30
  or jsonb_typeof(coalesce(d->'notas','[]'::jsonb))<>'array' or jsonb_array_length(coalesce(d->'notas','[]'::jsonb))>1000
  or jsonb_typeof(coalesce(d->'pagos','[]'::jsonb))<>'array' or jsonb_array_length(coalesce(d->'pagos','[]'::jsonb))>30
  or (d ? 'propiedadSlug' and jsonb_typeof(d->'propiedadSlug')<>'string')
  or (d ? 'expedienteId' and jsonb_typeof(d->'expedienteId')<>'string') then
  raise sqlstate 'PT400' using message='Trámite inválido';
 end if;
 hip:=d->>'tipo'='cancelacion_hipoteca';
 n:=jsonb_array_length(d->'pasos');
 if hip then
  -- TRA-01 sin cambios: acreedor, propietario y los 8 pasos fijos.
  if coalesce(d->>'acreedor','') not in ('infonavit','banco','fovissste') or coalesce(d->>'clienteId','')='' or n<>8
   or jsonb_array_length(coalesce(d->'partes','[]'::jsonb))>0 then
   raise sqlstate 'PT400' using message='Trámite inválido'; end if;
  if jsonb_typeof(d->'firmaSinCancelacion')='object' then
   if jsonb_typeof(d->'firmaSinCancelacion'->'motivo') is distinct from 'string' or length(btrim(d->'firmaSinCancelacion'->>'motivo')) not between 10 and 1000 then
    raise sqlstate 'PT400' using message='Escribe el motivo de firmar sin la cancelación inscrita (al menos 10 caracteres)'; end if;
  elsif d ? 'firmaSinCancelacion' and jsonb_typeof(d->'firmaSinCancelacion')<>'null' then raise sqlstate 'PT400' using message='Decisión de firma inválida';
  end if;
 else
  if d ? 'acreedor' or d ? 'credito' or (d ? 'firmaSinCancelacion' and jsonb_typeof(d->'firmaSinCancelacion')<>'null') then
   raise sqlstate 'PT400' using message='Trámite inválido'; end if;
  if n>0 and jsonb_array_length(coalesce(d->'partes','[]'::jsonb))>0 then
   raise sqlstate 'PT400' using message='Un trámite lleva pasos o partes, no las dos'; end if;
 end if;
 if (d->>'pasoActual')::int>n then raise sqlstate 'PT400' using message='Paso fuera de la guía'; end if;
 if n>0 and (d->>'estado'='terminado') <> ((d->>'pasoActual')::int=n) then
  raise sqlstate 'PT400' using message='El trámite termina al cerrar el último paso'; end if;
 for i in 0..n-1 loop
  p:=d->'pasos'->i;
  if jsonb_typeof(p)<>'object' or jsonb_typeof(p->'pendientes') is distinct from 'array' or jsonb_array_length(p->'pendientes')>20
   or (hip and p->>'clave' is distinct from claves[i+1])
   or (not hip and (coalesce(p->>'clave','') !~ '^[a-z0-9][a-z0-9_-]{0,39}$'
     or jsonb_typeof(p->'nombre') is distinct from 'string' or length(btrim(p->>'nombre')) not between 1 and 120)) then
   raise sqlstate 'PT400' using message='Pasos del trámite inválidos'; end if;
  for x in select value from jsonb_array_elements(p->'pendientes') loop
   if jsonb_typeof(x)<>'object' or coalesce(x->>'id','') !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$'
    or jsonb_typeof(x->'texto') is distinct from 'string' or length(btrim(x->>'texto')) not between 1 and 300
    or jsonb_typeof(x->'hecho') is distinct from 'boolean' then raise sqlstate 'PT400' using message='Pendiente inválido'; end if;
  end loop;
 end loop;
 if exists(select 1 from jsonb_array_elements(d->'pasos') s group by s->>'clave' having count(*)>1) then
  raise sqlstate 'PT400' using message='Pasos del trámite inválidos'; end if;
 for x in select value from jsonb_array_elements(coalesce(d->'partes','[]'::jsonb)) loop
  if jsonb_typeof(x)<>'object' or coalesce(x->>'id','') !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$'
   or jsonb_typeof(x->'nombre') is distinct from 'string' or length(btrim(x->>'nombre')) not between 1 and 120
   or coalesce(x->>'estado','') not in ('pendiente','solicitado','listo')
   or (x ? 'institucion' and (jsonb_typeof(x->'institucion')<>'string' or length(x->>'institucion')>120))
   or jsonb_typeof(coalesce(x->'llevar','[]'::jsonb))<>'array' or jsonb_array_length(coalesce(x->'llevar','[]'::jsonb))>20
   or exists(select 1 from jsonb_array_elements(coalesce(x->'llevar','[]'::jsonb)) l where jsonb_typeof(l)<>'string' or length(btrim(l#>>'{}')) not between 1 and 160) then
   raise sqlstate 'PT400' using message='Parte del trámite inválida'; end if;
 end loop;
 if exists(select 1 from jsonb_array_elements(coalesce(d->'partes','[]'::jsonb)) s group by s->>'id' having count(*)>1) then
  raise sqlstate 'PT400' using message='Parte duplicada'; end if;
 for x in select value from jsonb_array_elements(coalesce(d->'notas','[]'::jsonb)) loop
  if jsonb_typeof(x)<>'object' or coalesce(x->>'id','') !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$' or coalesce(x->>'tipo','') not in ('nota','evento')
   or jsonb_typeof(x->'texto') is distinct from 'string' or length(btrim(x->>'texto')) not between 1 and 5000 then
   raise sqlstate 'PT400' using message='Nota inválida'; end if;
 end loop;
 if exists(select 1 from jsonb_array_elements(coalesce(d->'notas','[]'::jsonb)) s group by s->>'id' having count(*)>1) then
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
 prev jsonb:='{}'::jsonb; antes integer:=0; ahora integer; pasos jsonb:='[]'::jsonb; p jsonb; op jsonb; i integer; hip boolean; total integer;
 notas jsonb:='[]'::jsonb; vieja jsonb; n jsonb; eventos text[]:='{}'; texto text; k integer:=0; espera_id text; nombre text;
begin
 -- La prueba de un paso cerrado no se quita (borrar o desligar) mientras sea la única: primero se reabre el paso.
 if tg_op<>'INSERT' and old.collection='archivos' and coalesce(old.data->>'tramiteId','')<>'' and coalesce(old.data->>'pasoClave','')<>''
   and (tg_op='DELETE' or new.data->>'tramiteId' is distinct from old.data->>'tramiteId' or new.data->>'pasoClave' is distinct from old.data->>'pasoClave')
   and exists(select 1 from public.fortius_inmuebles_records t where t.collection='tramites' and t.id=old.data->>'tramiteId'
     and (t.data->>'pasoActual')::int > coalesce((select e.ord::int-1 from jsonb_array_elements(t.data->'pasos') with ordinality e(v,ord)
       where e.v->>'clave'=old.data->>'pasoClave' limit 1),99))
   and not exists(select 1 from public.fortius_inmuebles_records a where a.collection='archivos' and a.id<>old.id
     and a.data->>'tramiteId'=old.data->>'tramiteId' and a.data->>'pasoClave'=old.data->>'pasoClave') then
  raise sqlstate 'PT409' using message='Este documento cerró un paso del trámite; reabre el paso antes de quitarlo';
 end if;
 if tg_op='DELETE' and old.collection='archivos' then return old; end if;
 -- Documentos del trámite: solo de un trámite existente de la misma persona (o de ninguna, si el trámite no tiene).
 if tg_op<>'DELETE' and new.collection='archivos' then
  if coalesce(new.data->>'tramiteId','')<>'' and not exists(select 1 from public.fortius_inmuebles_records t
    where t.collection='tramites' and t.id=new.data->>'tramiteId' and coalesce(t.data->>'clienteId','')=coalesce(new.data->>'clienteId','')) then
   raise sqlstate 'PT400' using message='El documento debe ser de un trámite del mismo cliente';
  end if;
  -- Los comprobantes del trámite (saldo, cartas, escrituras) solo viven en el almacenamiento privado.
  if coalesce(new.data->>'tramiteId','')<>'' and (coalesce(new.data->>'visibility','')<>'private'
    or coalesce(new.data->>'bucket','fortius-inmuebles-private')<>'fortius-inmuebles-private'
    or coalesce(new.data->>'url','') ~* '/storage/v1/object/public/') then
   raise sqlstate 'PT400' using message='Los documentos de un trámite van al archivo privado';
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
 hip:=new.data->>'tipo'='cancelacion_hipoteca';
 total:=jsonb_array_length(new.data->'pasos');
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
 if tg_op='UPDATE' and old.data->>'tipo' is distinct from new.data->>'tipo' then
  raise sqlstate 'PT400' using message='El tipo de trámite no cambia; abre otro trámite'; end if;
 -- Ligado a una venta: solo el director lo desliga o decide firmar sin la cancelación.
 if not admin and tg_op='UPDATE' and coalesce(old.data->>'expedienteId','')<>'' and new.data->>'expedienteId' is distinct from old.data->>'expedienteId' then
  raise sqlstate 'PT403' using message='Solo el director desliga un trámite de su operación'; end if;
 if (jsonb_typeof(new.data->'firmaSinCancelacion')='object') is distinct from (jsonb_typeof(prev->'firmaSinCancelacion')='object')
   or btrim(new.data->'firmaSinCancelacion'->>'motivo') is distinct from btrim(prev->'firmaSinCancelacion'->>'motivo') then
  if not admin then raise sqlstate 'PT403' using message='Solo el director decide firmar la venta sin la cancelación inscrita'; end if;
  if jsonb_typeof(new.data->'firmaSinCancelacion')='object' then
   new.data:=jsonb_set(new.data,'{firmaSinCancelacion}',jsonb_build_object('motivo',btrim(new.data->'firmaSinCancelacion'->>'motivo'),'autorizadoPor',actor::text,'autorizadoEl',stamp));
   eventos:=eventos||('El director autorizó firmar la venta sin la cancelación inscrita: '||btrim(new.data->'firmaSinCancelacion'->>'motivo'));
  else
   new.data:=new.data-'firmaSinCancelacion';
   eventos:=eventos||'El director retiró la autorización de firmar sin la cancelación inscrita'::text;
  end if;
 elsif jsonb_typeof(prev->'firmaSinCancelacion')='object' then
  new.data:=jsonb_set(new.data,'{firmaSinCancelacion}',prev->'firmaSinCancelacion');
 else
  new.data:=new.data-'firmaSinCancelacion';
 end if;
 if tg_op='UPDATE' and old.data->>'acreedor' is distinct from new.data->>'acreedor' then
  raise sqlstate 'PT400' using message='El acreedor no cambia; abre otro trámite'; end if;
 if tg_op='UPDATE' and old.data->>'estado'='cancelado' and ahora<>antes then
  raise sqlstate 'PT400' using message='Un trámite cancelado no avanza'; end if;
 if abs(ahora-antes)>1 then raise sqlstate 'PT400' using message='Los pasos se cierran de uno en uno'; end if;
 if tg_op='UPDATE' and jsonb_array_length(old.data->'pasos')<>total then
  raise sqlstate 'PT400' using message='Los pasos de un trámite no se cambian'; end if;
 -- Pasos: ni su nombre ni sus pendientes cambian de texto; el cierre lo sella la base.
 for i in 0..total-1 loop
  p:=new.data->'pasos'->i; op:=case when tg_op='UPDATE' then old.data->'pasos'->i else null end;
  if op is not null and ((p->>'clave') is distinct from (op->>'clave') or (p->>'nombre') is distinct from (op->>'nombre')
     or (select coalesce(jsonb_agg(x-'hecho'),'[]') from jsonb_array_elements(p->'pendientes') x)
     is distinct from (select coalesce(jsonb_agg(x-'hecho'),'[]') from jsonb_array_elements(op->'pendientes') x)) then
   raise sqlstate 'PT400' using message='Los pendientes de un paso no se cambian'; end if;
  p:=(p-'cerradoEl'-'cerradoPor')||jsonb_strip_nulls(jsonb_build_object('cerradoEl',op->'cerradoEl','cerradoPor',op->'cerradoPor'));
  pasos:=pasos||jsonb_build_array(p);
 end loop;
 if ahora=antes+1 then
  p:=pasos->antes;
  nombre:=case when hip then public.fortius_inmuebles_tramite_paso_nombre(new.data->>'acreedor',p->>'clave') else p->>'nombre' end;
  -- SIN-FRENOS (DEC-61): lo que falta no frena; queda dicho en el historial.
  texto:='';
  if exists(select 1 from jsonb_array_elements(p->'pendientes') x where x->'hecho'<>'true'::jsonb) then
   texto:=' con pendientes sin hacer'; end if;
  if hip and p->>'clave' in ('liquidado','carta','certificado') and not exists(select 1 from public.fortius_inmuebles_records a
    where a.collection='archivos' and a.data->>'tramiteId'=new.id and a.data->>'pasoClave'=p->>'clave') then
   texto:=texto||case when texto='' then ' sin su documento' else ' y sin su documento' end; end if;
  pasos:=jsonb_set(pasos,array[antes::text],p||jsonb_build_object('cerradoEl',stamp,'cerradoPor',actor::text));
  eventos:=eventos||('Se cerró el paso «'||nombre||'»'||texto);
 elsif ahora=antes-1 then
  p:=pasos->ahora;
  nombre:=case when hip then public.fortius_inmuebles_tramite_paso_nombre(new.data->>'acreedor',p->>'clave') else p->>'nombre' end;
  pasos:=jsonb_set(pasos,array[ahora::text],p-'cerradoEl'-'cerradoPor');
  eventos:=eventos||('Se reabrió el paso «'||nombre||'»');
 end if;
 -- Partes (servicios, trámite libre): cada cambio queda en el historial.
 if not hip then
  for n in select value from jsonb_array_elements(coalesce(new.data->'partes','[]'::jsonb)) loop
   select value into vieja from jsonb_array_elements(coalesce(prev->'partes','[]'::jsonb)) where value->>'id'=n->>'id';
   if vieja is null then
    if tg_op='UPDATE' then eventos:=eventos||('Se agregó «'||btrim(n->>'nombre')||'»'); end if;
   elsif (n->>'estado') is distinct from (vieja->>'estado') then
    eventos:=eventos||(btrim(n->>'nombre')||case when vieja->>'estado'='listo' then ': reabierto' when n->>'estado'='solicitado' then ': solicitado' when n->>'estado'='listo' then ': listo' else ': pendiente' end);
   end if;
   vieja:=null;
  end loop;
  for vieja in select value from jsonb_array_elements(coalesce(prev->'partes','[]'::jsonb)) loop
   if not exists(select 1 from jsonb_array_elements(coalesce(new.data->'partes','[]'::jsonb)) x where x->>'id'=vieja->>'id') then
    eventos:=eventos||('Se quitó «'||btrim(vieja->>'nombre')||'»'); end if;
  end loop;
  vieja:=null;
  if total=0 and tg_op='UPDATE' and new.data->>'estado'='terminado' and prev->>'estado'='en_curso' then eventos:=eventos||'Trámite terminado'::text; end if;
  if total=0 and tg_op='UPDATE' and new.data->>'estado'='en_curso' and prev->>'estado'='terminado' then eventos:=eventos||'Se reabrió el trámite'::text; end if;
 end if;
 -- Espera: crea la tarea de volver a preguntar.
 if jsonb_typeof(new.data->'espera')='object' and (new.data->'espera') is distinct from (prev->'espera') then
  espera_id:='tramite-'||new.id||'-espera-'||replace(new.data->'espera'->>'volver','-','');
  if length(espera_id)>160 then espera_id:='tramite-espera-'||md5(new.id||(new.data->'espera'->>'volver')); end if;
  update public.fortius_inmuebles_records set data=data||jsonb_build_object('estado','completada')
   where collection='tareas' and data->>'tramiteId'=new.id and data->>'estado'='pendiente'
     and (id like 'tramite-%-espera-%' or id like 'tramite-espera-%') and id<>espera_id;
  insert into public.fortius_inmuebles_records(collection,id,data) values('tareas',espera_id,jsonb_strip_nulls(jsonb_build_object(
   'id',espera_id,'titulo',left('Volver a preguntar a '||(new.data->'espera'->>'quien')||' · '||(new.data->>'titulo'),160),
   'descripcion','Trámite de '||public.fortius_inmuebles_tramite_tipo_nombre(new.data->>'tipo')||' en espera desde el '||(new.data->'espera'->>'desde')||'.',
   'categoria','documentacion','estado','pendiente','prioridad','normal','pasos','[]'::jsonb,
   'asesorId',new.data->>'asesorId','clienteId',nullif(new.data->>'clienteId',''),'propiedadSlug',nullif(new.data->>'propiedadSlug',''),
   'tramiteId',new.id,'vence',new.data->'espera'->>'volver')))
  on conflict (collection,id) do update set data=fortius_inmuebles_records.data||jsonb_build_object('estado','pendiente')
   where fortius_inmuebles_records.data->>'estado'='completada';
  eventos:=eventos||('Quedó en espera de '||(new.data->'espera'->>'quien')||'; volver a preguntar el '||to_char((new.data->'espera'->>'volver')::date,'DD/MM/YYYY'));
 elsif jsonb_typeof(prev->'espera')='object' and jsonb_typeof(new.data->'espera') is distinct from 'object' then
  update public.fortius_inmuebles_records set data=data||jsonb_build_object('estado','completada')
   where collection='tareas' and data->>'tramiteId'=new.id and data->>'estado'='pendiente'
     and (id like 'tramite-%-espera-%' or id like 'tramite-espera-%');
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
  'creadoEl',coalesce(prev->>'creadoEl',stamp),'actualizadoEl',stamp)
  ||case when hip then '{}'::jsonb else jsonb_build_object('partes',coalesce(new.data->'partes','[]'::jsonb)) end;
 if octet_length(new.data::text)>250000 then raise sqlstate 'PT400' using message='El trámite alcanzó el límite de notas'; end if;
 return new;
end; $$;

-- Quién ve un trámite sin persona: quien lo lleva (y el director, que ve todo).
do $$
declare definition text;
 anchor text := $m$  if c='tramites' then
    return coalesce(d->>'clienteId','')<>'' and public.fortius_inmuebles_can_access_client_id(d->>'clienteId');
  end if;$m$;
 replacement text := $m$  if c='tramites' then
    -- TRAMITES-POR-TIPO: sin persona, lo ve quien lo lleva.
    if coalesce(d->>'clienteId','')='' then
      return coalesce(d->>'asesorId','')<>'' and d->>'asesorId'=public.fortius_inmuebles_current_asesor_id();
    end if;
    return public.fortius_inmuebles_can_access_client_id(d->>'clienteId');
  end if;$m$;
begin
 select replace(pg_get_functiondef('public.fortius_inmuebles_record_visible(text,jsonb)'::regprocedure),chr(13),'') into definition;
 if position('TRAMITES-POR-TIPO' in definition)>0 then return; end if;
 if (length(definition)-length(replace(definition,anchor,'')))/length(anchor)<>1 then
  raise exception 'Unexpected process function public.fortius_inmuebles_record_visible';
 end if;
 execute replace(definition,anchor,replacement);
end; $$;

-- Solo la cancelación de hipoteca frena (avisa) la firma de la venta; las demás guías no.
create or replace function public.fortius_inmuebles_tramites_que_frenan_firma(p_expediente uuid)
returns integer language sql stable security definer set search_path='' as $$
 select case when public.fortius_inmuebles_is_staff() and public.fortius_inmuebles_can_access_expediente(p_expediente) then
  (select count(*)::integer from public.fortius_inmuebles_records t where t.collection='tramites' and t.data->>'expedienteId'=p_expediente::text
    and t.data->>'tipo'='cancelacion_hipoteca'
    and (t.data->>'pasoActual')::int < 6 and jsonb_typeof(t.data->'firmaSinCancelacion') is distinct from 'object')
 else 0 end $$;

revoke execute on function public.fortius_inmuebles_tramite_tipo_nombre(text) from public, anon;
grant execute on function public.fortius_inmuebles_tramite_tipo_nombre(text) to authenticated, service_role;
revoke execute on function public.fortius_inmuebles_validate_tramite(text,jsonb) from public, anon;
grant execute on function public.fortius_inmuebles_validate_tramite(text,jsonb) to authenticated, service_role;
revoke execute on function public.fortius_inmuebles_guard_tramite() from public, anon, authenticated;
revoke execute on function public.fortius_inmuebles_tramites_que_frenan_firma(uuid) from public, anon;
grant execute on function public.fortius_inmuebles_tramites_que_frenan_firma(uuid) to authenticated, service_role;

notify pgrst,'reload schema';
commit;
