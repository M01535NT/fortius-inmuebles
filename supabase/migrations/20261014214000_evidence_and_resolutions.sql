begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

create function public.fortius_inmuebles_evidence_expediente(e jsonb) returns uuid
language plpgsql stable security definer set search_path='' as $body$
declare result uuid;
begin
 if e->>'tipo'='entrevista' then select expediente_id into result from public.fortius_inmuebles_interviews where id=(e->>'referencia')::uuid and estado='completada' and version=(e->>'version')::bigint;
 elsif e->>'tipo'='documento' then select expediente_id into result from public.fortius_inmuebles_formato_drafts where id=(e->>'referencia')::uuid and version=(e->>'version')::bigint;
 elsif e->>'tipo'='emision' then select d.expediente_id into result from public.fortius_inmuebles_formato_emissions m join public.fortius_inmuebles_formato_drafts d on d.id=m.draft_id where m.id=(e->>'referencia')::uuid and m.draft_version=(e->>'version')::bigint;
 elsif e->>'tipo'='adjunto' then select d.expediente_id into result from public.fortius_inmuebles_formato_assets a join public.fortius_inmuebles_formato_drafts d on d.id=a.draft_id where a.id=(e->>'referencia')::uuid;
 end if;
 return result;
exception when invalid_text_representation or numeric_value_out_of_range then return null;
end; $body$;
revoke all on function public.fortius_inmuebles_evidence_expediente(jsonb) from public,anon,authenticated,service_role;

create function public.fortius_inmuebles_evidence_ok(e jsonb) returns boolean
language plpgsql stable security definer set search_path='' as $body$
declare exp uuid;
begin
 if e is null or jsonb_typeof(e)<>'object' then return false;end if;
 if e->>'tipo'='externa' then
  return coalesce(jsonb_typeof(e->'referencia')='string' and length(btrim(e->>'referencia')) between 10 and 1000 and jsonb_typeof(e->'responsable')='string' and length(btrim(e->>'responsable')) between 3 and 160
   and jsonb_typeof(e->'resultado')='string' and length(btrim(e->>'resultado')) between 3 and 1000 and jsonb_typeof(e->'fecha')='string' and (e->>'fecha') ~ '^\d{4}-\d{2}-\d{2}$' and to_char((e->>'fecha')::date,'YYYY-MM-DD')=e->>'fecha',false);
 end if;
 exp:=public.fortius_inmuebles_evidence_expediente(e);
 return exp is not null and public.fortius_inmuebles_can_access_expediente(exp);
exception when invalid_datetime_format or datetime_field_overflow or invalid_text_representation then return false;
end; $body$;
revoke all on function public.fortius_inmuebles_evidence_ok(jsonb) from public,anon,authenticated,service_role;

create function public.fortius_inmuebles_observation_blocks(flow jsonb,target text) returns boolean
language sql stable set search_path='' as $body$
 select exists(select 1 from jsonb_each(coalesce(flow->'requisitos','{}'::jsonb)) r where r.value->>'estado'='observado'
  and (r.key=any(public.fortius_inmuebles_flow_required(flow->>'ruta',target)) or coalesce(r.value->'bloquea','[]'::jsonb) ? target));
$body$;
revoke all on function public.fortius_inmuebles_observation_blocks(jsonb,text) from public,anon,authenticated,service_role;

create function public.fortius_inmuebles_resolution_allows(flow jsonb,target text) returns boolean
language sql stable set search_path='' as $body$
 select case when flow->'resolucion' is null then flow->>'ruta' not in ('captacion','arrendador') or target in ('captacion','documentacion')
 when flow->'resolucion'->>'tipo'='aceptada' then true
 when flow->'resolucion'->>'tipo'='condicionada' then length(btrim(flow->'resolucion'->>'condiciones'))>=3 and coalesce(flow->'resolucion'->'permitidas','[]'::jsonb) ? target
 else false end;
