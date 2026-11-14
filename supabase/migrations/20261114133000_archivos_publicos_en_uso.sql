-- Decisión del titular (13/11/2026): lo público que se quita de un inmueble pasa al almacenamiento privado,
-- salvo que algo más lo siga usando. Esta función responde qué rutas del almacenamiento público siguen en uso
-- en cualquier tabla del esquema public (otro inmueble, el blog, fichas de Herramientas y sus versiones,
-- cartera comercial, formatos, expedientes, historial…). Busca dentro de la base para no depender de leer
-- tablas por partes desde la API (que corta en 1000 filas) ni de una lista de tablas que se quede corta.
-- No cuenta el registro del propio inmueble ni sus versiones anteriores, salvo si está en Eliminados.
-- Solo la usa el servidor (service_role).
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

create function public.fortius_inmuebles_public_files_in_use(p_needles text[], p_property_id text)
returns text[]
language plpgsql stable security definer set search_path='' as $$
declare
  t record;
  found text[] := '{}';
  hits text[];
  pending text[];
begin
  pending := array(select distinct n from unnest(coalesce(p_needles,'{}')) n where length(n) > 0);
  if cardinality(pending) = 0 then return found; end if;

  -- Registros vigentes, menos el propio inmueble.
  select coalesce(array_agg(n),'{}') into hits from unnest(pending) n
    where exists(select 1 from public.fortius_inmuebles_records r
      where not (r.collection='propiedades' and r.id=p_property_id) and strpos(r.data::text, n) > 0);
  found := found || hits; pending := array(select unnest(pending) except select unnest(hits));

  -- Historial: versiones de otros registros y cualquier cosa en Eliminados (también el propio inmueble).
  if cardinality(pending) > 0 then
    select coalesce(array_agg(n),'{}') into hits from unnest(pending) n
      where exists(select 1 from public.fortius_inmuebles_record_history h
        where (not (h.collection='propiedades' and h.record_id=p_property_id) or (h.action='DELETE' and h.restored_at is null))
          and strpos(h.snapshot::text, n) > 0);
    found := found || hits; pending := array(select unnest(pending) except select unnest(hits));
  end if;

  -- Todas las demás tablas, fila completa como texto.
  for t in select c.relname from pg_class c join pg_namespace s on s.oid=c.relnamespace
    where s.nspname='public' and c.relkind in ('r','p')
      and c.relname not in ('fortius_inmuebles_records','fortius_inmuebles_record_history','fortius_inmuebles_file_uploads','fortius_inmuebles_rate_limits')
  loop
    exit when cardinality(pending) = 0;
    execute format('select coalesce(array_agg(n),''{}'') from unnest($1) n where exists(select 1 from public.%I x where strpos(x::text, n) > 0)', t.relname)
      into hits using pending;
    found := found || hits; pending := array(select unnest(pending) except select unnest(hits));
  end loop;
  return found;
end;
$$;
revoke all on function public.fortius_inmuebles_public_files_in_use(text[], text) from public, anon, authenticated;
grant execute on function public.fortius_inmuebles_public_files_in_use(text[], text) to service_role;

commit;
