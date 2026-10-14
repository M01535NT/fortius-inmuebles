begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

-- Marital information is optional at intake. Downstream representation and
-- contracting reviews are retained. Historical answers are not removed.
do $$ declare definition text; rule text; begin
 select pg_get_functiondef('public.fortius_inmuebles_validate_interview(text,jsonb,boolean)'::regprocedure) into definition;
 definition:=replace(definition,'''fechaMatrimonio'',''lugarMatrimonio''','''fechaMatrimonio'',''lugarMatrimonio'',''origenContacto'',''propiedadExistente''');
 definition:=replace(definition,'''relacion'',''ocupacion'',''documentos'',''alertas'',''estadoCivil''','''relacion'',''ocupacion'',''documentos'',''alertas''');
 rule:='if is_owner and a->>''estadoCivil''=''casado'' and (coalesce(btrim(a->>''conyuge''),'''')='''' or coalesce(a->>''regimen'','''') not in (''sociedad_conyugal'',''separacion'',''no_aplica'',''por_aclarar'')) then return false;end if;';
 if position(rule in definition)=0 then raise exception 'Unexpected marital intake validation';end if;
 execute replace(definition,rule,'');
end; $$;

do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_start_intake(uuid,text,jsonb,uuid)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 definition:=replace(definition,'request_data jsonb;', 'followup jsonb; task_data jsonb; request_data jsonb;');
 definition:=replace(definition,'if p_contact->>''tipo''=''nuevo'' then', $part$
 followup:=p_contact->'seguimiento';
 if followup is not null then
  if jsonb_typeof(followup)<>'object' or exists(select 1 from jsonb_object_keys(followup) x where x not in ('origen','accion','fecha'))
   or not followup ?& array['origen','accion','fecha'] or exists(select 1 from jsonb_each(followup) x where jsonb_typeof(x.value)<>'string')
   or coalesce(followup->>'origen','') not in ('llamada','whatsapp','correo','referido','web','presencial','otro')
   or length(btrim(followup->>'accion')) not between 1 and 160 or (followup->>'fecha') !~ '^\d{4}-\d{2}-\d{2}$'
   or p_expediente_id is not null then raise sqlstate 'PT400' using message='Siguiente acción inicial inválida';end if;
  begin
   if to_char((followup->>'fecha')::date,'YYYY-MM-DD')<>followup->>'fecha' then raise sqlstate 'PT400' using message='Fecha inválida';end if;
  exception when invalid_datetime_format or datetime_field_overflow then raise sqlstate 'PT400' using message='Fecha inválida';end;
 end if;
 p_contact:=p_contact-'seguimiento';
 if p_contact->>'tipo'='nuevo' then
 $part$);
 definition:=replace(definition,'if length(normalized)<7 then', 'if (length(normalized)<7 and coalesce(p_contact->>''email'','''')='''') or (p_contact->>''telefono''<>'''' and length(normalized)<7) then');
 definition:=replace(definition,'if not (p_contact->>''telefonoCompartido'')::boolean and exists(', 'if normalized<>'''' and not (p_contact->>''telefonoCompartido'')::boolean and exists(');
 -- Keep request_data intact for idempotency; store follow-up on this need,
 -- not on the person's unrelated opportunities.
 definition:=replace(definition,$old$coalesce((select respuestas from public.fortius_inmuebles_interviews where id=prior),jsonb_build_object('fecha',to_char(clock_timestamp() at time zone 'America/Tijuana','YYYY-MM-DD')))$old$,
  $new$coalesce((select respuestas from public.fortius_inmuebles_interviews where id=prior),jsonb_build_object('fecha',to_char(clock_timestamp() at time zone 'America/Tijuana','YYYY-MM-DD')) || case when followup is null then '{}'::jsonb else jsonb_build_object('origenContacto',followup->>'origen','siguienteAccion',followup->>'accion','siguienteFecha',followup->>'fecha') end)$new$);
 definition:=replace(definition,$old$return to_jsonb(r)-'solicitud';
end;$old$,$new$
 if followup is not null then
  task_data:=jsonb_strip_nulls(jsonb_build_object('id','ati'||replace(r.id::text,'-',''),'titulo',btrim(followup->>'accion'),'descripcion','Siguiente acción del primer contacto · entrevista '||r.id::text,'categoria','leads','estado','pendiente','prioridad','normal','pasos','[]'::jsonb,'asesorId',adviser,'leadId',lead,'clienteId',customer,'vence',followup->>'fecha'));
  perform public.fortius_inmuebles_put_record('tareas',task_data->>'id',task_data,null);
 end if;
 return to_jsonb(r)-'solicitud';
end;$new$);
 execute definition;
end; $$;

-- Completing the interview links/reuses its open initial action. If that
-- action was already completed, keep it intact and create the next one.
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_save_intake(uuid,bigint,jsonb,boolean)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 definition:=replace(definition,'task_data jsonb;', 'task_data jsonb; initial_task public.fortius_inmuebles_records;');
 definition:=replace(definition,'task_id:=gen_random_uuid()::text;', $part$
 select * into initial_task from public.fortius_inmuebles_records where collection='tareas' and id='ati'||replace(r.id::text,'-','') for update;
 task_id:=case when initial_task.id is not null and initial_task.data->>'estado' not in ('completada','cancelada') then initial_task.id else gen_random_uuid()::text end;
 $part$);
 definition:=replace(definition,$old$perform public.fortius_inmuebles_put_record('tareas',task_id,task_data,null);$old$,
  $new$perform public.fortius_inmuebles_put_record('tareas',task_id,task_data,case when task_id=initial_task.id then initial_task.version else null end);$new$);
 execute definition;
end; $$;
notify pgrst,'reload schema';
commit;