$body$;
revoke all on function public.fortius_inmuebles_resolution_allows(jsonb,text) from public,anon,authenticated,service_role;
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_flow_review_ok(jsonb,text)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('and length(btrim(flow->''requisitos''->key->>''soporte''))>=3' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_flow_review_ok';end if;
 definition:=replace(definition,'and length(btrim(flow->''requisitos''->key->>''soporte''))>=3','and length(btrim(flow->''requisitos''->key->>''soporte''))>=3 and (flow->''requisitos''->key->>''estado''=''no_aplica'' or public.fortius_inmuebles_evidence_ok(flow->''requisitos''->key->''evidencia''))');
 execute definition;
end; $$;
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_guided_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('''requisitos'',''contraparteId'',''contraparteExterna'')' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,'''requisitos'',''contraparteId'',''contraparteExterna'')','''requisitos'',''contraparteId'',''contraparteExterna'',''resolucion'')');
 if position('if exists(select 1 from jsonb_object_keys(new.flujo) key' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,'if exists(select 1 from jsonb_object_keys(new.flujo) key','
   if new.flujo ? ''resolucion'' then
    r:=new.flujo->''resolucion'';
    if jsonb_typeof(r)<>''object'' or exists(select 1 from jsonb_object_keys(r) x where x not in (''tipo'',''fecha'',''motivo'',''condiciones'',''permitidas'',''siguienteAccion'',''fechaSiguiente''))
     or coalesce(r->>''tipo'','''') not in (''aceptada'',''condicionada'',''pausada'',''rechazada'',''referida'',''cancelada'')
     or jsonb_typeof(r->''motivo'') is distinct from ''string'' or length(btrim(r->>''motivo'')) not between 3 and 1000
     or jsonb_typeof(r->''siguienteAccion'') is distinct from ''string'' or length(btrim(r->>''siguienteAccion'')) not between 1 and 160
     or jsonb_typeof(r->''fecha'') is distinct from ''string'' or jsonb_typeof(r->''fechaSiguiente'') is distinct from ''string''
     or (r->>''fecha'') !~ ''^\d{4}-\d{2}-\d{2}$'' or (r->>''fechaSiguiente'') !~ ''^\d{4}-\d{2}-\d{2}$''
     then raise sqlstate ''PT400'' using message=''Resolución y siguiente acción incompletas'';end if;
    if to_char((r->>''fecha'')::date,''YYYY-MM-DD'')<>r->>''fecha'' or to_char((r->>''fechaSiguiente'')::date,''YYYY-MM-DD'')<>r->>''fechaSiguiente'' then raise sqlstate ''PT400'' using message=''Fecha de resolución inválida'';end if;
    if r->>''tipo''=''condicionada'' and (jsonb_typeof(r->''condiciones'') is distinct from ''string'' or length(btrim(r->>''condiciones'')) not between 3 and 1000) then raise sqlstate ''PT400'' using message=''Documenta las condiciones'';end if;
    if r ? ''permitidas'' then
     if jsonb_typeof(r->''permitidas'')<>''array'' or jsonb_array_length(r->''permitidas'')>8 then raise sqlstate ''PT400'' using message=''Actividades permitidas inválidas'';end if;
     if exists(select 1 from jsonb_array_elements_text(r->''permitidas'') x where x<>all(stages)) then raise sqlstate ''PT400'' using message=''Actividad desconocida'';end if;
    end if;
    if r->>''tipo''=''pausada'' then new.flujo:=jsonb_set(new.flujo,''{estado}'',''"pausada"''::jsonb);
    elsif r->>''tipo'' in (''rechazada'',''referida'',''cancelada'') then new.flujo:=jsonb_set(new.flujo,''{estado}'',''"descartada"''::jsonb);end if;
    if new.flujo->>''estado''<>''activa'' and length(btrim(coalesce(new.flujo->>''motivo'','''')))<3 then new.flujo:=jsonb_set(new.flujo,''{motivo}'',r->''motivo'');end if;
   end if;

   if exists(select 1 from jsonb_object_keys(new.flujo) key');
 if position('''soporte'',''vigenteHasta'',''registradoPor'',''registradoEl'')' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,'''soporte'',''vigenteHasta'',''registradoPor'',''registradoEl'')','''soporte'',''vigenteHasta'',''registradoPor'',''registradoEl'',''evidencia'',''bloquea'')');
 if position('if r->>''estado'' in (''revisado'',''observado'',''no_aplica'')' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,'if r->>''estado'' in (''revisado'',''observado'',''no_aplica'')','
     if r ? ''evidencia'' then
      if jsonb_typeof(r->''evidencia'')<>''object'' or exists(select 1 from jsonb_object_keys(r->''evidencia'') x where x not in (''tipo'',''referencia'',''version'',''fecha'',''responsable'',''resultado'',''limites'')) then raise sqlstate ''PT400'' using message=''Referencia de evidencia inválida'';end if;
     end if;
     if r ? ''bloquea'' then
      if jsonb_typeof(r->''bloquea'')<>''array'' or jsonb_array_length(r->''bloquea'')>8 then raise sqlstate ''PT400'' using message=''Alcance de observación inválido'';end if;
      if exists(select 1 from jsonb_array_elements_text(r->''bloquea'') x where x<>all(stages)) then raise sqlstate ''PT400'' using message=''Actividad bloqueada desconocida'';end if;
     end if;
     if r->>''estado''=''revisado'' then
      if not public.fortius_inmuebles_evidence_ok(r->''evidencia'') then raise sqlstate ''PT400'' using message=''Registra evidencia existente/versionada o externa con fecha, responsable y resultado'';end if;
      if r->''evidencia''->>''tipo''<>''externa'' and public.fortius_inmuebles_evidence_expediente(r->''evidencia'') is distinct from new.id then raise sqlstate ''PT403'' using message=''La evidencia no corresponde al expediente'';end if;
     end if;

     if r->>''estado'' in (''revisado'',''observado'',''no_aplica'')');
 if position('exists(select 1 from jsonb_each(new.flujo->''requisitos'') x where x.value->>''estado''=''observado'')' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,'exists(select 1 from jsonb_each(new.flujo->''requisitos'') x where x.value->>''estado''=''observado'')','public.fortius_inmuebles_observation_blocks(new.flujo,new.etapa)');
 if position('foreach k in array public.fortius_inmuebles_flow_required(new.flujo->>''ruta'',new.etapa) loop' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,'foreach k in array public.fortius_inmuebles_flow_required(new.flujo->>''ruta'',new.etapa) loop','if not public.fortius_inmuebles_resolution_allows(new.flujo,new.etapa) then raise sqlstate ''PT409'' using message=''La resolución no autoriza esta actividad'';end if;
       foreach k in array public.fortius_inmuebles_flow_required(new.flujo->>''ruta'',new.etapa) loop');
 execute definition;
end; $$;
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_flow_publish_ready(uuid)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('and not exists(select 1 from jsonb_each(e.flujo->''requisitos'') r where r.value->>''estado''=''observado'')' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_flow_publish_ready';end if;
 definition:=replace(definition,'and not exists(select 1 from jsonb_each(e.flujo->''requisitos'') r where r.value->>''estado''=''observado'')','and not public.fortius_inmuebles_observation_blocks(e.flujo,''comercializacion'') and public.fortius_inmuebles_resolution_allows(e.flujo,''comercializacion'')');
 execute definition;
end; $$;
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_save_intake(uuid,bigint,jsonb,boolean)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('''registradoPor'',auth.uid(),''registradoEl'',stamp);' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_save_intake';end if;
 definition:=replace(definition,'''registradoPor'',auth.uid(),''registradoEl'',stamp);','''registradoPor'',auth.uid(),''registradoEl'',stamp,''evidencia'',jsonb_build_object(''tipo'',''entrevista'',''referencia'',r.id::text,''version'',r.version+1));');
 execute definition;
end; $$;
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_log_expediente_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('where x.value->>''estado''=''observado'' or' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_log_expediente_operation';end if;
 definition:=replace(definition,'where x.value->>''estado''=''observado'' or','where (x.value->>''estado''=''observado'' and (x.key=any(public.fortius_inmuebles_flow_required(new.flujo->>''ruta'',''comercializacion'')) or coalesce(x.value->''bloquea'',''[]''::jsonb) ? ''comercializacion'')) or');
 if position('invalidate_publication:=new.flujo->>''estado''<>''activa''' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_log_expediente_operation';end if;
 definition:=replace(definition,'invalidate_publication:=new.flujo->>''estado''<>''activa''','invalidate_publication:=(new.flujo ? ''resolucion'' and not public.fortius_inmuebles_resolution_allows(new.flujo,''comercializacion'')) or new.flujo->>''estado''<>''activa''');
 execute definition;
end; $$;
notify pgrst,'reload schema';
commit;
