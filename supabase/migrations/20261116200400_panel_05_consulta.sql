-- Panel por asuntos · bloque 5: la consulta y lo que nace de ella (etapa 3 de PLAN.md; SPEC.md, sección 4).
-- Modelo: docs/operacion/modelo-de-datos-panel.md, secciones 4.4, 4.6 y 4.11. Autorizado por el titular el 16/11/2026.
-- Trae el núcleo de inmuebles y de documentos porque «Abrir asunto» los crea. Lo demás de cada uno llega con su etapa:
--  · inmuebles: precios con historia, fotos y videos, y lo que se publica en el sitio (etapa 4);
--  · documentos: la liga para que el cliente suba sus archivos y los avisos de vencimiento (etapa 5);
--  · consultas: las solicitudes del sitio y los avisos personales (etapa 8).
-- Aditivo: no toca records, expedientes ni el panel provisional. Nada de aquí llega al sitio público.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(781023);

-- ── Inmuebles (núcleo) ────────────────────────────────────────────────────────────────────────────────
-- Un inmueble siempre pertenece a un asunto: no se inserta directo; lo crean las funciones de abajo.
create table public.fortius_inmuebles_inmuebles (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique,                 -- FORTIUS-000011, del libro de folios; no cambia
  slug text unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 120),
  nombre text not null check (length(btrim(nombre)) between 1 and 160),
  tipo text check (tipo in ('casa', 'departamento', 'terreno', 'local', 'oficina', 'nave_bodega', 'plaza_conjunto')),
  operacion text check (operacion in ('venta', 'renta')),
  conjunto_id uuid references public.fortius_inmuebles_inmuebles (id) on delete restrict,
  check (conjunto_id is distinct from id),
  unidades_total integer check (unidades_total between 1 and 500),
  precio numeric(14, 2) check (precio >= 0),
  moneda text not null default 'MXN' check (moneda in ('MXN', 'USD')),
  estado text not null default 'libre' check (estado in ('libre', 'apartado', 'rentado', 'vendido', 'retirado')),
  ficha jsonb not null default '{}' check (jsonb_typeof(ficha) = 'object' and length(ficha::text) <= 20000),
  colonia text check (length(colonia) <= 120),
  ciudad text not null default 'Tijuana' check (length(ciudad) <= 80),
  referencias text check (length(referencias) <= 500),
  direccion_exacta text check (length(direccion_exacta) <= 300),   -- privada
  mostrar_direccion boolean not null default false,
  lat numeric(9, 6) check (lat between -90 and 90),
  lng numeric(9, 6) check (lng between -180 and 180),
  descripcion text not null default '' check (length(descripcion) <= 10000),
  publicado boolean not null default false,   -- guardar no publica
  publicado_el timestamptz,
  publicado_por uuid references auth.users (id),
  compartido boolean not null default false,
  inmobiliaria text check (length(inmobiliaria) <= 160),
  portada_id uuid,                            -- llave foránea cuando lleguen las fotos (etapa 4)
  responsable_id uuid not null default auth.uid() references public.fortius_inmuebles_staff (user_id) on delete restrict,
  es_ejemplo boolean not null default false,
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id)
);
create index on public.fortius_inmuebles_inmuebles (conjunto_id) where conjunto_id is not null;
create index on public.fortius_inmuebles_inmuebles (responsable_id) where deleted_at is null;
create trigger fortius_00_folio before insert or update of folio on public.fortius_inmuebles_inmuebles
  for each row execute function public.fortius_inmuebles_panel_folio('FORTIUS');
create trigger fortius_01_version before update on public.fortius_inmuebles_inmuebles
  for each row execute function public.fortius_inmuebles_panel_version();

-- Un asunto lleva uno o varios inmuebles, cada uno con su cierre; un inmueble puede pasar a un asunto nuevo sin copiarse.
create table public.fortius_inmuebles_asunto_inmuebles (
  id uuid primary key default gen_random_uuid(),
  asunto_id uuid not null references public.fortius_inmuebles_asuntos (id) on delete restrict,
  inmueble_id uuid not null references public.fortius_inmuebles_inmuebles (id) on delete restrict,
  estado text check (length(estado) <= 40),
  resultado text check (resultado in ('se_logro', 'no_se_dio')),
  cerrado_el timestamptz,
  orden numeric not null default 0,
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  retirado_el timestamptz,
  unique (asunto_id, inmueble_id)
);
create index on public.fortius_inmuebles_asunto_inmuebles (inmueble_id) where retirado_el is null;
create trigger fortius_01_version before update on public.fortius_inmuebles_asunto_inmuebles
  for each row execute function public.fortius_inmuebles_panel_version();

