-- FLX-03, parte B (DEC-55, titular 15/11/2026): el riel según el tipo de asunto.
-- 1. La guía del asunto acepta «guia»: inspección, opinión de valor o cancelación de hipoteca, con
--    su paso. La etapa de la base no se mueve para estas guías; la venta y la renta siguen igual.
-- 2. El tipo se puede cambiar aunque el asunto esté avanzado: lo hecho se conserva (requisitos,
--    documentos, formatos, notas) y el cambio queda en el historial. Cambiar de venta a renta ya no
--    cuenta como cambio de inmueble o cliente: no reinicia revisiones ni firmas.
-- 3. Un asunto puede empezar en cualquier etapa; lo que quedó atrás queda como aviso.
-- 4. Cerrar un paso de un trámite ligado mueve el paso del asunto de cancelación de hipoteca, para
--    que su riel diga lo mismo que el del trámite.
-- Quien busca comprar o rentar sigue como interesado hasta FLX-04 (RP-93). No reescribe registros.
begin;
set local lock_timeout='2s';
set local statement_timeout='30s';
select pg_advisory_xact_lock(781023);

create or replace function public.fortius_inmuebles_replace_once(definition text, anchor text, replacement text, expected integer, fn text)
returns text language plpgsql immutable set search_path='' as $$
begin
 if (length(definition)-length(replace(definition,anchor,'')))/length(anchor)<>expected then
  raise exception 'Unexpected process function %', fn;
 end if;
 return replace(definition,anchor,replacement);
end; $$;

-- Nombres en palabras para el historial (los mismos de la pantalla, src/lib/guias.ts y src/lib/tramites.ts).
create or replace function public.fortius_inmuebles_tipo_nombre(flujo jsonb, operacion text) returns text
language sql immutable set search_path='' as $$
 select case coalesce(flujo->'guia'->>'clave','')
  when 'inspeccion' then 'Inspección' when 'opinion_valor' then 'Opinión de valor' when 'cancelacion_hipoteca' then 'Cancelación de hipoteca'
  else case flujo->>'ruta' when 'arrendador' then 'Renta' when 'compra' then 'Compra' when 'arrendatario' then 'Búsqueda de renta'
   when 'inversion' then 'Inversión' when 'captacion' then 'Venta'
   else case operacion when 'renta' then 'Renta' when 'inversion' then 'Inversión' else 'Venta' end end end $$;

create or replace function public.fortius_inmuebles_guia_etapas(guia jsonb) returns text[]
language sql immutable set search_path='' as $$
 select case guia->>'clave'
  when 'inspeccion' then array['Solicitud y alcance','Visita al inmueble','Hallazgos con fotos','Informe entregado']
  when 'opinion_valor' then array['Entrevista','Levantamiento','Documentos','Opinión entregada']
  when 'cancelacion_hipoteca' then case coalesce(guia->>'acreedor','banco')
   when 'infonavit' then array['Datos del crédito','Crédito liquidado','Carta de instrucción','Validación de Infonavit','Pago de derechos','Registro Público','Certificado de gravámenes','Entrega']
   when 'fovissste' then array['Datos del crédito','Crédito liquidado','Carta de finiquito','Pago de derechos','Instrumento de cancelación','Registro Público','Certificado de gravámenes','Entrega']
   else array['Datos del crédito','Crédito liquidado','Carta de finiquito','Notario y presupuesto','Firma ante notario','Registro Público','Certificado de gravámenes','Entrega'] end
 end $$;
revoke all on function public.fortius_inmuebles_tipo_nombre(jsonb,text) from public,anon,authenticated;
revoke all on function public.fortius_inmuebles_guia_etapas(jsonb) from public,anon,authenticated;

