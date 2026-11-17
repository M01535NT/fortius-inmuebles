-- Etapa 6 de PLAN.md: documentos por preguntas y Herramientas (SPEC.md, secciones 8 y 9).
-- · Un «trabajo» es un formato que se llena por preguntas o una cuenta de Herramientas. Puede nacer en un asunto o suelto
--   (sin asunto); uno suelto lo ve solo quien lo hizo y el director, y «Pasar a un asunto» lo cuelga de un asunto una sola vez.
-- · Los datos del inmueble que piden los contratos (folio real, clave catastral, escritura…) viven aparte y son privados,
--   como los datos para contratos de la persona: así lo capturado en un contrato no se vuelve a pedir.
-- Nada frena: las reglas de aquí son de integridad (de quién es cada cosa), no de proceso.
-- Detalle: docs/operacion/modelo-de-datos-panel.md, secciones 4.6 y 4.12.

-- ── Trabajos: formatos y cuentas ──────────────────────────────────────────────────────────────────────
create table public.fortius_inmuebles_trabajos (
  id uuid primary key default gen_random_uuid(),
  asunto_id uuid references public.fortius_inmuebles_asuntos (id) on delete restrict,   -- vacío: trabajo suelto
  clase text not null check (clase in ('formato', 'herramienta')),
  tipo text not null check (tipo ~ '^[0-9A-Za-z_]{1,20}$'),       -- el número del formato («09») o la herramienta («credito»)
  nombre text not null check (length(btrim(nombre)) between 1 and 160),
  datos jsonb not null default '{}' check (jsonb_typeof(datos) = 'object' and octet_length(datos::text) <= 250000),
  resultado text check (length(resultado) <= 300),                -- la línea que se ve en la lista («Mensualidad $18,450»)
  documento_id uuid references public.fortius_inmuebles_asunto_documentos (id) on delete restrict,
  pdf_version bigint,                                             -- la versión cuyo PDF ya quedó en Documentos
  persona_id uuid references public.fortius_inmuebles_personas (id) on delete restrict,    -- de quién se tomaron los datos
  inmueble_id uuid references public.fortius_inmuebles_inmuebles (id) on delete restrict,
  responsable_id uuid not null default auth.uid() references public.fortius_inmuebles_staff (user_id) on delete restrict,
  es_ejemplo boolean not null default false,
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id)
);
create index on public.fortius_inmuebles_trabajos (asunto_id) where deleted_at is null;
create index on public.fortius_inmuebles_trabajos (responsable_id, updated_at desc) where asunto_id is null and deleted_at is null;

