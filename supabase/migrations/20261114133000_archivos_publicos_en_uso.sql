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
  -- Presupuesto de tiempo: statement_timeout no corta la sentencia que ya corre, así que se mide aquí.
  deadline timestamptz := clock_timestamp() + interval '3 seconds';
begin
  pending := array(select distinct n from unnest(coalesce(p_needles,'{}')) n where length(n) > 0);
  if cardinality(pending) = 0 then return found; end if;

  -- Registros vigentes, menos el propio inmueble.
  select coalesce(array_agg(n),'{}') into hits from unnest(pending) n
    where exists(select 1 from public.fortius_inmuebles_records r
      where not (r.collection='propiedades' and r.id is not distinct from p_property_id) and strpos(r.data::text, n) > 0);
  found := found || hits; pending := array(select unnest(pending) except select unnest(hits));

  -- Historial: versiones de otros registros y cualquier cosa en Eliminados (también el propio inmueble).
  if cardinality(pending) > 0 then
    select coalesce(array_agg(n),'{}') into hits from unnest(pending) n
      where exists(select 1 from public.fortius_inmuebles_record_history h
        where (not (h.collection='propiedades' and h.record_id is not distinct from p_property_id) or (h.action='DELETE' and h.restored_at is null))
          and strpos(h.snapshot::text, n) > 0);
    found := found || hits; pending := array(select unnest(pending) except select unnest(hits));
  end if;
  if clock_timestamp() > deadline then raise exception 'La revisión de archivos en uso tardó demasiado' using errcode='57014'; end if;

  -- Todas las demás tablas, solo sus columnas de texto y JSON. Nombres con %I y valores con USING.
  for t in select c.relname, string_agg(format('coalesce(x.%I::text,'''')', a.attname), ' || '' '' || ' order by a.attnum) as expr
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace s on s.oid=c.relnamespace
    join pg_catalog.pg_attribute a on a.attrelid=c.oid and a.attnum > 0 and not a.attisdropped
      and a.atttypid in (25, 1043, 114, 3802) -- text, varchar, json, jsonb
    where s.nspname='public' and c.relkind in ('r','p')
      and c.relname not in ('fortius_inmuebles_records','fortius_inmuebles_record_history','fortius_inmuebles_file_uploads','fortius_inmuebles_rate_limits')
    group by c.relname order by c.relname
  loop
    exit when cardinality(pending) = 0;
    -- Si tarda demasiado, falla: el servidor lo toma como «en uso» y no retira nada.
    if clock_timestamp() > deadline then raise exception 'La revisión de archivos en uso tardó demasiado' using errcode='57014'; end if;
    execute format('select coalesce(array_agg(n),''{}'') from unnest($1) n where exists(select 1 from public.%I x where strpos(%s, n) > 0)', t.relname, t.expr)
      into hits using pending;
    found := found || hits; pending := array(select unnest(pending) except select unnest(hits));
  end loop;
  if clock_timestamp() > deadline then raise exception 'La revisión de archivos en uso tardó demasiado' using errcode='57014'; end if;
  return found;
end;
$$;
revoke all on function public.fortius_inmuebles_public_files_in_use(text[], text) from public, anon, authenticated;
grant execute on function public.fortius_inmuebles_public_files_in_use(text[], text) to service_role;

-- Decisión del titular (13/11/2026): lo retirado se guarda 30 días en privado y después se borra.
-- Al mover un archivo, el almacenamiento actualiza updated_at: esa es la fecha en que se retiró
-- (comprobado en el Supabase de ensayo el 13/11/2026).
create function public.fortius_inmuebles_retired_public_files_due(p_limit integer default 100)
returns setof text
language plpgsql stable security definer set search_path='' as $$
begin
  return query select o.name from storage.objects o
    where o.bucket_id='fortius-inmuebles-private' and o.name like 'retirados/%'
      and coalesce(o.updated_at, o.created_at) < now() - interval '30 days'
    order by coalesce(o.updated_at, o.created_at)
    limit least(greatest(coalesce(p_limit, 100), 1), 500);
end;
$$;
revoke all on function public.fortius_inmuebles_retired_public_files_due(integer) from public, anon, authenticated;
grant execute on function public.fortius_inmuebles_retired_public_files_due(integer) to service_role;

commit;
