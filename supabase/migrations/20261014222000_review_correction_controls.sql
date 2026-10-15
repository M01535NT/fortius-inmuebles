begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_start_intake(uuid,text,jsonb,uuid)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('followup:=p_contact->''seguimiento'';' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_start_intake';end if;
 definition:=replace(definition,'followup:=p_contact->''seguimiento'';','followup:=p_contact->''seguimiento'';
 if p_expediente_id is null and followup is null then raise sqlstate ''PT400'' using message=''Registra origen y siguiente acción con fecha para iniciar el contacto'';end if;');
 execute definition;
end; $$;
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_save_intake(uuid,bigint,jsonb,boolean)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('-- Freeze the validated snapshot before the advancement trigger inspects it.' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_save_intake';end if;
 definition:=replace(definition,'-- Freeze the validated snapshot before the advancement trigger inspects it.','-- Material corrections preserve evidence but invalidate its old conclusions.
 if r.anterior_id is not null and exists(select 1 from public.fortius_inmuebles_interviews prior where prior.id=r.anterior_id
  and (prior.respuestas - array[''fecha'',''origenContacto'',''siguienteAccion'',''siguienteFecha'']::text[]) is distinct from (p_answers - array[''fecha'',''origenContacto'',''siguienteAccion'',''siguienteFecha'']::text[])) then
  flow:=flow-''resolucion'';
  select jsonb_set(flow,''{requisitos}'',coalesce(jsonb_object_agg(key,
   case when key not in (''entrevista'',''perfil'',''privacidad'') and value->>''estado'' in (''revisado'',''no_aplica'') then jsonb_set(value,''{estado}'',''"recibido"''::jsonb) else value end),''{}''::jsonb)) into flow from jsonb_each(flow->''requisitos'');
 end if;
 -- Freeze the validated snapshot before the advancement trigger inspects it.');
 execute definition;
end; $$;
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_log_expediente_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('where e.propiedad_slug=affected_slug and public.fortius_inmuebles_flow_publish_ready(e.id)' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_log_expediente_operation';end if;
 definition:=replace(definition,'where e.propiedad_slug=affected_slug and public.fortius_inmuebles_flow_publish_ready(e.id)','where e.propiedad_slug=affected_slug and e.operacion=(select p.data->>''operacion'' from public.fortius_inmuebles_records p where p.collection=''propiedades'' and p.id=affected_slug) and public.fortius_inmuebles_flow_publish_ready(e.id)');
 execute definition;
end; $$;
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_private_record()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('nullif(old.data->>''clienteId'','''') is distinct from nullif(new.data->>''clienteId'','''')' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_private_record';end if;
 definition:=replace(definition,'nullif(old.data->>''clienteId'','''') is distinct from nullif(new.data->>''clienteId'','''')','nullif(old.data->>''clienteId'','''') is distinct from nullif(new.data->>''clienteId'','''')
 and not (new.collection=''tareas'' and nullif(old.data->>''clienteId'','''') is null and nullif(old.data->>''expedienteId'','''') is null
  and coalesce(old.data->>''leadId'','''')<>'''' and new.data->>''leadId''=old.data->>''leadId''
  and new.data->>''asesorId''=old.data->>''asesorId''
  and exists(select 1 from public.fortius_inmuebles_interviews i
   where old.id=''ati''||replace(i.id::text,''-'','''') and i.estado=''completada''
   and i.lead_id=old.data->>''leadId'' and i.cliente_id=new.data->>''clienteId''
   and i.expediente_id::text=new.data->>''expedienteId''
   and i.asesor_id=new.data->>''asesorId'' and public.fortius_inmuebles_can_access_expediente(i.expediente_id)))');
 execute definition;
end; $$;
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_save_intake(uuid,bigint,jsonb,boolean)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('perform public.fortius_inmuebles_put_record(''tareas'',task_id,task_data,case' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_save_intake';end if;
 definition:=replace(definition,'perform public.fortius_inmuebles_put_record(''tareas'',task_id,task_data,case','if task_id=initial_task.id and initial_task.data ? ''leadId'' then task_data:=task_data||jsonb_build_object(''leadId'',initial_task.data->''leadId'');end if;
 perform public.fortius_inmuebles_put_record(''tareas'',task_id,task_data,case');
 execute definition;
end; $$;
notify pgrst,'reload schema';
commit;
