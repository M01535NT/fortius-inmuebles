-- Allocate internal identifiers inside the transaction; preserve existing identifiers.
-- Historical property snapshots keep retired numbers reserved after deletion.
create or replace function public.fortius_inmuebles_next_property_code()
returns text language plpgsql set search_path = '' as $$
declare n numeric; s text;
begin
  perform pg_catalog.pg_advisory_xact_lock(781023);
  select coalesce(max(substring(code from 9)::numeric), 0) + 1 into n
  from (
    select upper(btrim(data->>'codigo')) as code
    from public.fortius_inmuebles_records where collection = 'propiedades'
    union all
    select upper(btrim(snapshot->>'codigo')) as code
    from public.fortius_inmuebles_record_history where collection = 'propiedades'
  ) codes where code ~ '^FORTIUS-[0-9]+$';
  s := n::text;
  return 'FORTIUS-' || lpad(s, greatest(6, length(s)), '0');
end;
$$;
revoke all on function public.fortius_inmuebles_next_property_code() from public, anon, authenticated, service_role;

-- Assign before RPC validation, which requires a nonempty property code.
do $$
declare definition text; marker text := 'perform public.fortius_inmuebles_validate_record(p_collection,p_id,p_data);';
begin
  definition := pg_get_functiondef('public.fortius_inmuebles_put_record(text,text,jsonb,bigint)'::regprocedure);
  if strpos(definition, marker) = 0 then
    raise exception 'Unexpected put_record definition; review automatic folio migration';
  end if;
  definition := replace(definition, marker, $body$
  if p_collection = 'propiedades' and p_version is null and nullif(btrim(p_data->>'codigo'), '') is null then
    p_data := jsonb_set(p_data, '{codigo}', to_jsonb(public.fortius_inmuebles_next_property_code()));
  end if;
  perform public.fortius_inmuebles_validate_record(p_collection,p_id,p_data);
$body$);
  execute definition;
end;
$$;

create or replace function public.fortius_inmuebles_assign_property_code()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.collection = 'propiedades' and nullif(btrim(new.data->>'codigo'), '') is null then
    new.data := jsonb_set(new.data, '{codigo}', to_jsonb(public.fortius_inmuebles_next_property_code()));
  end if;
  return new;
end;
$$;
revoke all on function public.fortius_inmuebles_assign_property_code() from public, anon, authenticated, service_role;
-- Alphabetical order places this before the existing uniqueness guard.
create trigger fortius_00_assign_property_code before insert on public.fortius_inmuebles_records
for each row execute function public.fortius_inmuebles_assign_property_code();

create or replace function public.fortius_inmuebles_assign_expediente_folio()
returns trigger language plpgsql security definer set search_path = '' as $$
declare n numeric; s text;
begin
  perform pg_catalog.pg_advisory_xact_lock(781023);
  if nullif(btrim(new.folio), '') is null then
    select coalesce(max(substring(code from 5)::numeric), 0) + 1 into n
    from (select upper(btrim(folio)) as code from public.fortius_inmuebles_expedientes) codes
    where code ~ '^EXP-[0-9]+$';
    s := n::text;
    new.folio := 'EXP-' || lpad(s, greatest(6, length(s)), '0');
  end if;
  return new;
end;
$$;
revoke all on function public.fortius_inmuebles_assign_expediente_folio() from public, anon, authenticated, service_role;
create trigger fortius_00_assign_expediente_folio before insert on public.fortius_inmuebles_expedientes
for each row execute function public.fortius_inmuebles_assign_expediente_folio();
