-- New writes receive coherent sale/rental states and collision-free internal codes.
-- Existing duplicate codes remain intact and editable so staff can reconcile them.
begin;
select pg_advisory_xact_lock(781023);

do $migration$
declare source_definition text;
declare old_rule text := 'd->>''estado'' not in (''disponible'',''apartada'',''vendida'')';
declare new_rule text := '((d->>''operacion''=''venta'' and d->>''estado'' not in (''disponible'',''apartada'',''vendida'')) or (d->>''operacion''=''renta'' and d->>''estado'' not in (''disponible'',''apartada'',''rentada'')))';
begin
  select pg_get_functiondef('public.fortius_inmuebles_validate_record(text,text,jsonb)'::regprocedure) into source_definition;
  if source_definition is null or position(old_rule in source_definition) = 0 then
    raise exception 'Unexpected property validation function; review before applying';
  end if;
  execute replace(source_definition, old_rule, new_rule);
end;
$migration$;

create function public.fortius_inmuebles_property_code_guard() returns trigger
language plpgsql set search_path = '' as $guard$
declare normalized_code text;
begin
  if new.collection <> 'propiedades' then return new; end if;
  normalized_code := upper(btrim(new.data->>'codigo'));
  if normalized_code is null or normalized_code = '' then
    raise sqlstate 'PT400' using message='Código de inmueble requerido';
  end if;
  -- The existing RPC serializes all writes with this lock. Keep direct privileged
  -- writes under the same lock so two simultaneous inserts cannot pass the check.
  perform pg_catalog.pg_advisory_xact_lock(781023);
  if tg_op = 'UPDATE' and old.collection = 'propiedades'
    and normalized_code = upper(btrim(old.data->>'codigo')) then
    return new;
  end if;
  if exists (
    select 1 from public.fortius_inmuebles_records r
    where r.collection = 'propiedades' and r.id <> new.id
      and upper(btrim(r.data->>'codigo')) = normalized_code
  ) then
    raise sqlstate 'PT409' using message='Código de inmueble ya asignado';
  end if;
  return new;
end;
$guard$;
revoke all on function public.fortius_inmuebles_property_code_guard() from public, anon, authenticated, service_role;
create trigger fortius_inmuebles_property_code_guard
before insert or update of collection, id, data on public.fortius_inmuebles_records
for each row execute function public.fortius_inmuebles_property_code_guard();
commit;
