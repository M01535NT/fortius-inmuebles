-- Optional direct task context, guarded for HTTP, RPC and privileged DML.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

-- A generated nullable FK preserves legacy rows and supports a read-only readiness check.
-- Invalid pre-existing UUID text stays null; unknown valid UUIDs fail this migration
-- transactionally instead of silently repairing/inventing their relation.
alter table public.fortius_inmuebles_records
  add column task_expediente_id uuid generated always as (
    case when collection='tareas' and coalesce(data->>'expedienteId','') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      then (data->>'expedienteId')::uuid else null end
  ) stored,
  add constraint fortius_inmuebles_task_expediente_reference foreign key (task_expediente_id)
    references public.fortius_inmuebles_expedientes(id) on delete restrict;

-- Retain the existing client/event scope and narrow it only for directly linked tasks.
alter policy fortius_inmuebles_records_scoped_read on public.fortius_inmuebles_records
  using (public.fortius_inmuebles_record_visible(collection,data)
    and (collection<>'eventos' or public.fortius_inmuebles_event_visible(data))
    and (task_expediente_id is null or public.fortius_inmuebles_can_access_expediente(task_expediente_id)));

create function public.fortius_inmuebles_guard_task_expediente() returns trigger
language plpgsql security definer set search_path='' as $$
declare expediente record; target uuid;
begin
  -- Check the previous scope too: changing/clearing a reference never grants access.
  if tg_op<>'INSERT' and old.collection='tareas' and old.task_expediente_id is not null
    and not public.fortius_inmuebles_is_admin()
    and not public.fortius_inmuebles_can_access_expediente(old.task_expediente_id) then
    raise sqlstate 'PT403' using message='Tarea de expediente sin acceso';
  end if;
  if tg_op='DELETE' then return old; end if;
  if new.collection<>'tareas' then return new; end if;
  -- Older API versions strip this unknown field. Preserve it unless explicitly cleared.
  if tg_op='UPDATE' and old.collection='tareas' and old.task_expediente_id is not null
    and not (new.data ? 'expedienteId') then
    new.data := jsonb_set(new.data,'{expedienteId}',old.data->'expedienteId');
  end if;
  if new.data ? 'expedienteId' and jsonb_typeof(new.data->'expedienteId') is distinct from 'string' then
    raise sqlstate 'PT400' using message='Expediente de tarea inválido';
  end if;
  if coalesce(new.data->>'expedienteId','')='' then return new; end if;
  if new.data->>'expedienteId' !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    raise sqlstate 'PT400' using message='Expediente de tarea inválido';
  end if;
  target := (new.data->>'expedienteId')::uuid;
  new.data := jsonb_set(new.data,'{expedienteId}',to_jsonb(target::text));
  -- Serialize with removal/reassignment; the task always validates an active snapshot.
  select e.cliente_id,e.asesor_id,e.propiedad_slug,e.deleted_at into expediente
    from public.fortius_inmuebles_expedientes e where e.id=target for share;
  if not found or expediente.deleted_at is not null then
    raise sqlstate 'PT400' using message='Expediente inexistente o eliminado';
  end if;
  if not public.fortius_inmuebles_can_access_expediente(target) then
    raise sqlstate 'PT403' using message='Expediente de tarea sin acceso';
  end if;
  if coalesce(new.data->>'clienteId','') is distinct from expediente.cliente_id
    or coalesce(new.data->>'asesorId','') is distinct from expediente.asesor_id
    or coalesce(new.data->>'propiedadSlug','') is distinct from coalesce(expediente.propiedad_slug,'') then
    raise sqlstate 'PT400' using message='Vínculos de tarea incongruentes con el expediente';
  end if;
  return new;
end;
$$;
revoke all on function public.fortius_inmuebles_guard_task_expediente() from public,anon,authenticated,service_role;
create trigger fortius_inmuebles_guard_task_expediente before insert or update or delete on public.fortius_inmuebles_records
  for each row execute function public.fortius_inmuebles_guard_task_expediente();
notify pgrst,'reload schema';
commit;