create function public.fortius_inmuebles_puede_ver_trabajo_de(p_asunto uuid, p_responsable uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select case when p_asunto is not null then public.fortius_inmuebles_puede_ver_asunto(p_asunto)
              else public.fortius_inmuebles_is_admin() or (public.fortius_inmuebles_is_staff() and p_responsable = auth.uid()) end;
$$;
revoke all on function public.fortius_inmuebles_puede_ver_trabajo_de(uuid, uuid) from public, anon;
grant execute on function public.fortius_inmuebles_puede_ver_trabajo_de(uuid, uuid) to authenticated, service_role;

-- Un trabajo pasa de suelto a un asunto una sola vez y no cambia de asunto; su documento, persona e inmueble son de ese asunto.
create function public.fortius_inmuebles_guard_trabajo() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if old.asunto_id is not null and new.asunto_id is distinct from old.asunto_id then
      raise sqlstate '22023' using message = 'El trabajo ya es de un asunto';
    end if;
    if new.clase <> old.clase or new.tipo <> old.tipo then
      raise sqlstate '22023' using message = 'No cambia de formato ni de herramienta';
    end if;
  end if;
  if new.documento_id is not null and not exists (
       select 1 from public.fortius_inmuebles_asunto_documentos d where d.id = new.documento_id and d.asunto_id = new.asunto_id) then
    raise sqlstate '22023' using message = 'El documento es de otro asunto';
  end if;
  if new.asunto_id is not null and new.persona_id is not null and (tg_op = 'INSERT' or new.persona_id is distinct from old.persona_id) and not exists (
       select 1 from public.fortius_inmuebles_asunto_personas p where p.asunto_id = new.asunto_id and p.persona_id = new.persona_id) then
    raise sqlstate '22023' using message = 'Esa persona no está en el asunto';
  end if;
  if new.asunto_id is not null and new.inmueble_id is not null and (tg_op = 'INSERT' or new.inmueble_id is distinct from old.inmueble_id) and not exists (
       select 1 from public.fortius_inmuebles_asunto_inmuebles i where i.asunto_id = new.asunto_id and i.inmueble_id = new.inmueble_id) then
    raise sqlstate '22023' using message = 'Ese inmueble no está en el asunto';
  end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_trabajo() from public, anon, authenticated, service_role;

create trigger fortius_01_version before update on public.fortius_inmuebles_trabajos
  for each row execute function public.fortius_inmuebles_panel_version();
create trigger fortius_02_guard before insert or update on public.fortius_inmuebles_trabajos
  for each row execute function public.fortius_inmuebles_guard_trabajo();
-- En el historial del asunto: que se hizo, que pasó de Herramientas y que se quitó. Lo capturado no (son datos personales).
create trigger fortius_zz_historial after insert or update of asunto_id, nombre, resultado, deleted_at on public.fortius_inmuebles_trabajos
  for each row when (new.asunto_id is not null)
  execute function public.fortius_inmuebles_registrar_cambio('trabajo', 'nombre,resultado');

alter table public.fortius_inmuebles_trabajos enable row level security;
revoke all on public.fortius_inmuebles_trabajos from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_trabajos to authenticated;
grant all on public.fortius_inmuebles_trabajos to service_role;
create policy trabajos_read on public.fortius_inmuebles_trabajos for select to authenticated
  using (public.fortius_inmuebles_puede_ver_trabajo_de(asunto_id, responsable_id));
create policy trabajos_insert on public.fortius_inmuebles_trabajos for insert to authenticated
  with check (creado_por = (select auth.uid()) and public.fortius_inmuebles_puede_ver_trabajo_de(asunto_id, responsable_id));
create policy trabajos_update on public.fortius_inmuebles_trabajos for update to authenticated
  using (public.fortius_inmuebles_puede_ver_trabajo_de(asunto_id, responsable_id))
  with check (public.fortius_inmuebles_puede_ver_trabajo_de(asunto_id, responsable_id));

-- El documento del asunto que salió de un trabajo (el contrato, la opinión de valor, la cuenta de crédito).
alter table public.fortius_inmuebles_asunto_documentos
  add column trabajo_id uuid references public.fortius_inmuebles_trabajos (id) on delete restrict;
create index on public.fortius_inmuebles_asunto_documentos (trabajo_id) where trabajo_id is not null;

-- ── Datos del inmueble para contratos ─────────────────────────────────────────────────────────────────
-- De aquí los toman los contratos y aquí se guarda lo que se captura en ellos. Privados: no salen en el sitio.
create table public.fortius_inmuebles_inmueble_datos_legales (
  id uuid primary key default gen_random_uuid(),
  inmueble_id uuid not null unique references public.fortius_inmuebles_inmuebles (id) on delete restrict,
  folio_real text check (length(folio_real) <= 200),
  partida text check (length(partida) <= 200),
  clave_catastral text check (length(clave_catastral) <= 200),
  escritura text check (length(escritura) <= 2000),
  inscripcion text check (length(inscripcion) <= 2000),
  colindancias text check (length(colindancias) <= 2000),
  regimen text check (length(regimen) <= 200),
  gravamenes text check (length(gravamenes) <= 2000),
  predial text check (length(predial) <= 500),
  agua text check (length(agua) <= 500),
  valor_avaluo numeric(14, 2) check (valor_avaluo >= 0),
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger fortius_01_version before update on public.fortius_inmuebles_inmueble_datos_legales
  for each row execute function public.fortius_inmuebles_panel_version();
-- Sin valores en el historial: solo qué campo cambió.
create trigger fortius_zz_historial after insert or update on public.fortius_inmuebles_inmueble_datos_legales
  for each row execute function public.fortius_inmuebles_registrar_cambio('inmueble_datos_legales');

alter table public.fortius_inmuebles_inmueble_datos_legales enable row level security;
revoke all on public.fortius_inmuebles_inmueble_datos_legales from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_inmueble_datos_legales to authenticated;
grant all on public.fortius_inmuebles_inmueble_datos_legales to service_role;
create policy inmueble_datos_legales_read on public.fortius_inmuebles_inmueble_datos_legales for select to authenticated
  using (public.fortius_inmuebles_puede_ver_inmueble(inmueble_id));
create policy inmueble_datos_legales_insert on public.fortius_inmuebles_inmueble_datos_legales for insert to authenticated
  with check (creado_por = (select auth.uid()) and public.fortius_inmuebles_puede_ver_inmueble(inmueble_id));
create policy inmueble_datos_legales_update on public.fortius_inmuebles_inmueble_datos_legales for update to authenticated
  using (public.fortius_inmuebles_puede_ver_inmueble(inmueble_id)) with check (public.fortius_inmuebles_puede_ver_inmueble(inmueble_id));
