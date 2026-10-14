begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);
alter table public.fortius_inmuebles_expedientes drop constraint fortius_inmuebles_expedientes_operacion_check;
alter table public.fortius_inmuebles_expedientes add constraint fortius_inmuebles_expedientes_operacion_check check(operacion in ('venta','renta','inversion','administracion','otra'));

create function public.fortius_inmuebles_intake_route(intent text) returns text
language sql immutable set search_path='' as $body$
 select case intent when 'vender' then 'captacion' when 'comprar' then 'compra' when 'arrendar' then 'arrendador' when 'rentar' then 'arrendatario' when 'invertir' then 'inversion' end;
$body$;
revoke all on function public.fortius_inmuebles_intake_route(text) from public,anon,authenticated,service_role;

create or replace function public.fortius_inmuebles_flow_required(route text,stage text) returns text[]
language plpgsql immutable set search_path='' as $body$
declare n integer:=array_position(array['captacion','documentacion','comercializacion','negociacion','cierre','entrega','postventa','cerrado'],stage)-1; keys text[]; owner boolean:=route in ('captacion','arrendador'); rent boolean:=route in ('arrendador','arrendatario');
begin
 if n<=0 then return array[]::text[];end if;
 if route='inversion' then
  keys:=array['perfil','privacidad'];
  if n>=2 then keys:=keys||array['criterios_inversion'];end if;
  if n>=3 then keys:=keys||array['riesgos_inversion'];end if;
  if n>=4 then keys:=keys||array['escenarios_inversion','capacidad'];end if;
  if n>=5 then keys:=keys||array['decision_inversion','ejecucion_inversion'];end if;
  if n>=6 then keys:=keys||array['seguimiento_inversion'];end if;
  if n>=7 then keys:=keys||array['honorarios','archivo'];end if;
  return keys;
 end if;
 keys:=case when owner then array['entrevista'] else array['perfil','privacidad'] end;
 if n>=2 then keys:=keys||case when owner then array['titularidad','factibilidad','valor','precio','intermediacion','levantamiento','plan','publicacion'] else array['opciones'] end;end if;
 if n>=3 then keys:=keys||case when owner then case when rent then array['arrendatario'] else array['comprador'] end else array['visitas','capacidad'] end;end if;
 if n>=4 then keys:=keys||case when rent then array['oferta','revision_cierre','contrato_renta','contraparte','garantias_renta'] else array['oferta','revision_cierre','instrumento','contraparte'] end;end if;
 if n>=5 then keys:=keys||array['firma','pago'];end if;
 if n>=6 then keys:=keys||case when rent then array['entrega','inventario_entrega'] else array['entrega'] end;end if;
 if n>=7 then keys:=keys||case when rent then array['termino_renta','honorarios','archivo'] else array['registro','honorarios','archivo'] end;end if;
 return keys;
end; $body$;
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_guided_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('new.operacion<>''venta'' or jsonb_typeof(new.flujo)' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,'new.operacion<>''venta'' or jsonb_typeof(new.flujo)','new.operacion not in (''venta'',''renta'',''inversion'') or (new.flujo->>''ruta'' in (''captacion'',''compra'') and new.operacion<>''venta'') or (new.flujo->>''ruta'' in (''arrendador'',''arrendatario'') and new.operacion<>''renta'') or (new.flujo->>''ruta''=''inversion'' and new.operacion<>''inversion'') or jsonb_typeof(new.flujo)');
 if position('new.flujo->>''ruta'' not in (''captacion'',''compra'')' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,'new.flujo->>''ruta'' not in (''captacion'',''compra'')','new.flujo->>''ruta'' not in (''captacion'',''compra'',''arrendador'',''arrendatario'',''inversion'')');
 if position('new.flujo->>''ruta''=''captacion''' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,'new.flujo->>''ruta''=''captacion''','new.flujo->>''ruta'' in (''captacion'',''arrendador'')');
 if position('k not in (''entrevista'',' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,'k not in (''entrevista'',','k not in (''arrendatario'',''contrato_renta'',''garantias_renta'',''inventario_entrega'',''termino_renta'',''criterios_inversion'',''escenarios_inversion'',''riesgos_inversion'',''decision_inversion'',''ejecucion_inversion'',''seguimiento_inversion'',''entrevista'',');
 if position('k not in (''registro'',''honorarios'')' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,'k not in (''registro'',''honorarios'')','k not in (''registro'',''honorarios'',''garantias_renta'')');
 if position('e.operacion=''venta''' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,'e.operacion=''venta''','e.operacion=new.operacion');
 if position('if new.operacion=''venta'' then' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,'if new.operacion=''venta'' then','if new.operacion in (''venta'',''renta'',''inversion'') then');
 if position('if new_stage>=4 and new.propiedad_slug is null' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,'if new_stage>=4 and new.propiedad_slug is null','if new.flujo->>''ruta''<>''inversion'' and new_stage>=4 and new.propiedad_slug is null');
 if position('if new_stage>=5 and counterpart' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,'if new_stage>=5 and counterpart','if new.flujo->>''ruta''<>''inversion'' and new_stage>=5 and counterpart');
 execute definition;