-- ¿Puede quien está en sesión ver este inmueble? Director: todos. Asesor: los que lleva y los de los asuntos que ve.
create function public.fortius_inmuebles_puede_ver_inmueble(p_inmueble uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_inmueble is not null and (
    public.fortius_inmuebles_is_admin()
    or (public.fortius_inmuebles_is_staff() and (
      exists (select 1 from public.fortius_inmuebles_inmuebles i
               where i.id = p_inmueble and i.deleted_at is null and i.responsable_id = auth.uid())
      or exists (select 1 from public.fortius_inmuebles_asunto_inmuebles ai
                  where ai.inmueble_id = p_inmueble and ai.retirado_el is null
                    and public.fortius_inmuebles_puede_ver_asunto(ai.asunto_id)))));
$$;
revoke all on function public.fortius_inmuebles_puede_ver_inmueble(uuid) from public, anon;
grant execute on function public.fortius_inmuebles_puede_ver_inmueble(uuid) to authenticated, service_role;

-- Protecciones del inmueble (no frenos): quién lo reasigna, lo borra o lo restaura; publicar deja quién y cuándo.
create function public.fortius_inmuebles_guard_inmueble() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and tg_op = 'UPDATE' then
    if new.responsable_id is distinct from old.responsable_id and not public.fortius_inmuebles_is_admin() then
      raise sqlstate 'PT403' using message = 'Solo el director cambia quién lleva este inmueble';
    end if;
    if new.deleted_at is distinct from old.deleted_at
       and not public.fortius_inmuebles_is_admin()
       and not (old.deleted_at is null and old.responsable_id = auth.uid()) then
      raise sqlstate 'PT403' using message = 'Solo el director o quien lo lleva lo manda a Eliminados; solo el director lo restaura';
    end if;
  end if;
  if tg_op = 'UPDATE' and new.deleted_at is distinct from old.deleted_at then
    new.deleted_by := case when new.deleted_at is null then null else auth.uid() end;
  end if;
  if new.publicado and (tg_op = 'INSERT' or not old.publicado) then
    new.publicado_el := now();
    new.publicado_por := auth.uid();
  end if;
  if new.ciudad is null or btrim(new.ciudad) = '' then new.ciudad := 'Tijuana'; end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_inmueble() from public, anon, authenticated, service_role;
create trigger fortius_02_guard before insert or update on public.fortius_inmuebles_inmuebles
  for each row execute function public.fortius_inmuebles_guard_inmueble();

-- La liga no cambia de asunto ni de inmueble; y un inmueble no se queda sin asunto (integridad, no proceso).
create function public.fortius_inmuebles_guard_asunto_inmueble() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.asunto_id <> old.asunto_id or new.inmueble_id <> old.inmueble_id then
    raise sqlstate '22023' using message = 'Para cambiar el asunto o el inmueble, quita esta liga y agrega otra';
  end if;
  if new.retirado_el is not null and old.retirado_el is null and not exists (
       select 1 from public.fortius_inmuebles_asunto_inmuebles x
        where x.inmueble_id = new.inmueble_id and x.id <> new.id and x.retirado_el is null) then
    raise sqlstate '22023' using message = 'El inmueble se quedaría sin asunto: ligalo antes a otro asunto o mándalo a Eliminados';
  end if;
  if new.resultado is not null and old.resultado is null then new.cerrado_el := now(); end if;
  if new.resultado is null then new.cerrado_el := null; end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_asunto_inmueble() from public, anon, authenticated, service_role;
create trigger fortius_02_guard before update on public.fortius_inmuebles_asunto_inmuebles
  for each row execute function public.fortius_inmuebles_guard_asunto_inmueble();

create trigger fortius_zz_historial after insert or update on public.fortius_inmuebles_inmuebles
  for each row execute function public.fortius_inmuebles_registrar_cambio(
    'inmueble', 'nombre,tipo,operacion,precio,moneda,estado,colonia,mostrar_direccion,publicado,compartido,responsable_id');
create trigger fortius_zz_historial after insert or update on public.fortius_inmuebles_asunto_inmuebles
  for each row execute function public.fortius_inmuebles_registrar_cambio('asunto_inmueble', 'inmueble_id,estado,resultado,retirado_el');

alter table public.fortius_inmuebles_inmuebles enable row level security;
revoke all on public.fortius_inmuebles_inmuebles from anon, authenticated;
grant select, update on public.fortius_inmuebles_inmuebles to authenticated;   -- se crean solo con crear_inmueble
grant all on public.fortius_inmuebles_inmuebles to service_role;
create policy inmuebles_read on public.fortius_inmuebles_inmuebles for select to authenticated
  using (public.fortius_inmuebles_puede_ver_inmueble(id));
create policy inmuebles_update on public.fortius_inmuebles_inmuebles for update to authenticated
  using (public.fortius_inmuebles_puede_ver_inmueble(id)) with check ((select public.fortius_inmuebles_is_staff()));

alter table public.fortius_inmuebles_asunto_inmuebles enable row level security;
revoke all on public.fortius_inmuebles_asunto_inmuebles from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_asunto_inmuebles to authenticated;
grant all on public.fortius_inmuebles_asunto_inmuebles to service_role;
create policy asunto_inmuebles_read on public.fortius_inmuebles_asunto_inmuebles for select to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(asunto_id));
-- Ligar a otro asunto pide ver los dos: nadie se da acceso a un inmueble ajeno colgándolo de su asunto.
create policy asunto_inmuebles_insert on public.fortius_inmuebles_asunto_inmuebles for insert to authenticated
  with check (creado_por = (select auth.uid()) and public.fortius_inmuebles_puede_ver_asunto(asunto_id)
              and public.fortius_inmuebles_puede_ver_inmueble(inmueble_id));
