-- Panel por asuntos · bloque 6: el inmueble completo (etapa 4 de PLAN.md; SPEC.md, sección 5).
-- Modelo: docs/operacion/modelo-de-datos-panel.md, sección 4.6. Autorizado por el titular el 16/11/2026.
-- Trae: fotos, video y recorrido 360; la portada; el precio con su historia (quién, cuándo y por qué);
-- el enlace público (slug) y lo que sale en el sitio. Guardar no publica: solo sale lo que tiene «publicado».
-- La dirección exacta solo sale cuando se activa «mostrar_direccion». Lo privado (dirección, responsable,
-- inmobiliaria, historial) nunca entra en la proyección pública.
-- Aditivo: no toca records ni el panel provisional; el sitio sigue mostrando lo de siempre y suma lo nuevo.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(781023);

-- ── Fotos, video y recorrido 360 ──────────────────────────────────────────────────────────────────────
-- Lo subido vive en el bucket público (sin metadatos, con nombre imposible de adivinar); lo enlazado guarda
-- solo la dirección. Quitar es recuperable: se marca retirado_el y el archivo se queda.
create table public.fortius_inmuebles_inmueble_medios (
  id uuid primary key default gen_random_uuid(),
  inmueble_id uuid not null references public.fortius_inmuebles_inmuebles (id) on delete restrict,
  tipo text not null check (tipo in ('foto', 'video', 'recorrido_360')),
  url text not null check (length(url) <= 1000 and url ~ '^https://'),
  path text check (path ~ '^panel/inmuebles/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp|mp4|webm)$'),
  nombre text check (length(nombre) <= 240),
  mime text check (mime in ('image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm')),
  byte_length bigint check (byte_length between 1 and 20971520),
  alt text check (length(alt) <= 160),
  orden numeric not null default 0,
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  retirado_el timestamptz,
  check ((path is null) = (mime is null))
);
create index on public.fortius_inmuebles_inmueble_medios (inmueble_id, tipo, orden) where retirado_el is null;

-- Un medio no cambia de inmueble, de tipo ni de archivo; solo su orden, su texto alternativo o si se retira.
create function public.fortius_inmuebles_guard_medio() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.inmueble_id <> old.inmueble_id or new.tipo <> old.tipo or new.url <> old.url
     or new.path is distinct from old.path or new.mime is distinct from old.mime then
    raise sqlstate '22023' using message = 'Para cambiar el archivo, quítalo y sube otro';
  end if;
  new.updated_at := now();
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_medio() from public, anon, authenticated, service_role;
create trigger fortius_02_guard before update on public.fortius_inmuebles_inmueble_medios
  for each row execute function public.fortius_inmuebles_guard_medio();
create trigger fortius_zz_historial after insert or update on public.fortius_inmuebles_inmueble_medios
  for each row execute function public.fortius_inmuebles_registrar_cambio('inmueble_medio', 'tipo,retirado_el');

alter table public.fortius_inmuebles_inmueble_medios enable row level security;
revoke all on public.fortius_inmuebles_inmueble_medios from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_inmueble_medios to authenticated;
grant all on public.fortius_inmuebles_inmueble_medios to service_role;
create policy medios_read on public.fortius_inmuebles_inmueble_medios for select to authenticated
  using (public.fortius_inmuebles_puede_ver_inmueble(inmueble_id));
-- La app solo agrega enlaces; los archivos los registra el servidor después de revisarlos y limpiarlos.
create policy medios_insert on public.fortius_inmuebles_inmueble_medios for insert to authenticated
  with check (path is null and creado_por = (select auth.uid()) and public.fortius_inmuebles_puede_ver_inmueble(inmueble_id));
create policy medios_update on public.fortius_inmuebles_inmueble_medios for update to authenticated
  using (public.fortius_inmuebles_puede_ver_inmueble(inmueble_id))
  with check (public.fortius_inmuebles_puede_ver_inmueble(inmueble_id));