end; $$;
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_flow_review_ok(jsonb,text)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('key in (''registro'',''honorarios'')' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_flow_review_ok';end if;
 definition:=replace(definition,'key in (''registro'',''honorarios'')','key in (''registro'',''honorarios'',''garantias_renta'')');
 execute definition;
end; $$;
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_flow_publish_ready(uuid)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('e.operacion=''venta''' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_flow_publish_ready';end if;
 definition:=replace(definition,'e.operacion=''venta''','e.operacion in (''venta'',''renta'')');
 if position('e.flujo->>''ruta''=''captacion''' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_flow_publish_ready';end if;
 definition:=replace(definition,'e.flujo->>''ruta''=''captacion''','e.flujo->>''ruta'' in (''captacion'',''arrendador'')');
 if position('public.fortius_inmuebles_flow_required(''captacion'',''comercializacion'')' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_flow_publish_ready';end if;
 definition:=replace(definition,'public.fortius_inmuebles_flow_required(''captacion'',''comercializacion'')','public.fortius_inmuebles_flow_required(e.flujo->>''ruta'',''comercializacion'')');
 execute definition;
end; $$;
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_start_intake(uuid,text,jsonb,uuid)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('case when p_intent in (''arrendar'',''rentar'') then ''renta'' else ''venta'' end' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_start_intake';end if;
 definition:=replace(definition,'case when p_intent in (''arrendar'',''rentar'') then ''renta'' else ''venta'' end','case when p_intent in (''arrendar'',''rentar'') then ''renta'' when p_intent=''invertir'' then ''inversion'' else ''venta'' end');
 if position('case when p_intent in (''vender'',''arrendar'') then ''captacion'' else ''compra'' end' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_start_intake';end if;
 definition:=replace(definition,'case when p_intent in (''vender'',''arrendar'') then ''captacion'' else ''compra'' end','public.fortius_inmuebles_intake_route(p_intent)');
 execute definition;
end; $$;
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_save_intake(uuid,bigint,jsonb,boolean)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('case when r.intencion in (''arrendar'',''rentar'') then null else jsonb_build_object(''version'',1,''ruta'',case when r.intencion=''vender'' then ''captacion'' else ''compra'' end,''estado'',''activa'',''motivo'','''',''requisitos'',''{}''::jsonb) end' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_save_intake';end if;
 definition:=replace(definition,'case when r.intencion in (''arrendar'',''rentar'') then null else jsonb_build_object(''version'',1,''ruta'',case when r.intencion=''vender'' then ''captacion'' else ''compra'' end,''estado'',''activa'',''motivo'','''',''requisitos'',''{}''::jsonb) end','jsonb_build_object(''version'',1,''ruta'',public.fortius_inmuebles_intake_route(r.intencion),''estado'',''activa'',''motivo'','''',''requisitos'',''{}''::jsonb)');
 if position('case when r.intencion in (''arrendar'',''rentar'') then ''renta'' else ''venta'' end' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_save_intake';end if;
 definition:=replace(definition,'case when r.intencion in (''arrendar'',''rentar'') then ''renta'' else ''venta'' end','case when r.intencion in (''arrendar'',''rentar'') then ''renta'' when r.intencion=''invertir'' then ''inversion'' else ''venta'' end');
 if position('if e.operacion=''venta'' then' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_save_intake';end if;
 definition:=replace(definition,'if e.operacion=''venta'' then','if e.operacion in (''venta'',''renta'',''inversion'') then');
 if position('case when r.intencion=''vender'' then ''captacion'' else ''compra'' end' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_save_intake';end if;
 definition:=replace(definition,'case when r.intencion=''vender'' then ''captacion'' else ''compra'' end','public.fortius_inmuebles_intake_route(r.intencion)');
 if position('case when r.intencion=''vender'' then ''entrevista'' else ''perfil'' end' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_save_intake';end if;
 definition:=replace(definition,'case when r.intencion=''vender'' then ''entrevista'' else ''perfil'' end','case when r.intencion in (''vender'',''arrendar'') then ''entrevista'' else ''perfil'' end');
 if position('if r.intencion<>''vender'' then' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_save_intake';end if;
 definition:=replace(definition,'if r.intencion<>''vender'' then','if r.intencion not in (''vender'',''arrendar'') then');
 execute definition;
end; $$;
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_interview_evidence()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('case when new.flujo->>''ruta''=''captacion'' then ''entrevista'' else ''perfil'' end' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_interview_evidence';end if;
 definition:=replace(definition,'case when new.flujo->>''ruta''=''captacion'' then ''entrevista'' else ''perfil'' end','case when new.flujo->>''ruta'' in (''captacion'',''arrendador'') then ''entrevista'' else ''perfil'' end');
 if position('(new.flujo->>''ruta''=''captacion'') is distinct from (i.intencion=''vender'')' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_interview_evidence';end if;
 definition:=replace(definition,'(new.flujo->>''ruta''=''captacion'') is distinct from (i.intencion=''vender'')','new.flujo->>''ruta'' is distinct from public.fortius_inmuebles_intake_route(i.intencion)');
 if position('case when i.intencion=''vender'' then ''entrevista'' else ''perfil'' end' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_interview_evidence';end if;
 definition:=replace(definition,'case when i.intencion=''vender'' then ''entrevista'' else ''perfil'' end','case when i.intencion in (''vender'',''arrendar'') then ''entrevista'' else ''perfil'' end');
 execute definition;
end; $$;
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_log_expediente_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('(new.flujo->>''ruta''=''captacion'' or old.flujo->>''ruta''=''captacion'')' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_log_expediente_operation';end if;
 definition:=replace(definition,'(new.flujo->>''ruta''=''captacion'' or old.flujo->>''ruta''=''captacion'')','(new.flujo->>''ruta'' in (''captacion'',''arrendador'') or old.flujo->>''ruta'' in (''captacion'',''arrendador''))');
 execute definition;
end; $$;
notify pgrst,'reload schema';
commit;