create policy asunto_inmuebles_update on public.fortius_inmuebles_asunto_inmuebles for update to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(asunto_id)) with check (public.fortius_inmuebles_puede_ver_asunto(asunto_id));

-- Crea un inmueble ya ligado a su asunto, en una sola transacción. p_datos: nombre, tipo, operacion, colonia, precio, moneda.
create function public.fortius_inmuebles_crear_inmueble(p_asunto uuid, p_datos jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare a record; nuevo record;
begin
  if not public.fortius_inmuebles_puede_ver_asunto(p_asunto) then
    raise sqlstate 'PT403' using message = 'Sin acceso a ese asunto';
  end if;
  if jsonb_typeof(coalesce(p_datos, '{}')) <> 'object' then
    raise sqlstate '22023' using message = 'Datos del inmueble no válidos';
  end if;
  select responsable_id, es_ejemplo into a from public.fortius_inmuebles_asuntos where id = p_asunto;
  insert into public.fortius_inmuebles_inmuebles (nombre, tipo, operacion, colonia, precio, moneda, responsable_id, es_ejemplo, creado_por)
  values (coalesce(nullif(btrim(p_datos->>'nombre'), ''), 'Inmueble por describir'), nullif(p_datos->>'tipo', ''),
          nullif(p_datos->>'operacion', ''), nullif(btrim(coalesce(p_datos->>'colonia', '')), ''),
          nullif(p_datos->>'precio', '')::numeric, coalesce(nullif(p_datos->>'moneda', ''), 'MXN'),
          a.responsable_id, a.es_ejemplo, auth.uid())
  returning id, folio into nuevo;
  insert into public.fortius_inmuebles_asunto_inmuebles (asunto_id, inmueble_id, orden, creado_por)
  values (p_asunto, nuevo.id,
          coalesce((select max(orden) + 1 from public.fortius_inmuebles_asunto_inmuebles where asunto_id = p_asunto), 0), auth.uid());
  return jsonb_build_object('id', nuevo.id, 'folio', nuevo.folio);
end; $$;
revoke all on function public.fortius_inmuebles_crear_inmueble(uuid, jsonb) from public, anon;
grant execute on function public.fortius_inmuebles_crear_inmueble(uuid, jsonb) to authenticated, service_role;

-- Las ligas que dejaron pendientes los bloques anteriores.
alter table public.fortius_inmuebles_asunto_personas
  add constraint fortius_inmuebles_asunto_personas_inmueble_fk
  foreign key (inmueble_id) references public.fortius_inmuebles_inmuebles (id) on delete restrict;
alter table public.fortius_inmuebles_tareas
  add constraint fortius_inmuebles_tareas_inmueble_fk
  foreign key (inmueble_id) references public.fortius_inmuebles_inmuebles (id) on delete restrict;

-- ── Documentos del asunto (núcleo) ────────────────────────────────────────────────────────────────────
-- La única lista de documentos del asunto: lo que falta, lo recibido y lo que no aplica, con quién lo entrega.
create table public.fortius_inmuebles_asunto_documentos (
  id uuid primary key default gen_random_uuid(),
  asunto_id uuid not null references public.fortius_inmuebles_asuntos (id) on delete restrict,
  nombre text not null check (length(btrim(nombre)) between 1 and 200),
  grupo text check (length(grupo) <= 80),
  estado text not null default 'falta' check (estado in ('falta', 'recibido', 'no_aplica')),
  recibido_el timestamptz,
  entrega_persona_id uuid references public.fortius_inmuebles_personas (id) on delete restrict,
  entrega_papel text check (length(entrega_papel) <= 40),
  de_persona_id uuid references public.fortius_inmuebles_personas (id) on delete restrict,
  inmueble_id uuid references public.fortius_inmuebles_inmuebles (id) on delete restrict,
  vence_el date,
  avisar_dias integer check (avisar_dias between 0 and 365),
  origen text not null default 'manual' check (origen in ('consulta', 'biblioteca', 'manual', 'formato', 'herramienta', 'cliente')),
  paso text check (paso in ('borrador', 'revisado', 'firmado')),
  formato_draft_id uuid,                      -- llaves foráneas con Documentos y Herramientas (etapa 6)
  emision_id uuid,
  app_run_id uuid,
  es_contrato boolean not null default false,
  es_recibo boolean not null default false,
  nota text not null default '' check (length(nota) <= 2000),
  orden numeric not null default 0,
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on public.fortius_inmuebles_asunto_documentos (asunto_id, orden) where deleted_at is null;
create index on public.fortius_inmuebles_asunto_documentos (vence_el) where vence_el is not null and deleted_at is null;
create trigger fortius_01_version before update on public.fortius_inmuebles_asunto_documentos
  for each row execute function public.fortius_inmuebles_panel_version();

create function public.fortius_inmuebles_guard_documento() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.asunto_id <> old.asunto_id then
    raise sqlstate '22023' using message = 'Un documento no cambia de asunto';
  end if;
  if new.estado = 'recibido' and (tg_op = 'INSERT' or old.estado <> 'recibido') then
    new.recibido_el := coalesce(new.recibido_el, now());
  elsif new.estado <> 'recibido' then
    new.recibido_el := null;
  end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_documento() from public, anon, authenticated, service_role;
create trigger fortius_02_guard before insert or update on public.fortius_inmuebles_asunto_documentos
  for each row execute function public.fortius_inmuebles_guard_documento();
create trigger fortius_zz_historial after insert or update of nombre, estado, entrega_papel, vence_el, paso, deleted_at
  on public.fortius_inmuebles_asunto_documentos
  for each row execute function public.fortius_inmuebles_registrar_cambio('documento', 'nombre,estado,entrega_papel,vence_el,paso');

-- Archivos de cada documento (frente y reverso, versión firmada…). Bucket privado de expedientes.
create table public.fortius_inmuebles_documento_archivos (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references public.fortius_inmuebles_asunto_documentos (id) on delete restrict,
  asunto_id uuid not null references public.fortius_inmuebles_asuntos (id) on delete restrict,
  path text not null unique check (path ~ '^(asuntos|consultas)/[0-9a-f-]{36}/[A-Za-z0-9._-]{1,200}$'),
  nombre_original text not null check (length(nombre_original) between 1 and 240),
  mime text not null check (mime in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  byte_length bigint not null check (byte_length between 1 and 20971520),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  subido_por uuid default auth.uid() references auth.users (id),
  por_cliente boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on public.fortius_inmuebles_documento_archivos (documento_id) where deleted_at is null;

create function public.fortius_inmuebles_guard_documento_archivo() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.fortius_inmuebles_asunto_documentos d where d.id = new.documento_id and d.asunto_id = new.asunto_id) then
    raise sqlstate '22023' using message = 'El archivo no corresponde a un documento de este asunto';
  end if;
  if tg_op = 'UPDATE' and (new.documento_id <> old.documento_id or new.path <> old.path or new.sha256 <> old.sha256) then
    raise sqlstate '22023' using message = 'Un archivo subido no cambia; se sube otro';
  end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_documento_archivo() from public, anon, authenticated, service_role;
create trigger fortius_02_guard before insert or update on public.fortius_inmuebles_documento_archivos
  for each row execute function public.fortius_inmuebles_guard_documento_archivo();

alter table public.fortius_inmuebles_asunto_documentos enable row level security;
revoke all on public.fortius_inmuebles_asunto_documentos from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_asunto_documentos to authenticated;
grant all on public.fortius_inmuebles_asunto_documentos to service_role;
create policy asunto_documentos_read on public.fortius_inmuebles_asunto_documentos for select to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(asunto_id));
create policy asunto_documentos_insert on public.fortius_inmuebles_asunto_documentos for insert to authenticated
  with check (creado_por = (select auth.uid()) and public.fortius_inmuebles_puede_ver_asunto(asunto_id));
create policy asunto_documentos_update on public.fortius_inmuebles_asunto_documentos for update to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(asunto_id)) with check (public.fortius_inmuebles_puede_ver_asunto(asunto_id));

-- Los archivos los sube el servidor (con la llave privilegiada, tras comprobar el acceso); la app solo los lee.
alter table public.fortius_inmuebles_documento_archivos enable row level security;
revoke all on public.fortius_inmuebles_documento_archivos from anon, authenticated;
grant select on public.fortius_inmuebles_documento_archivos to authenticated;
grant all on public.fortius_inmuebles_documento_archivos to service_role;
create policy documento_archivos_read on public.fortius_inmuebles_documento_archivos for select to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(asunto_id));