-- La portada es una foto del mismo inmueble.
alter table public.fortius_inmuebles_inmuebles
  add constraint fortius_inmuebles_inmuebles_portada_fk
  foreign key (portada_id) references public.fortius_inmuebles_inmueble_medios (id) on delete set null;

-- ── Precio con su historia ────────────────────────────────────────────────────────────────────────────
-- Quien cambia el precio o la moneda manda el motivo en motivo_precio; la base guarda quién, cuándo,
-- de cuánto a cuánto y por qué, y deja el campo vacío. La historia no se cambia ni se borra.
alter table public.fortius_inmuebles_inmuebles
  add column motivo_precio text check (length(motivo_precio) <= 300),
  add column mapa text check (length(mapa) <= 1000 and mapa ~ '^https://');   -- enlace del mapa; privado

create table public.fortius_inmuebles_inmueble_precios (
  id uuid primary key default gen_random_uuid(),
  inmueble_id uuid not null references public.fortius_inmuebles_inmuebles (id) on delete restrict,
  precio_antes numeric(14, 2),
  moneda_antes text check (moneda_antes in ('MXN', 'USD')),
  precio numeric(14, 2),
  moneda text not null check (moneda in ('MXN', 'USD')),
  motivo text check (length(motivo) <= 300),
  cambiado_por uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create index on public.fortius_inmuebles_inmueble_precios (inmueble_id, created_at desc);
create trigger fortius_00_solo_agregar before update or delete on public.fortius_inmuebles_inmueble_precios
  for each row execute function public.fortius_inmuebles_solo_agregar();
alter table public.fortius_inmuebles_inmueble_precios enable row level security;
revoke all on public.fortius_inmuebles_inmueble_precios from anon, authenticated;
grant select on public.fortius_inmuebles_inmueble_precios to authenticated;
grant all on public.fortius_inmuebles_inmueble_precios to service_role;
create policy precios_read on public.fortius_inmuebles_inmueble_precios for select to authenticated
  using (public.fortius_inmuebles_puede_ver_inmueble(inmueble_id));

create function public.fortius_inmuebles_anotar_precio() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and (new.precio is distinct from old.precio or new.moneda is distinct from old.moneda) then
    insert into public.fortius_inmuebles_inmueble_precios (inmueble_id, precio_antes, moneda_antes, precio, moneda, motivo, cambiado_por)
    values (new.id, old.precio, old.moneda, new.precio, new.moneda, nullif(btrim(coalesce(new.motivo_precio, '')), ''), auth.uid());
  end if;
  new.motivo_precio := null;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_anotar_precio() from public, anon, authenticated, service_role;
create trigger fortius_03_precio before insert or update on public.fortius_inmuebles_inmuebles
  for each row execute function public.fortius_inmuebles_anotar_precio();

-- ── Enlace público y portada ──────────────────────────────────────────────────────────────────────────
-- Al publicar por primera vez recibe su enlace (el folio en minúsculas); después no cambia solo.
-- La portada debe ser una foto vigente del mismo inmueble.
create function public.fortius_inmuebles_guard_inmueble_sitio() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.publicado and new.slug is null then new.slug := lower(new.folio); end if;
  if new.portada_id is not null and not exists (
       select 1 from public.fortius_inmuebles_inmueble_medios m
        where m.id = new.portada_id and m.inmueble_id = new.id and m.tipo = 'foto' and m.retirado_el is null) then
    raise sqlstate '22023' using message = 'La portada debe ser una foto de este inmueble';
  end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_inmueble_sitio() from public, anon, authenticated, service_role;
create trigger fortius_04_sitio before insert or update on public.fortius_inmuebles_inmuebles
  for each row execute function public.fortius_inmuebles_guard_inmueble_sitio();

-- «Agregar otro igual»: un local más de la misma plaza en el mismo asunto, con su propio folio, precio y estado.
create function public.fortius_inmuebles_copiar_inmueble(p_asunto uuid, p_inmueble uuid, p_nombre text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare b record; nuevo record;
begin
  if not public.fortius_inmuebles_puede_ver_asunto(p_asunto) or not public.fortius_inmuebles_puede_ver_inmueble(p_inmueble) then
    raise sqlstate 'PT403' using message = 'Sin acceso a ese asunto';
  end if;
  if not exists (select 1 from public.fortius_inmuebles_asunto_inmuebles
                  where asunto_id = p_asunto and inmueble_id = p_inmueble and retirado_el is null) then
    raise sqlstate '22023' using message = 'Ese inmueble no está en este asunto';
  end if;
  select * into b from public.fortius_inmuebles_inmuebles where id = p_inmueble;
  insert into public.fortius_inmuebles_inmuebles (nombre, tipo, operacion, conjunto_id, moneda, colonia, ciudad, referencias,
                                                   lat, lng, compartido, inmobiliaria, responsable_id, es_ejemplo, creado_por)
  values (coalesce(nullif(btrim(p_nombre), ''), b.nombre || ' (otro)'), b.tipo, b.operacion, b.conjunto_id, b.moneda, b.colonia,
          b.ciudad, b.referencias, b.lat, b.lng, b.compartido, b.inmobiliaria, b.responsable_id, b.es_ejemplo, auth.uid())
  returning id, folio into nuevo;
  insert into public.fortius_inmuebles_asunto_inmuebles (asunto_id, inmueble_id, orden, creado_por)
  values (p_asunto, nuevo.id,
          coalesce((select max(orden) + 1 from public.fortius_inmuebles_asunto_inmuebles where asunto_id = p_asunto), 0), auth.uid());
  return jsonb_build_object('id', nuevo.id, 'folio', nuevo.folio);
end; $$;
revoke all on function public.fortius_inmuebles_copiar_inmueble(uuid, uuid, text) from public, anon;
grant execute on function public.fortius_inmuebles_copiar_inmueble(uuid, uuid, text) to authenticated, service_role;

-- ── Lo que sale en el sitio ───────────────────────────────────────────────────────────────────────────
-- Misma forma que los inmuebles de siempre (validation.ts vuelve a revisarla). Sin fotos no sale.
create function public.fortius_inmuebles_inmuebles_publicos() returns setof jsonb
language plpgsql stable security definer set search_path = '' as $$
declare i record; result jsonb; galeria jsonb; num jsonb; estado text;
begin
  for i in select x.*, c.slug as slug_conjunto, c.publicado as conjunto_publicado, c.deleted_at as conjunto_borrado
             from public.fortius_inmuebles_inmuebles x
             left join public.fortius_inmuebles_inmuebles c on c.id = x.conjunto_id
            where x.publicado and x.deleted_at is null and x.operacion is not null and x.tipo is not null
              and x.estado <> 'retirado'
            order by x.publicado_el desc nulls last, x.id loop
    select coalesce(jsonb_agg(jsonb_build_object('src', m.url, 'alt', coalesce(nullif(btrim(m.alt), ''), i.nombre))
                              order by (m.id = i.portada_id) desc, m.orden, m.created_at), '[]'::jsonb)
      into galeria
      from public.fortius_inmuebles_inmueble_medios m
     where m.inmueble_id = i.id and m.tipo = 'foto' and m.retirado_el is null and public.fortius_inmuebles_public_url(m.url);
    if jsonb_array_length(galeria) = 0 then continue; end if;
    estado := case i.estado when 'libre' then 'disponible' when 'apartado' then 'apartada'
                            when 'vendido' then 'vendida' when 'rentado' then 'rentada' end;
    num := (select coalesce(jsonb_object_agg(k.publico, i.ficha -> k.panel), '{}'::jsonb)
              from (values ('terreno', 'terrenoM2'), ('construccion', 'construccionM2'), ('recamaras', 'recamaras'),
                           ('banos', 'banos'), ('estac', 'estacionamientos')) k(panel, publico)
             where jsonb_typeof(i.ficha -> k.panel) = 'number' and (i.ficha ->> k.panel)::numeric between 0 and 1e9);
    if jsonb_typeof(i.ficha -> 'anio') = 'number' and (i.ficha ->> 'anio')::int between 1900 and 2100 then
      num := num || jsonb_build_object('antiguedad', 'Construida en ' || (i.ficha ->> 'anio'));
    end if;
    result := jsonb_build_object(
      'slug', coalesce(i.slug, lower(i.folio)),
      'codigo', i.folio,
      'titulo', i.nombre,
      'tipo', case i.tipo when 'nave_bodega' then 'nave-industrial' when 'plaza_conjunto' then 'plaza' else i.tipo end,
      'operacion', i.operacion,
      'zona', coalesce(i.colonia, ''),
      'direccionAproximada', case when i.mostrar_direccion and length(btrim(coalesce(i.direccion_exacta, ''))) between 3 and 200
                                  then btrim(i.direccion_exacta)
                                  else concat_ws(', ', nullif(btrim(coalesce(i.colonia, '')), ''), i.ciudad) end,
      'descripcion', (select coalesce(jsonb_agg(btrim(p) order by n), '[]'::jsonb)
                        from regexp_split_to_table(i.descripcion, '\n\s*\n') with ordinality s(p, n)
                       where length(btrim(p)) > 0 and n <= 100),
      'amenidades', '[]'::jsonb,
      'asesorId', '',
      'creditoDisponible', false,
      'destacada', false,
      'estado', estado,
      'publicadaEl', coalesce(to_char(i.publicado_el at time zone 'America/Tijuana', 'YYYY-MM-DD'), ''),
      'demo', i.es_ejemplo,
      'publicada', true,
      'precio', case when i.precio is null or i.precio = 0 then jsonb_build_object('modalidad', 'consulta')
                     else jsonb_build_object('modalidad', 'publico', 'monto', i.precio, 'moneda', i.moneda)
                          || case when i.operacion = 'renta' then jsonb_build_object('periodo', 'mensual') else '{}'::jsonb end end,
      'ficha', num,
      'galeria', galeria,
      'puntosDeInteres', '[]'::jsonb,
      'documentos', '[]'::jsonb);
    if i.conjunto_id is not null and i.conjunto_publicado and i.conjunto_borrado is null and i.slug_conjunto is not null then
      result := result || jsonb_build_object('conjunto', i.slug_conjunto);
    end if;
    if i.compartido and length(btrim(coalesce(i.inmobiliaria, ''))) between 2 and 120 then
      result := result || jsonb_build_object('colaboracion', true);
    end if;
    select result || jsonb_build_object('videoUrl', m.url) into result
      from public.fortius_inmuebles_inmueble_medios m
     where m.inmueble_id = i.id and m.tipo = 'video' and m.retirado_el is null and public.fortius_inmuebles_public_url(m.url)
     order by m.orden, m.created_at limit 1;
    select result || jsonb_build_object('tour360Url', m.url) into result
      from public.fortius_inmuebles_inmueble_medios m
     where m.inmueble_id = i.id and m.tipo = 'recorrido_360' and m.path is null and m.retirado_el is null
       and public.fortius_inmuebles_public_url(m.url)
     order by m.orden, m.created_at limit 1;
    return next result;
  end loop;
end; $$;
-- Solo la usa public_records (security definer); nadie la llama directo.
revoke all on function public.fortius_inmuebles_inmuebles_publicos() from public, anon, authenticated;
grant execute on function public.fortius_inmuebles_inmuebles_publicos() to service_role;

-- El sitio lee los inmuebles nuevos junto con los de siempre (misma función, sin cambiar su firma).
do $migration$
declare definition text; marker text := '''posts'') then return; end if;';
begin
  select pg_get_functiondef('public.fortius_inmuebles_public_records(text)'::regprocedure) into definition;
  if definition is null or position(marker in definition) = 0 or position('inmuebles_publicos' in definition) > 0 then
    raise exception 'Unexpected public records function; review before applying';
  end if;
  execute replace(definition, marker, marker || $new$
  if p_collection = 'propiedades' then
    return query select p.d from public.fortius_inmuebles_inmuebles_publicos() as p(d);
  end if;$new$);
end;
$migration$;

notify pgrst, 'reload schema';
commit;