do $$
declare definition text; fn text:='public.fortius_inmuebles_guard_guided_operation';
begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_guided_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('FLX-03b' in definition)>0 then return; end if;
 -- 2. Un asunto avanzado cambia de tipo solo por fortius_inmuebles_change_operation_type, que no mueve
 --    la etapa; el cambio se anota en el historial (fortius_yy_registrar_tipo). Una escritura directa que
 --    cambie la operación sigue rechazándose: así no se salta lo de una venta cambiando de tipo y etapa.
 definition:=public.fortius_inmuebles_replace_once(definition,
  'raise sqlstate ''PT409'' using message=''No cambies el tipo de una operación avanzada; conserva su historial'';',
  'if coalesce(current_setting(''fortius.cambio_tipo'',true),'''')<>''on'' or new.etapa is distinct from old.etapa then /* FLX-03b */
       raise sqlstate ''PT409'' using message=''Cambia el tipo del asunto desde «Ajustes»; conserva su historial'';
     end if;',1,fn);
 definition:=public.fortius_inmuebles_replace_once(definition,
  '(new.flujo->>''ruta'' is distinct from old.flujo->>''ruta'' or new.flujo->>''contraparteId''',
  '(new.flujo->>''contraparteId''',1,fn);
 -- 1. «guia» se valida antes que el resto de las llaves.
 definition:=public.fortius_inmuebles_replace_once(definition,
  '''visitasPrevias'',''captadoPor'')) then',
  '''visitasPrevias'',''captadoPor'',''guia'')) then',1,fn);
 definition:=public.fortius_inmuebles_replace_once(definition,
  '   if exists(select 1 from jsonb_object_keys(new.flujo) key where key not in (',
  '   if new.flujo ? ''guia'' and (new.operacion not in (''venta'',''renta'') or new.flujo->>''ruta'' not in (''captacion'',''arrendador'')
     or jsonb_typeof(new.flujo->''guia'')<>''object''
     or exists(select 1 from jsonb_object_keys(new.flujo->''guia'') x where x not in (''clave'',''paso'',''acreedor''))
     or coalesce(new.flujo->''guia''->>''clave'','''') not in (''inspeccion'',''opinion_valor'',''cancelacion_hipoteca'')
     or jsonb_typeof(new.flujo->''guia''->''paso'') is distinct from ''number'' or (new.flujo->''guia''->>''paso'') !~ ''^\d{1,2}$''
     or (new.flujo->''guia''->>''paso'')::int>=cardinality(public.fortius_inmuebles_guia_etapas(new.flujo->''guia''))
     or (new.flujo->''guia'' ? ''acreedor'' and (new.flujo->''guia''->>''clave''<>''cancelacion_hipoteca'' or new.flujo->''guia''->>''acreedor'' not in (''infonavit'',''banco'',''fovissste'')))) then
     raise sqlstate ''PT400'' using message=''Guía del asunto inválida'';
   end if;
   if exists(select 1 from jsonb_object_keys(new.flujo) key where key not in (',1,fn);
 -- Una guía propia avanza por su paso: al archivarla solo se revisan sus tareas pendientes.
 definition:=public.fortius_inmuebles_replace_once(definition,
  '     if new.flujo is null then
       perform public.fortius_inmuebles_avisar(new.id,''La guía del asunto'');',
  '     if new.flujo ? ''guia'' then
       if new.etapa=''cerrado'' and exists(select 1 from public.fortius_inmuebles_records t where t.collection=''tareas'' and t.data->>''expedienteId''=new.id::text and t.data->>''estado'' not in (''completada'',''cancelada'')) then
         perform public.fortius_inmuebles_avisar(new.id,''Resolver o descartar las tareas pendientes''); end if;
     elsif new.flujo is null then
       perform public.fortius_inmuebles_avisar(new.id,''La guía del asunto'');',1,fn);
 -- 3. Empezar en otra etapa: se guarda y queda el aviso de lo que quedó atrás.
 definition:=public.fortius_inmuebles_replace_once(definition,
  'if tg_op=''INSERT'' and new.etapa<>''captacion'' then raise sqlstate ''PT409'' using message=''La operación inicia en captación o perfil''; end if;',
  'if tg_op=''INSERT'' and new.etapa<>''captacion'' then perform public.fortius_inmuebles_avisar(new.id,''Las etapas anteriores a «''||public.fortius_inmuebles_etapa_nombre(new.etapa)||''»''); end if;',1,fn);
 execute definition;
end $$;

do $$
declare definition text; fn text:='public.fortius_inmuebles_guard_rent_progress';
begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_rent_progress()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('FLX-03b' in definition)>0 then return; end if;
 definition:=public.fortius_inmuebles_replace_once(definition,
  'if new.etapa<>''captacion'' then raise sqlstate ''PT409'' using message=''El arrendamiento inicia en captación o perfil''; end if;',
  'if new.etapa<>''captacion'' then /* FLX-03b */ perform public.fortius_inmuebles_avisar(new.id,''Las etapas anteriores a «''||public.fortius_inmuebles_etapa_nombre(new.etapa)||''»''); end if;',1,fn);
 definition:=public.fortius_inmuebles_replace_once(definition,
  'if new.operacion<>''renta'' then return new; end if;',
  'if new.operacion<>''renta'' or (tg_op=''UPDATE'' and new.flujo ? ''guia'') then return new; end if;',1,fn);
 execute definition;
end $$;

-- El arranque del propietario (02, 04 y lista de documentos) no aplica a una guía propia.
do $$
declare definition text; fn text:='public.fortius_inmuebles_guard_initial_gate';
begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_initial_gate()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('FLX-03b' in definition)>0 then return; end if;
 definition:=public.fortius_inmuebles_replace_once(definition,
  'if new.operacion not in (''venta'',''renta'') or',
  'if new.operacion not in (''venta'',''renta'') /* FLX-03b */ or new.flujo ? ''guia'' or',1,fn);
 execute definition;
end $$;

-- Cambio de tipo y paso de la guía, en palabras. Corre antes de anotar los avisos (zz).
create or replace function public.fortius_inmuebles_registrar_tipo() returns trigger
language plpgsql security definer set search_path='' as $$
declare antes text; ahora text; etapas text[]; paso_antes int; paso_ahora int;
begin
 if auth.uid() is null or new.flujo is null then return null; end if;
 if tg_op='INSERT' then
  if new.flujo ? 'guia' and (new.flujo->'guia'->>'paso')::int>0 then
   perform public.fortius_inmuebles_avisar(new.id,'Las etapas anteriores a «'||(public.fortius_inmuebles_guia_etapas(new.flujo->'guia'))[(new.flujo->'guia'->>'paso')::int+1]||'»');
  end if;
  return null;
 end if;
 antes:=public.fortius_inmuebles_tipo_nombre(old.flujo,old.operacion); ahora:=public.fortius_inmuebles_tipo_nombre(new.flujo,new.operacion);
 if antes is distinct from ahora then
  insert into public.fortius_inmuebles_expediente_actividad(expediente_id,tipo,descripcion,created_by,detalle)
  values(new.id,'cambio','Cambió el tipo del asunto de «'||antes||'» a «'||ahora||'». Lo hecho se conserva.',auth.uid(),
   jsonb_build_object('tipoAnterior',antes,'tipo',ahora,'etapa',new.etapa));
  return null;
 end if;
 if new.flujo ? 'guia' then
  etapas:=public.fortius_inmuebles_guia_etapas(new.flujo->'guia');
  paso_ahora:=(new.flujo->'guia'->>'paso')::int; paso_antes:=coalesce((old.flujo->'guia'->>'paso')::int,0);
  if paso_ahora<>paso_antes then
   insert into public.fortius_inmuebles_expediente_actividad(expediente_id,tipo,descripcion,created_by,detalle)
   values(new.id,'cambio','Pasó a «'||etapas[paso_ahora+1]||'»',auth.uid(),jsonb_build_object('guia',new.flujo->'guia'->>'clave','paso',paso_ahora));
   if paso_ahora>paso_antes+1 then
    perform public.fortius_inmuebles_avisar(new.id,'Las etapas intermedias');
   end if;
  end if;
 end if;
 return null;
end; $$;
revoke all on function public.fortius_inmuebles_registrar_tipo() from public,anon,authenticated;
drop trigger if exists fortius_yy_registrar_tipo on public.fortius_inmuebles_expedientes;
create trigger fortius_yy_registrar_tipo after insert or update on public.fortius_inmuebles_expedientes
  for each row execute function public.fortius_inmuebles_registrar_tipo();

-- 4. El trámite mueve el paso del asunto de cancelación de hipoteca que tiene ligado.
create or replace function public.fortius_inmuebles_tramite_mueve_guia() returns trigger
language plpgsql security definer set search_path='' as $$
declare e record; paso int;
begin
 if new.collection<>'tramites' or coalesce(new.data->>'expedienteId','')='' then return null; end if;
 if tg_op='UPDATE' and new.data->'pasoActual' is not distinct from old.data->'pasoActual' and new.data->>'expedienteId' is not distinct from old.data->>'expedienteId' then return null; end if;
 select x.id,x.flujo into e from public.fortius_inmuebles_expedientes x
  where x.id::text=new.data->>'expedienteId' and x.deleted_at is null and x.flujo->'guia'->>'clave'='cancelacion_hipoteca' for update;
 if not found then return null; end if;
 paso:=least(coalesce((new.data->>'pasoActual')::int,0),cardinality(public.fortius_inmuebles_guia_etapas(e.flujo->'guia'))-1);
 if (e.flujo->'guia'->>'paso')::int=paso then return null; end if;
 update public.fortius_inmuebles_expedientes set flujo=jsonb_set(flujo,'{guia,paso}',to_jsonb(paso)),version=version+1 where id=e.id;
 return null;
end; $$;
revoke all on function public.fortius_inmuebles_tramite_mueve_guia() from public,anon,authenticated;
drop trigger if exists fortius_tramite_mueve_guia on public.fortius_inmuebles_records;
create trigger fortius_tramite_mueve_guia after insert or update on public.fortius_inmuebles_records
  for each row execute function public.fortius_inmuebles_tramite_mueve_guia();

-- 2. Cambiar el tipo en una sola escritura (operación y guía juntas), con el control de versión
--    y los permisos de siempre: corre como quien lo pide y la guía de la base lo valida.
create or replace function public.fortius_inmuebles_change_operation_type(p_id uuid,p_version bigint,p_operacion text,p_flow jsonb)
returns jsonb language plpgsql set search_path='' as $$
declare r public.fortius_inmuebles_expedientes;
begin
 if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida'; end if;
 if not public.fortius_inmuebles_is_staff() then raise sqlstate 'PT403' using message='Acceso no autorizado'; end if;
 if p_version is null or p_version<=0 or p_flow is null or p_operacion not in ('venta','renta') then raise sqlstate 'PT400' using message='Tipo de asunto inválido'; end if;
 perform pg_catalog.pg_advisory_xact_lock(781023);
 perform pg_catalog.set_config('fortius.cambio_tipo','on',true);
 update public.fortius_inmuebles_expedientes e set operacion=p_operacion,flujo=p_flow,version=e.version+1
  where e.id=p_id and e.version=p_version and e.deleted_at is null returning e.* into r;
 if not found then raise sqlstate 'PT409' using message='El expediente cambió o no está disponible'; end if;
 perform pg_catalog.set_config('fortius.cambio_tipo','off',true);
 return to_jsonb(r);
end; $$;
revoke all on function public.fortius_inmuebles_change_operation_type(uuid,bigint,text,jsonb) from public,anon,service_role;
grant execute on function public.fortius_inmuebles_change_operation_type(uuid,bigint,text,jsonb) to authenticated;

drop function public.fortius_inmuebles_replace_once(text,text,text,integer,text);
notify pgrst, 'reload schema';
commit;
