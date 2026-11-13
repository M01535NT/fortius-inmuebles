-- SEG-A1 (auditoría del 13/11/2026; COR-23 y DEC-43 del 12/11/2026): un asesor ve de los inmuebles
-- de otros asesores solo lo que sirve para ofrecerlos. Hasta ahora ese recorte vivía solo en el
-- servidor del panel (projectTeamProperty): con su propia sesión, un asesor podía leer por la API de
-- datos el registro completo de cualquier inmueble (llaves, preparación, avisos a compradores,
-- contacto y porcentaje del aliado, archivos privados).
--
-- 1. Política restrictiva: la lectura directa de «propiedades» queda para el director y el asesor
--    del inmueble.
-- 2. fortius_inmuebles_team_properties(p_id): la lectura del equipo, ya recortada en la base para
--    los inmuebles ajenos, con la misma regla que projectTeamProperty. El panel la usa para listar y
--    para leer un inmueble ajeno.
-- No destructiva: no reescribe registros ni cambia escrituras (put_record y los disparadores son
-- SECURITY DEFINER y no dependen de esta política).
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

do $preflight$
begin
  if to_regprocedure('public.fortius_inmuebles_current_asesor_id()') is null
    or to_regprocedure('public.fortius_inmuebles_public_url(text)') is null
    or to_regprocedure('public.fortius_inmuebles_is_staff()') is null
    or to_regprocedure('public.fortius_inmuebles_is_admin()') is null then
    raise exception 'Expected access helpers are missing; review before applying';
  end if;
end;
$preflight$;

-- Lo que un asesor recibe de un inmueble ajeno. Mantener igual a projectTeamProperty (validation.ts).
create function public.fortius_inmuebles_team_property_view(d jsonb) returns jsonb
language plpgsql immutable set search_path='' as $$
declare result jsonb := d - 'llaves' - 'preparacion' - 'avisosCompradores'; k text;
begin
  if result ? 'aliado' then
    if jsonb_typeof(result->'aliado')='object' and jsonb_typeof(result->'aliado'->'inmobiliaria')='string' then
      result := jsonb_set(result, '{aliado}', jsonb_build_object('inmobiliaria', result->'aliado'->'inmobiliaria'));
    else
      result := result - 'aliado';
    end if;
  end if;
  if jsonb_typeof(result->'galeria')='array' then
    result := jsonb_set(result, '{galeria}', coalesce((select jsonb_agg(item order by n) from jsonb_array_elements(result->'galeria') with ordinality as g(item,n)
      where jsonb_typeof(item->'src')='string' and public.fortius_inmuebles_public_url(item->>'src')), '[]'::jsonb));
  end if;
  if jsonb_typeof(result->'documentos')='array' then
    result := jsonb_set(result, '{documentos}', coalesce((select jsonb_agg(item order by n) from jsonb_array_elements(result->'documentos') with ordinality as g(item,n)
      where jsonb_typeof(item->'url')='string' and public.fortius_inmuebles_public_url(item->>'url')), '[]'::jsonb));
  end if;
  foreach k in array array['videoUrl','tour360Url'] loop
    if jsonb_typeof(result->k)='string' and not public.fortius_inmuebles_public_url(result->>k) then result := result - k; end if;
  end loop;
  return result;
end;
$$;
revoke all on function public.fortius_inmuebles_team_property_view(jsonb) from public, anon, authenticated, service_role;

create function public.fortius_inmuebles_team_properties(p_id text default null)
returns table(id text, data jsonb, version bigint, created_at timestamptz, updated_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
declare admin boolean; mine text;
begin
  if not public.fortius_inmuebles_is_staff() then raise sqlstate 'PT403' using message='Sin acceso al panel'; end if;
  admin := public.fortius_inmuebles_is_admin();
  mine := public.fortius_inmuebles_current_asesor_id();
  return query
    select r.id,
      case when admin or (coalesce(mine,'')<>'' and r.data->>'asesorId'=mine) then r.data
        else public.fortius_inmuebles_team_property_view(r.data) end,
      r.version, r.created_at, r.updated_at
    from public.fortius_inmuebles_records r
    where r.collection='propiedades' and (p_id is null or r.id=p_id)
    order by r.created_at desc, r.id;
end;
$$;
revoke all on function public.fortius_inmuebles_team_properties(text) from public, anon, service_role;
grant execute on function public.fortius_inmuebles_team_properties(text) to authenticated;

create policy fortius_inmuebles_records_property_owner_read on public.fortius_inmuebles_records
  as restrictive for select to authenticated
  using (collection<>'propiedades' or public.fortius_inmuebles_is_admin()
    or (coalesce(public.fortius_inmuebles_current_asesor_id(),'')<>'' and data->>'asesorId'=public.fortius_inmuebles_current_asesor_id()));

notify pgrst,'reload schema';
commit;
