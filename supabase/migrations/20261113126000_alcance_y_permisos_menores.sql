-- SEG-B12, B13 y B14 (auditoría del 13/11/2026). Ajustes menores de alcance, permisos e índices:
-- 1. La contraparte interesada (contraparteLeadId, COR-11) debe ser un prospecto que quien guarda
--    pueda ver; antes bastaba con que existiera, y un asesor podía ligar prospectos ajenos o
--    averiguar si un id existía.
-- 2. La nota de actividad que escribe el asesor no lleva «detalle»: ese campo es del registro
--    automático de cambios, que lo escribe la base.
-- 3. Dos funciones auxiliares dejan de poder llamarse sin sesión (los permisos por defecto de
--    Supabase las daban a anon).
-- 4. Índices en columnas que usan las políticas y las llaves foráneas.
-- No reescribe registros.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

do $$
declare definition text;
  anchor text := $m$lead_record.collection='leads' and lead_record.id=new.flujo->>'contraparteLeadId')$m$;
begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_guided_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 -- Ya aplicada: no se repite el reemplazo.
 if position('SEG-B12' in definition)>0 then return;end if;
 if position(anchor in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,anchor,$m$lead_record.collection='leads' and lead_record.id=new.flujo->>'contraparteLeadId'
       /* SEG-B12 */ and (auth.uid() is null or (old.flujo is not null and old.flujo->>'contraparteLeadId' is not distinct from new.flujo->>'contraparteLeadId')
         or public.fortius_inmuebles_record_visible(lead_record.collection,lead_record.data)))$m$);
 execute definition;
end; $$;

alter policy fortius_inmuebles_expediente_actividad_note on public.fortius_inmuebles_expediente_actividad
  with check (tipo='nota' and created_by=auth.uid() and detalle is null
    and public.fortius_inmuebles_can_access_expediente(expediente_id));

revoke execute on function public.fortius_inmuebles_is_staff() from anon;
revoke execute on function public.fortius_inmuebles_check_expediente_checklist(jsonb) from public, anon;
grant execute on function public.fortius_inmuebles_check_expediente_checklist(jsonb) to authenticated, service_role;

do $$
begin
  if exists(select 1 from pg_attribute where attrelid='public.fortius_inmuebles_records'::regclass and attname='task_expediente_id' and not attisdropped) then
    execute 'create index if not exists fortius_inmuebles_records_task_expediente on public.fortius_inmuebles_records(task_expediente_id) where task_expediente_id is not null';
  end if;
end; $$;
create index if not exists fortius_inmuebles_records_asesor on public.fortius_inmuebles_records(collection,(data->>'asesorId'));
create index if not exists fortius_inmuebles_app_files_expediente on public.fortius_inmuebles_app_files(expediente_id) where expediente_id is not null;
create index if not exists fortius_inmuebles_app_shares_file on public.fortius_inmuebles_app_shares(file_id);
create index if not exists fortius_inmuebles_integration_jobs_expediente on public.fortius_inmuebles_integration_jobs(expediente_id) where expediente_id is not null;

notify pgrst,'reload schema';
commit;
