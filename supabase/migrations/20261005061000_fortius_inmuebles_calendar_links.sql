-- Validate private calendar links at the database boundary, including direct RPC writes.
begin;
create function public.fortius_inmuebles_event_visible(d jsonb) returns boolean
language plpgsql stable security definer set search_path='' as $$
declare lead_data jsonb;
begin
  if not public.fortius_inmuebles_is_staff() then return false; end if;
  if public.fortius_inmuebles_is_admin() then return true; end if;
  if coalesce(d->>'clienteId','')<>'' and not public.fortius_inmuebles_can_access_client_id(d->>'clienteId') then return false; end if;
  if coalesce(d->>'leadId','')<>'' then
    select r.data into lead_data from public.fortius_inmuebles_records r where r.collection='leads' and r.id=d->>'leadId';
    if lead_data is null or not public.fortius_inmuebles_record_visible('leads',lead_data) then return false; end if;
  end if;
  if coalesce(d->>'expedienteId','')<>'' then
    if d->>'expedienteId' !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      or not public.fortius_inmuebles_can_access_expediente((d->>'expedienteId')::uuid) then return false; end if;
  end if;
  if coalesce(d->>'asesorId','')<>'' and d->>'asesorId'<>public.fortius_inmuebles_current_asesor_id() then return false; end if;
  return true;
end;
$$;
revoke all on function public.fortius_inmuebles_event_visible(jsonb) from public,anon;
grant execute on function public.fortius_inmuebles_event_visible(jsonb) to authenticated,service_role;
alter policy fortius_inmuebles_records_scoped_read on public.fortius_inmuebles_records
  using (public.fortius_inmuebles_record_visible(collection,data)
    and (collection<>'eventos' or public.fortius_inmuebles_event_visible(data)));
create function public.fortius_inmuebles_guard_event_links() returns trigger
language plpgsql security definer set search_path='' as $$
declare key text; category text; linked jsonb; expediente record;
begin
  if new.collection <> 'eventos' then return new; end if;
  foreach key in array array['leadId','clienteId','propiedadSlug','asesorId'] loop
    if new.data ? key and jsonb_typeof(new.data->key) is distinct from 'string' then
      raise sqlstate 'PT400' using message='Referencia de evento inválida';
    end if;
    if coalesce(new.data->>key,'') <> '' and new.data->>key !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$' then
      raise sqlstate 'PT400' using message='Referencia de evento inválida';
    end if;
    category := case key when 'leadId' then 'leads' when 'clienteId' then 'clientes' when 'propiedadSlug' then 'propiedades' else 'asesores' end;
    if coalesce(new.data->>key,'') <> '' then
      select r.data into linked from public.fortius_inmuebles_records r
      where r.collection=category and r.id=new.data->>key;
      if linked is null then raise sqlstate 'PT400' using message='Vínculo de evento inexistente'; end if;
      if category in ('leads','clientes') and not public.fortius_inmuebles_record_visible(category,linked) then
        raise sqlstate 'PT403' using message='Vínculo de evento sin acceso';
      end if;
    end if;
  end loop;
  if not public.fortius_inmuebles_is_admin()
    and coalesce(new.data->>'asesorId','')<>''
    and new.data->>'asesorId' is distinct from public.fortius_inmuebles_current_asesor_id() then
    raise sqlstate 'PT403' using message='Asesor de evento sin acceso';
  end if;
  if coalesce(new.data->>'leadId','')<>'' and coalesce(new.data->>'clienteId','')<>'' and not exists (
    select 1 from public.fortius_inmuebles_records r where r.collection='clientes'
      and r.id=new.data->>'clienteId' and r.data->>'leadId'=new.data->>'leadId'
  ) then raise sqlstate 'PT400' using message='Lead y cliente incongruentes'; end if;
  if new.data ? 'expedienteId' and jsonb_typeof(new.data->'expedienteId') is distinct from 'string' then
    raise sqlstate 'PT400' using message='Expediente inválido';
  end if;
  if coalesce(new.data->>'expedienteId','')<>'' then
    if new.data->>'expedienteId' !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
      raise sqlstate 'PT400' using message='Expediente inválido';
    end if;
    select e.cliente_id,e.asesor_id,e.propiedad_slug,e.deleted_at into expediente
      from public.fortius_inmuebles_expedientes e where e.id=(new.data->>'expedienteId')::uuid;
    if not found or expediente.deleted_at is not null then raise sqlstate 'PT400' using message='Expediente inexistente o eliminado'; end if;
    if not public.fortius_inmuebles_can_access_expediente((new.data->>'expedienteId')::uuid) then
      raise sqlstate 'PT403' using message='Expediente sin acceso';
    end if;
    if coalesce(new.data->>'clienteId','') is distinct from expediente.cliente_id
      or coalesce(new.data->>'asesorId','') is distinct from expediente.asesor_id
      or coalesce(new.data->>'propiedadSlug','') is distinct from coalesce(expediente.propiedad_slug,'') then
      raise sqlstate 'PT400' using message='Vínculos incongruentes con el expediente';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.fortius_inmuebles_guard_event_links() from public,anon,authenticated;
create trigger fortius_inmuebles_guard_event_links before insert or update on public.fortius_inmuebles_records
  for each row execute function public.fortius_inmuebles_guard_event_links();
commit;