alter table public.fortius_inmuebles_tareas
  add constraint fortius_inmuebles_tareas_documento_fk
  foreign key (documento_id) references public.fortius_inmuebles_asunto_documentos (id) on delete restrict;

-- ── Consultas ─────────────────────────────────────────────────────────────────────────────────────────
-- Lo que cuenta quien llama, capturado mientras habla. Se guarda sola; nada es obligatorio.
create table public.fortius_inmuebles_consultas (
  id uuid primary key default gen_random_uuid(),
  quien_nombre text not null default '' check (length(quien_nombre) <= 160),
  -- [{pais: '+1', numero: '6195550142'}]: se normaliza igual que en la persona al abrir el asunto
  quien_telefonos jsonb not null default '[]' check (jsonb_typeof(quien_telefonos) = 'array' and jsonb_array_length(quien_telefonos) <= 5),
  quien_correo text check (length(quien_correo) <= 200),
  canal text not null default 'llamada' check (canal in ('llamada', 'whatsapp', 'en_persona', 'sitio', 'otro')),
  persona_id uuid references public.fortius_inmuebles_personas (id) on delete restrict,
  que_pasa text not null default '' check (length(que_pasa) <= 20000),
  -- Los datos de siempre: que_quiere, de_quien, tipo, colonia, ocupa, escritura, debe[]
  datos jsonb not null default '{}' check (jsonb_typeof(datos) = 'object' and length(datos::text) <= 5000),
  -- [{nombre, papel, pais?, numero?, fallecida?}] hasta abrir el asunto
  otras_personas jsonb not null default '[]' check (jsonb_typeof(otras_personas) = 'array' and jsonb_array_length(otras_personas) <= 30),
  -- [{nombre, grupo?, entrega_papel?, quitado?}]
  documentos_pedir jsonb not null default '[]' check (jsonb_typeof(documentos_pedir) = 'array' and jsonb_array_length(documentos_pedir) <= 80),
  estado text not null default 'abierta' check (estado in ('abierta', 'asunto', 'contacto', 'no_procede')),
  motivo text check (length(motivo) <= 1000),
  asunto_id uuid references public.fortius_inmuebles_asuntos (id) on delete restrict,
  check ((estado = 'asunto') = (asunto_id is not null)),
  solicitud_id uuid,                          -- llave foránea con las solicitudes del sitio (etapa 8)
  cerrada_el timestamptz,
  responsable_id uuid not null default auth.uid() references public.fortius_inmuebles_staff (user_id) on delete restrict,
  es_ejemplo boolean not null default false,
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on public.fortius_inmuebles_consultas (responsable_id, estado) where deleted_at is null;
create trigger fortius_01_version before update on public.fortius_inmuebles_consultas
  for each row execute function public.fortius_inmuebles_panel_version();

create function public.fortius_inmuebles_guard_consulta() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' and new.responsable_id is distinct from auth.uid() and not public.fortius_inmuebles_is_admin() then
      raise sqlstate 'PT403' using message = 'Solo el director abre una consulta a nombre de otra persona';
    end if;
    if tg_op = 'UPDATE' and new.responsable_id is distinct from old.responsable_id and not public.fortius_inmuebles_is_admin() then
      raise sqlstate 'PT403' using message = 'Solo el director cambia quién atiende la consulta';
    end if;
  end if;
  if tg_op = 'UPDATE' and old.estado = 'asunto' and (new.estado <> 'asunto' or new.asunto_id <> old.asunto_id) then
    raise sqlstate '22023' using message = 'Esta consulta ya abrió su asunto';
  end if;
  if new.estado <> 'abierta' and (tg_op = 'INSERT' or old.estado = 'abierta') then
    new.cerrada_el := now();
  elsif new.estado = 'abierta' then
    new.cerrada_el := null;
    new.motivo := null;
  end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_consulta() from public, anon, authenticated, service_role;
create trigger fortius_02_guard before insert or update on public.fortius_inmuebles_consultas
  for each row execute function public.fortius_inmuebles_guard_consulta();
-- Mientras se escribe cambia a cada rato: el historial solo anota cuando se cierra o se reabre.
create trigger fortius_zz_historial after update of estado, deleted_at on public.fortius_inmuebles_consultas
  for each row execute function public.fortius_inmuebles_registrar_cambio('consulta', 'estado,motivo');

create function public.fortius_inmuebles_puede_ver_consulta(p_consulta uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_consulta is not null and (
    public.fortius_inmuebles_is_admin()
    or (public.fortius_inmuebles_is_staff() and exists (
      select 1 from public.fortius_inmuebles_consultas c
       where c.id = p_consulta and c.deleted_at is null and c.responsable_id = auth.uid())));
$$;
revoke all on function public.fortius_inmuebles_puede_ver_consulta(uuid) from public, anon;
grant execute on function public.fortius_inmuebles_puede_ver_consulta(uuid) to authenticated, service_role;

alter table public.fortius_inmuebles_consultas enable row level security;
revoke all on public.fortius_inmuebles_consultas from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_consultas to authenticated;
grant all on public.fortius_inmuebles_consultas to service_role;
create policy consultas_read on public.fortius_inmuebles_consultas for select to authenticated
  using (public.fortius_inmuebles_puede_ver_consulta(id));
create policy consultas_insert on public.fortius_inmuebles_consultas for insert to authenticated
  with check ((select public.fortius_inmuebles_is_staff()) and creado_por = (select auth.uid()));
create policy consultas_update on public.fortius_inmuebles_consultas for update to authenticated
  using (public.fortius_inmuebles_puede_ver_consulta(id)) with check ((select public.fortius_inmuebles_is_staff()));

alter table public.fortius_inmuebles_asuntos
  add constraint fortius_inmuebles_asuntos_consulta_fk
  foreign key (consulta_id) references public.fortius_inmuebles_consultas (id) on delete restrict;
alter table public.fortius_inmuebles_tareas
  add constraint fortius_inmuebles_tareas_consulta_fk
  foreign key (consulta_id) references public.fortius_inmuebles_consultas (id) on delete restrict;

-- ── Archivos que esperan su renglón ───────────────────────────────────────────────────────────────────
-- Lo que se adjunta en la consulta (o con «Subir varios» en un asunto) antes de caer en su documento.
create table public.fortius_inmuebles_cargas_por_acomodar (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id),
  asunto_id uuid references public.fortius_inmuebles_asuntos (id) on delete restrict,
  consulta_id uuid references public.fortius_inmuebles_consultas (id) on delete restrict,
  path text not null unique check (path ~ '^(asuntos|consultas)/[0-9a-f-]{36}/[A-Za-z0-9._-]{1,200}$'),
  nombre_original text not null check (length(nombre_original) between 1 and 240),
  mime text not null check (mime in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  byte_length bigint not null check (byte_length between 1 and 20971520),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  estado text not null default 'por_acomodar' check (estado in ('por_acomodar', 'acomodado', 'descartado')),
  documento_id uuid references public.fortius_inmuebles_asunto_documentos (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.fortius_inmuebles_cargas_por_acomodar (consulta_id) where consulta_id is not null;
create index on public.fortius_inmuebles_cargas_por_acomodar (asunto_id, estado) where asunto_id is not null;

alter table public.fortius_inmuebles_cargas_por_acomodar enable row level security;
revoke all on public.fortius_inmuebles_cargas_por_acomodar from anon, authenticated;
grant select, update (estado, updated_at) on public.fortius_inmuebles_cargas_por_acomodar to authenticated;
grant all on public.fortius_inmuebles_cargas_por_acomodar to service_role;
create policy cargas_read on public.fortius_inmuebles_cargas_por_acomodar for select to authenticated using (
  (select public.fortius_inmuebles_is_admin())
  or usuario_id = (select auth.uid())
  or (asunto_id is not null and public.fortius_inmuebles_puede_ver_asunto(asunto_id))
  or (consulta_id is not null and public.fortius_inmuebles_puede_ver_consulta(consulta_id)));
create policy cargas_update on public.fortius_inmuebles_cargas_por_acomodar for update to authenticated using (
  (select public.fortius_inmuebles_is_admin())
  or usuario_id = (select auth.uid())
  or (asunto_id is not null and public.fortius_inmuebles_puede_ver_asunto(asunto_id))
  or (consulta_id is not null and public.fortius_inmuebles_puede_ver_consulta(consulta_id)));

-- ── Abrir el asunto desde la consulta ─────────────────────────────────────────────────────────────────
-- Todo en una transacción: la persona (o la que ya existía), el asunto con su folio y sus apartados, las otras personas
-- con su papel, el inmueble si se describió, la lista de documentos, lo que ya mandó (como recibido) y el primer plan.
-- La pantalla decide nombre, encargos, apartados, papel de quien llama, inmueble y plan; aquí se guarda todo junto.
-- p_plan: [{nombre, tareas: [{titulo, quien, dias}]}].
create function public.fortius_inmuebles_abrir_asunto_desde_consulta(
  p_consulta uuid, p_version bigint, p_nombre text, p_encargos text[], p_apartados text[],
  p_papel text, p_inmueble jsonb, p_plan jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  c public.fortius_inmuebles_consultas;
  persona uuid;
  asunto uuid;
  v_folio text;
  inm jsonb;
  inmueble uuid;
  x jsonb;
  t jsonb;
  etapa uuid;
  doc uuid;
  carga record;
  otra uuid;
  i integer := 0;
  j integer;
  canal_texto text;
begin
  if not public.fortius_inmuebles_is_staff() then
    raise sqlstate 'PT403' using message = 'Sin acceso';
  end if;
  select * into c from public.fortius_inmuebles_consultas where id = p_consulta for update;
  if not found or not public.fortius_inmuebles_puede_ver_consulta(p_consulta) then
    raise sqlstate 'PT403' using message = 'Sin acceso a esa consulta';
  end if;
  if c.version <> p_version then
    raise sqlstate 'PT409' using message = 'Alguien más cambió esta consulta';
  end if;
  if c.estado = 'asunto' then
    raise sqlstate '22023' using message = 'Esta consulta ya abrió su asunto';
  end if;
  if p_papel not in ('contacto', 'propietario', 'titular', 'heredero', 'copropietario', 'comprador', 'vendedor', 'inquilino',
                     'inversionista', 'contraparte', 'apoderado') then
    raise sqlstate '22023' using message = 'Papel no válido';
  end if;
  if jsonb_typeof(coalesce(p_plan, '[]')) <> 'array' then
    raise sqlstate '22023' using message = 'Plan no válido';
  end if;

  -- Quien llama: la ficha elegida o una nueva.
  if c.persona_id is not null then
    if not public.fortius_inmuebles_puede_ver_persona(c.persona_id) then
      raise sqlstate 'PT403' using message = 'Sin acceso a esa persona';
    end if;
    persona := c.persona_id;
  else
    canal_texto := case c.canal when 'llamada' then 'Llamada' when 'whatsapp' then 'WhatsApp' when 'en_persona' then 'En persona'
                                when 'sitio' then 'Sitio' else 'Otro' end;
    insert into public.fortius_inmuebles_personas (nombre, telefonos, correo, canal, responsable_id, es_ejemplo, creado_por)
    values (coalesce(nullif(btrim(c.quien_nombre), ''), 'Sin nombre'), c.quien_telefonos, nullif(btrim(coalesce(c.quien_correo, '')), ''),
            canal_texto, c.responsable_id, c.es_ejemplo, auth.uid())
    returning id into persona;
  end if;

  insert into public.fortius_inmuebles_asuntos (nombre, encargos, responsable_id, consulta_id, situacion, es_ejemplo, creado_por)
  values (left(coalesce(nullif(btrim(p_nombre), ''), 'Asunto sin nombre'), 160), coalesce(p_encargos, '{}'), c.responsable_id,
          c.id, c.que_pasa, c.es_ejemplo, auth.uid())
  returning id, folio into asunto, v_folio;

  insert into public.fortius_inmuebles_apartados (asunto_id, clave, orden, creado_por)
  select asunto, k, case k when 'inmueble' then 20 when 'interesados' then 30 when 'situacion' then 40 when 'documentos' then 50
                           when 'opinion' then 60 when 'honorarios' then 70 else 75 end, auth.uid()
    from unnest(coalesce(p_apartados, '{}')) k
   where k in ('inmueble', 'interesados', 'situacion', 'documentos', 'opinion', 'honorarios')
  on conflict do nothing;

  insert into public.fortius_inmuebles_asunto_personas (asunto_id, persona_id, papel, principal, orden, creado_por)
  values (asunto, persona, p_papel, true, 0, auth.uid());

  -- Las otras personas del caso, cada una con su ficha y su papel.
  for x in select * from jsonb_array_elements(c.otras_personas) loop
    i := i + 1;
    if coalesce(btrim(x->>'nombre'), '') = '' then continue; end if;
    insert into public.fortius_inmuebles_personas (nombre, fallecida, telefonos, responsable_id, es_ejemplo, creado_por)
    values (left(btrim(x->>'nombre'), 160), coalesce((x->>'fallecida')::boolean, false),
            case when coalesce(x->>'numero', '') <> '' and not coalesce((x->>'fallecida')::boolean, false)
                 then jsonb_build_array(jsonb_build_object('pais', coalesce(nullif(x->>'pais', ''), '+52'), 'numero', x->>'numero'))
                 else '[]'::jsonb end,
            c.responsable_id, c.es_ejemplo, auth.uid())
    returning id into otra;
    insert into public.fortius_inmuebles_asunto_personas (asunto_id, persona_id, papel, orden, creado_por)
    values (asunto, otra, coalesce(nullif(x->>'papel', ''), 'contacto'), i, auth.uid())
    on conflict do nothing;
  end loop;

  -- El inmueble, si se describió.
  if p_inmueble is not null and jsonb_typeof(p_inmueble) = 'object' then
    inm := public.fortius_inmuebles_crear_inmueble(asunto, p_inmueble);
    inmueble := (inm->>'id')::uuid;
  end if;

  -- Lo que hay que pedirle (sin lo que se quitó).
  i := 0;
  for x in select * from jsonb_array_elements(c.documentos_pedir) loop
    if coalesce((x->>'quitado')::boolean, false) or coalesce(btrim(x->>'nombre'), '') = '' then continue; end if;
    i := i + 1;
    insert into public.fortius_inmuebles_asunto_documentos (asunto_id, nombre, grupo, entrega_papel, inmueble_id, origen, orden, creado_por)
    values (asunto, left(btrim(x->>'nombre'), 200), nullif(x->>'grupo', ''), coalesce(nullif(x->>'entrega_papel', ''), 'cliente'),
            case when x->>'grupo' = 'inmueble' then inmueble end, 'consulta', i, auth.uid());
  end loop;

  -- Lo que ya mandó: cada archivo cae en su documento, como recibido.
  for carga in select * from public.fortius_inmuebles_cargas_por_acomodar
                where consulta_id = c.id and estado = 'por_acomodar' order by created_at loop
    i := i + 1;
    insert into public.fortius_inmuebles_asunto_documentos (asunto_id, nombre, estado, entrega_papel, origen, orden, creado_por)
    values (asunto, left(regexp_replace(carga.nombre_original, '\.[A-Za-z0-9]{1,5}$', ''), 200), 'recibido', 'cliente', 'consulta', i, auth.uid())
    returning id into doc;
    insert into public.fortius_inmuebles_documento_archivos (documento_id, asunto_id, path, nombre_original, mime, byte_length, sha256, subido_por)
    values (doc, asunto, carga.path, carga.nombre_original, carga.mime, carga.byte_length, carga.sha256, carga.usuario_id);
    update public.fortius_inmuebles_cargas_por_acomodar
       set estado = 'acomodado', documento_id = doc, asunto_id = asunto, updated_at = now()
     where id = carga.id;
  end loop;

  -- El primer plan.
  i := 0;
  for x in select * from jsonb_array_elements(coalesce(p_plan, '[]')) loop
    i := i + 1;
    insert into public.fortius_inmuebles_plan_etapas (asunto_id, nombre, orden, creado_por)
    values (asunto, left(coalesce(nullif(btrim(x->>'nombre'), ''), 'Pendientes'), 120), i, auth.uid())
    returning id into etapa;
    j := 0;
    for t in select * from jsonb_array_elements(coalesce(x->'tareas', '[]')) loop
      j := j + 1;
      if coalesce(btrim(t->>'titulo'), '') = '' then continue; end if;
      insert into public.fortius_inmuebles_tareas (asunto_id, etapa_id, titulo, quien, responsable_id, fecha, origen, orden, creado_por)
      values (asunto, etapa, left(btrim(t->>'titulo'), 300),
              case when t->>'quien' in ('fortius', 'cliente', 'abogado', 'notaria', 'otro') then t->>'quien' else 'fortius' end,
              c.responsable_id,
              case when t ? 'dias' and jsonb_typeof(t->'dias') = 'number' then current_date + least(greatest((t->>'dias')::integer, 0), 365) end,
              'consulta', j, auth.uid());
    end loop;
  end loop;

  update public.fortius_inmuebles_consultas set estado = 'asunto', asunto_id = asunto, persona_id = persona where id = c.id;

  insert into public.fortius_inmuebles_historial (entidad, entidad_id, asunto_id, clase, resumen, actor_id, actor_tipo)
  values ('asunto', asunto::text, asunto, 'nota',
          left('Nació de una consulta' || case c.canal when 'llamada' then ' por llamada' when 'whatsapp' then ' por WhatsApp'
               when 'en_persona' then ' en persona' when 'sitio' then ' del sitio' else '' end || '.'
               || coalesce(' ' || nullif(btrim(c.que_pasa), ''), ''), 2000),
          auth.uid(), 'usuario');

  return jsonb_build_object('id', asunto, 'folio', v_folio, 'persona_id', persona, 'inmueble_id', inmueble);
end; $$;
revoke all on function public.fortius_inmuebles_abrir_asunto_desde_consulta(uuid, bigint, text, text[], text[], text, jsonb, jsonb) from public, anon;
grant execute on function public.fortius_inmuebles_abrir_asunto_desde_consulta(uuid, bigint, text, text[], text[], text, jsonb, jsonb) to authenticated, service_role;

-- Una consulta que no se vuelve asunto: la persona queda en el Directorio con fecha para volver a llamarle.
create function public.fortius_inmuebles_consulta_a_contacto(p_consulta uuid, p_version bigint, p_volver date)
returns uuid language plpgsql security definer set search_path = '' as $$
declare c public.fortius_inmuebles_consultas; persona uuid;
begin
  if not public.fortius_inmuebles_is_staff() then
    raise sqlstate 'PT403' using message = 'Sin acceso';
  end if;
  select * into c from public.fortius_inmuebles_consultas where id = p_consulta for update;
  if not found or not public.fortius_inmuebles_puede_ver_consulta(p_consulta) then
    raise sqlstate 'PT403' using message = 'Sin acceso a esa consulta';
  end if;
  if c.version <> p_version then
    raise sqlstate 'PT409' using message = 'Alguien más cambió esta consulta';
  end if;
  if c.estado = 'asunto' then
    raise sqlstate '22023' using message = 'Esta consulta ya abrió su asunto';
  end if;
  if c.persona_id is not null then
    persona := c.persona_id;
    update public.fortius_inmuebles_personas set volver_a_llamar = p_volver,
           nota = left(case when nota = '' then '' else nota || E'\n' end || coalesce(nullif(btrim(c.que_pasa), ''), ''), 2000)
     where id = persona;
  else
    insert into public.fortius_inmuebles_personas (nombre, telefonos, correo, canal, volver_a_llamar, nota, responsable_id, es_ejemplo, creado_por)
    values (coalesce(nullif(btrim(c.quien_nombre), ''), 'Sin nombre'), c.quien_telefonos, nullif(btrim(coalesce(c.quien_correo, '')), ''),
            case c.canal when 'llamada' then 'Llamada' when 'whatsapp' then 'WhatsApp' when 'en_persona' then 'En persona' when 'sitio' then 'Sitio' else 'Otro' end,
            p_volver, left(c.que_pasa, 2000), c.responsable_id, c.es_ejemplo, auth.uid())
    returning id into persona;
  end if;
  update public.fortius_inmuebles_consultas set estado = 'contacto', persona_id = persona where id = c.id;
  return persona;
end; $$;
revoke all on function public.fortius_inmuebles_consulta_a_contacto(uuid, bigint, date) from public, anon;
grant execute on function public.fortius_inmuebles_consulta_a_contacto(uuid, bigint, date) to authenticated, service_role;

notify pgrst, 'reload schema';
commit;
