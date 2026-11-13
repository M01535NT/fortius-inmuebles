-- Una tarea ligada a un prospecto (`leadId`) la ve y la cambia solo quien puede ver a ese prospecto:
-- su asesor o el administrador (titular, 12/11/2026: cada asesor ve solo a sus personas). Antes,
-- una tarea con `leadId` y sin cliente ni expediente era visible para todo el equipo, y su título
-- puede llevar el nombre de la persona. Las tareas sin prospecto no cambian.
-- Se agrega como política restrictiva aparte para no reescribir la lectura vigente.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

create function public.fortius_inmuebles_task_lead_visible(d jsonb) returns boolean
language plpgsql stable security definer set search_path='' as $$
declare lead_data jsonb;
begin
  if coalesce(d->>'leadId','')='' then return true; end if;
  if public.fortius_inmuebles_is_admin() then return true; end if;
  select r.data into lead_data from public.fortius_inmuebles_records r
    where r.collection='leads' and r.id=d->>'leadId';
  return lead_data is not null and public.fortius_inmuebles_record_visible('leads',lead_data);
end;
$$;
revoke all on function public.fortius_inmuebles_task_lead_visible(jsonb) from public,anon;
grant execute on function public.fortius_inmuebles_task_lead_visible(jsonb) to authenticated,service_role;

create policy fortius_inmuebles_records_task_lead_read on public.fortius_inmuebles_records
  as restrictive for select to authenticated
  using (collection<>'tareas' or public.fortius_inmuebles_task_lead_visible(data));

-- Las escrituras pasan por RPC con privilegios del dueño: el disparador revisa el prospecto
-- anterior y el nuevo, para que ni cambiar ni quitar el vínculo dé acceso.
create function public.fortius_inmuebles_guard_task_lead() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or public.fortius_inmuebles_is_admin() then return coalesce(new,old); end if;
  if tg_op<>'INSERT' and old.collection='tareas' and not public.fortius_inmuebles_task_lead_visible(old.data) then
    raise sqlstate 'PT403' using message='Tarea de un prospecto ajeno';
  end if;
  if tg_op<>'DELETE' and new.collection='tareas' and not public.fortius_inmuebles_task_lead_visible(new.data) then
    raise sqlstate 'PT403' using message='Tarea de un prospecto ajeno';
  end if;
  return coalesce(new,old);
end;
$$;
revoke all on function public.fortius_inmuebles_guard_task_lead() from public,anon,authenticated;
create trigger fortius_inmuebles_guard_task_lead before insert or update or delete on public.fortius_inmuebles_records
  for each row execute function public.fortius_inmuebles_guard_task_lead();

notify pgrst,'reload schema';
commit;
