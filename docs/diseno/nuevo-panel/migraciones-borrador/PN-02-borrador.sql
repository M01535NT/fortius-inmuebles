-- ============================================================================================
-- PN-02 · BORRADOR de migraciones del modelo base (AUD-02, 16/11/2026).
--
-- NO ES UNA MIGRACIÓN. No está ensayado y no se aplica así.
-- Reglas para convertirlo en migraciones reales (supabase/migrations/…):
--   1. Ensayarlo en una base local con una copia de los datos (en este equipo no hay Postgres, Docker ni la CLI de Supabase).
--   2. Un archivo por bloque, con prefijo temporal posterior a 20261114300000, sin reescribir migraciones ya aplicadas.
--   3. Avisar al titular qué cambia antes de aplicar (regla de AGENTS.md). Supabase aplica las migraciones al integrar en `main`.
--   4. Los bloques 2, 3 y 8 necesitan ensayo con datos; el 3 y el 8 todavía no están escritos aquí.
-- Estilo: prefijo fortius_inmuebles_, toda tabla nueva con RLS activada, revoke a anon y authenticated, grant explícito.
-- ============================================================================================

-- ---------- BLOQUE 1 · identidad y visibilidad (aditivo, sin riesgo para /admin) ----------
-- A diferencia de current_asesor_id() (solo para el rol editor), esta sirve también al director (decisión 3 de AUD-02).
create function public.fortius_inmuebles_mi_asesor_id() returns text
language sql stable security definer set search_path = '' as $$
  select a.asesor_id
    from public.fortius_inmuebles_adviser_accounts a
    join public.fortius_inmuebles_staff s on s.user_id = a.user_id
   where a.user_id = auth.uid() and s.active and public.fortius_inmuebles_mfa_ok();
$$;
-- OJO: fortius_inmuebles_mfa_ok() solo existe donde hay auth.mfa_factors; usar la misma guarda to_regprocedure que 20261113180000.

-- El director ve todo; el asesor ve los asuntos que lleva o en los que es miembro. No toca can_access_expediente (documentos del panel viejo).
create function public.fortius_inmuebles_puede_ver_asunto(p_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.fortius_inmuebles_is_admin() or (public.fortius_inmuebles_is_staff() and exists (
    select 1 from public.fortius_inmuebles_expedientes e
     where e.id = p_id and e.deleted_at is null and (
       e.asesor_id = public.fortius_inmuebles_current_asesor_id()
       or exists (select 1 from public.fortius_inmuebles_asunto_miembros m
                   where m.asunto_id = e.id and m.retirado_el is null
                     and m.asesor_id = public.fortius_inmuebles_current_asesor_id()))));
$$;
revoke all on function public.fortius_inmuebles_puede_ver_asunto(uuid) from public, anon;
grant execute on function public.fortius_inmuebles_puede_ver_asunto(uuid) to authenticated, service_role;

-- ---------- BLOQUE 2 · folios reservados (ENSAYAR CON DATOS) ----------
create table public.fortius_inmuebles_folios (
  serie text not null check (serie in ('EXP', 'FORTIUS', 'REC')),
  anio integer not null default 0,            -- 0 = serie sin año; REC usa el año
  numero bigint not null check (numero > 0),
  folio text not null unique,
  entidad_id text,                            -- informativo; sobrevive a la entidad
  emitido_por uuid,
  emitido_el timestamptz not null default clock_timestamp(),
  primary key (serie, anio, numero)
);
alter table public.fortius_inmuebles_folios enable row level security;
revoke all on public.fortius_inmuebles_folios from anon, authenticated;
grant select on public.fortius_inmuebles_folios to authenticated;   -- sin insert, update ni delete
grant all on public.fortius_inmuebles_folios to service_role;
create policy fortius_inmuebles_folios_read on public.fortius_inmuebles_folios
  for select to authenticated using (public.fortius_inmuebles_is_staff());

-- Respaldo de lo que ya existe (EXP- de la tabla viva, incluidos los marcados como borrados).
insert into public.fortius_inmuebles_folios (serie, numero, folio, entidad_id)
  select 'EXP', substring(upper(btrim(folio)) from 5)::bigint, upper(btrim(folio)), id::text
    from public.fortius_inmuebles_expedientes
   where upper(btrim(folio)) ~ '^EXP-[0-9]+$'
  on conflict do nothing;
-- FALTA: respaldo de FORTIUS- desde records (propiedades) y record_history.

-- Mismo nombre y mismo disparador (fortius_00_assign_expediente_folio): solo cambia el cuerpo.
create or replace function public.fortius_inmuebles_assign_expediente_folio()
returns trigger language plpgsql security definer set search_path = '' as $$
declare n bigint; s text;
begin
  perform pg_catalog.pg_advisory_xact_lock(781023);
  if nullif(btrim(new.folio), '') is null then
    select greatest(
      coalesce((select max(numero) from public.fortius_inmuebles_folios where serie = 'EXP' and anio = 0), 0),
      coalesce((select max(substring(upper(btrim(folio)) from 5)::numeric)
                  from public.fortius_inmuebles_expedientes where upper(btrim(folio)) ~ '^EXP-[0-9]+$'), 0)) + 1 into n;
    s := n::text; new.folio := 'EXP-' || lpad(s, greatest(6, length(s)), '0');
  end if;
  if upper(btrim(new.folio)) ~ '^EXP-[0-9]+$' then
    insert into public.fortius_inmuebles_folios (serie, numero, folio, entidad_id, emitido_por)
    values ('EXP', substring(upper(btrim(new.folio)) from 5)::bigint, upper(btrim(new.folio)), new.id::text, auth.uid())
    on conflict do nothing;
  end if;
  return new;
end; $$;

-- Un asunto no se borra ni cambia de folio. Nadie actualiza el folio hoy (verificado en src/app/api/admin/expedientes).
create function public.fortius_inmuebles_folio_inmutable() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then raise sqlstate 'PT409' using message = 'Un asunto no se borra: se cierra como «No se dio»'; end if;
  if new.folio is distinct from old.folio then raise sqlstate 'PT409' using message = 'El folio no cambia'; end if;
  return new;
end; $$;
create trigger fortius_00a_folio_inmutable before update or delete on public.fortius_inmuebles_expedientes
  for each row execute function public.fortius_inmuebles_folio_inmutable();

-- ---------- BLOQUE 3 · columnas del asunto (ENSAYO OBLIGATORIO; sin escribir todavía) ----------
-- En fortius_inmuebles_expedientes (aditivo): titulo, tipo_asunto (venta, renta, busqueda, tramite, inversion, revision, otro),
-- estado (activo, en_espera, cerrado), resultado (se_logro, no_se_dio), continua_de, derivado_de, creado_por;
-- cliente_id pasa a ser opcional y se ajusta guard_task_expediente (compara coalesce(clienteId,'') con cliente_id).
-- No se amplía el check de `operacion` (lo usan el freno de firma y las guías).
-- Pendiente de decisión (AUD-02, #1): filtrar `tipo_asunto is null` en la lista del panel viejo.

-- ---------- BLOQUE 4 · enlaces del asunto (aditivo) ----------
create table public.fortius_inmuebles_asunto_personas (
  asunto_id uuid not null references public.fortius_inmuebles_expedientes (id) on delete restrict,
  persona_id text not null,
  persona_collection text not null default 'clientes' check (persona_collection = 'clientes'),
  papel text not null check (papel in ('vende', 'compra', 'pone_en_renta', 'renta', 'copropietario', 'apoderado', 'aliado', 'notaria', 'banco', 'abogado', 'otro')),
  principal boolean not null default false,
  creado_por uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  retirado_el timestamptz,
  primary key (asunto_id, persona_id, papel),
  foreign key (persona_collection, persona_id) references public.fortius_inmuebles_records (collection, id) on delete restrict
);
create index on public.fortius_inmuebles_asunto_personas (persona_id);
alter table public.fortius_inmuebles_asunto_personas enable row level security;
revoke all on public.fortius_inmuebles_asunto_personas from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_asunto_personas to authenticated;
grant all on public.fortius_inmuebles_asunto_personas to service_role;
create policy asunto_personas_read on public.fortius_inmuebles_asunto_personas for select to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(asunto_id));
create policy asunto_personas_write on public.fortius_inmuebles_asunto_personas for insert to authenticated
  with check (creado_por = auth.uid() and public.fortius_inmuebles_puede_ver_asunto(asunto_id)
              and public.fortius_inmuebles_can_access_client_id(persona_id));

-- asunto_inmuebles: igual, con inmueble_id + inmueble_collection = 'propiedades',
-- relacion in ('objeto', 'visto', 'descartado', 'comparable') y nota text. (Escribir al ensayar.)

create table public.fortius_inmuebles_asunto_miembros (
  asunto_id uuid not null references public.fortius_inmuebles_expedientes (id) on delete restrict,
  asesor_id text not null,
  asesor_collection text not null default 'asesores' check (asesor_collection = 'asesores'),
  rol text not null check (rol in ('titular', 'colaborador')),
  porcentaje numeric(5, 2) check (porcentaje between 0 and 100),
  creado_por uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  retirado_el timestamptz,
  primary key (asunto_id, asesor_id),
  foreign key (asesor_collection, asesor_id) references public.fortius_inmuebles_records (collection, id) on delete restrict
);
create unique index asunto_un_titular on public.fortius_inmuebles_asunto_miembros (asunto_id)
  where rol = 'titular' and retirado_el is null;
alter table public.fortius_inmuebles_asunto_miembros enable row level security;
revoke all on public.fortius_inmuebles_asunto_miembros from anon, authenticated;
grant select on public.fortius_inmuebles_asunto_miembros to authenticated;   -- escribir: solo el director
grant all on public.fortius_inmuebles_asunto_miembros to service_role;
-- La lectura no llama a puede_ver_asunto para evitar recursión (esa función lee esta tabla).
create policy asunto_miembros_read on public.fortius_inmuebles_asunto_miembros for select to authenticated
  using (public.fortius_inmuebles_is_admin() or asesor_id = public.fortius_inmuebles_current_asesor_id());
-- FALTA: política de escritura solo para el director (alter/insert/update con is_admin()) y el disparador que mantiene
-- expedientes.asesor_id igual al miembro titular.
-- FALTA: RPC security definer fortius_inmuebles_crear_asunto(p_titulo, p_tipo, p_personas jsonb, p_inmuebles jsonb): un INSERT … RETURNING
-- con una función STABLE no ve la fila recién insertada (documentado en 20261005011326).

-- ---------- BLOQUE 5 · pendientes: una sola tabla; Hoy, Agenda, Trámites y Dinero son vistas ----------
create table public.fortius_inmuebles_pendientes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('tarea', 'llamada', 'cita', 'visita', 'firma', 'seguimiento', 'espera', 'cobro', 'entrega', 'vencimiento')),
  titulo text not null check (length(btrim(titulo)) between 1 and 160),
  detalle text not null default '' check (length(detalle) <= 2000),
  fecha date,
  hora time,
  duracion_min integer check (duracion_min between 5 and 1440),
  check (hora is null or fecha is not null),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'hecho', 'cancelado')),
  resultado text check (resultado is null or length(resultado) <= 2000),
  responsable_id text not null,
  responsable_collection text not null default 'asesores' check (responsable_collection = 'asesores'),
  creado_por uuid not null default auth.uid() references auth.users (id),
  asunto_id uuid references public.fortius_inmuebles_expedientes (id) on delete restrict,
  persona_id text,
  persona_collection text not null default 'clientes' check (persona_collection = 'clientes'),
  inmueble_id text,
  inmueble_collection text not null default 'propiedades' check (inmueble_collection = 'propiedades'),
  consulta_id uuid,       -- llave foránea en PN-05
  movimiento_id uuid,     -- llave foránea en PN-08
  origen text not null default 'manual' check (origen in ('manual', 'guia', 'sistema', 'legado')),
  origen_ref text unique, -- idempotencia (tarea o evento viejo, espera de trámite)
  orden numeric,
  version bigint not null default 1 check (version > 0),
  hecho_el timestamptz,
  hecho_por uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (responsable_collection, responsable_id) references public.fortius_inmuebles_records (collection, id) on delete restrict,
  foreign key (persona_collection, persona_id) references public.fortius_inmuebles_records (collection, id) on delete restrict,
  foreign key (inmueble_collection, inmueble_id) references public.fortius_inmuebles_records (collection, id) on delete restrict
);
create index on public.fortius_inmuebles_pendientes (responsable_id, estado, fecha);
create index on public.fortius_inmuebles_pendientes (asunto_id) where asunto_id is not null;
alter table public.fortius_inmuebles_pendientes enable row level security;
revoke all on public.fortius_inmuebles_pendientes from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_pendientes to authenticated;
grant all on public.fortius_inmuebles_pendientes to service_role;
create policy pendientes_read on public.fortius_inmuebles_pendientes for select to authenticated using (
  public.fortius_inmuebles_is_admin() or (public.fortius_inmuebles_is_staff() and (
    responsable_id = public.fortius_inmuebles_current_asesor_id()
    or (asunto_id is not null and public.fortius_inmuebles_puede_ver_asunto(asunto_id)))));
-- FALTA: políticas de insert y update (repiten la condición de lectura), disparador «solo el director reasigna responsable_id»
-- y versión optimista, como guard_expediente_update.
create view public.fortius_inmuebles_hoy with (security_invoker = true) as
  select * from public.fortius_inmuebles_pendientes where estado = 'pendiente' and fecha <= current_date;

-- ---------- BLOQUE 6 · historial con actor y notas internas sin edición ----------
create function public.fortius_inmuebles_solo_agregar() returns trigger language plpgsql set search_path = '' as $$
begin raise sqlstate 'PT403' using message = 'Este registro no se cambia ni se borra'; end; $$;

create table public.fortius_inmuebles_historial (
  id bigint generated always as identity primary key,
  entidad text not null check (entidad in ('asunto', 'persona', 'inmueble', 'pendiente', 'movimiento', 'consulta', 'archivo', 'formato')),
  entidad_id text not null,
  asunto_id uuid references public.fortius_inmuebles_expedientes (id) on delete restrict,
  accion text not null check (accion ~ '^[a-z_]{2,40}$'),
  resumen text not null check (length(btrim(resumen)) between 1 and 500),
  detalle jsonb,
  actor_id uuid,                                    -- null solo si actor_tipo <> 'usuario'
  actor_tipo text not null default 'usuario' check (actor_tipo in ('usuario', 'sistema', 'publico')),
  check (actor_tipo <> 'usuario' or actor_id is not null),
  created_at timestamptz not null default clock_timestamp()
);
create index on public.fortius_inmuebles_historial (entidad, entidad_id, created_at desc);
alter table public.fortius_inmuebles_historial enable row level security;
revoke all on public.fortius_inmuebles_historial from anon, authenticated;
grant select on public.fortius_inmuebles_historial to authenticated;       -- insertan solo funciones definer
grant all on public.fortius_inmuebles_historial to service_role;
create trigger fortius_solo_agregar before update or delete on public.fortius_inmuebles_historial
  for each row execute function public.fortius_inmuebles_solo_agregar();
-- FALTA: política de lectura (director, o quien pase puede_ver_asunto(asunto_id)). No sustituye a record_history ni a
-- expediente_actividad, que siguen sirviendo al panel viejo.

create table public.fortius_inmuebles_notas_internas (
  id uuid primary key default gen_random_uuid(),
  asunto_id uuid references public.fortius_inmuebles_expedientes (id) on delete restrict,
  persona_id text,
  inmueble_id text,
  check (num_nonnulls(asunto_id, persona_id, inmueble_id) = 1),
  texto text not null check (length(btrim(texto)) between 1 and 5000),
  corrige_a uuid references public.fortius_inmuebles_notas_internas (id),
  autor uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default clock_timestamp()
  -- FALTA: llaves foráneas compuestas de persona_id e inmueble_id, como en pendientes.
);
alter table public.fortius_inmuebles_notas_internas enable row level security;
revoke all on public.fortius_inmuebles_notas_internas from anon, authenticated;
grant select, insert on public.fortius_inmuebles_notas_internas to authenticated;
grant all on public.fortius_inmuebles_notas_internas to service_role;
create policy notas_insert on public.fortius_inmuebles_notas_internas for insert to authenticated
  with check (autor = auth.uid() and (public.fortius_inmuebles_is_admin()
    or (asunto_id is not null and public.fortius_inmuebles_puede_ver_asunto(asunto_id))
    or (persona_id is not null and public.fortius_inmuebles_can_access_client_id(persona_id))));
-- FALTA: política de lectura (miembros del asunto y director).
create trigger fortius_solo_agregar before update or delete on public.fortius_inmuebles_notas_internas
  for each row execute function public.fortius_inmuebles_solo_agregar();

-- ---------- BLOQUE 7 · personas unidas (aditivo) ----------
create table public.fortius_inmuebles_persona_uniones (
  persona_id text primary key,
  unida_en text not null check (unida_en <> persona_id),
  col text not null default 'clientes' check (col = 'clientes'),
  motivo text not null default '',
  unida_por uuid not null default auth.uid() references auth.users (id),
  unida_el timestamptz not null default clock_timestamp(),
  foreign key (col, persona_id) references public.fortius_inmuebles_records (collection, id) on delete restrict,
  foreign key (col, unida_en) references public.fortius_inmuebles_records (collection, id) on delete restrict
);
alter table public.fortius_inmuebles_persona_uniones enable row level security;
revoke all on public.fortius_inmuebles_persona_uniones from anon, authenticated;
grant all on public.fortius_inmuebles_persona_uniones to service_role;
-- FALTA: disparador que rechaza cadenas (la ficha destino no puede estar unida; la origen no puede ser destino de otra),
-- RPC fortius_inmuebles_unir_personas(p_origen, p_destino, p_motivo) que reapunta en una transacción asunto_personas, pendientes,
-- notas_internas y expedientes.cliente_id y anota el historial. Ningún folio cambia y la ficha origen no se borra.

-- ---------- BLOQUE 8 · trámites a asuntos (se aplica en PN-07; sin escribir todavía) ----------
-- Ver AUD-02, §3: un asunto y un folio por trámite, tabla de enlace asunto_tramites (asunto_id unique, tramite_id unique),
-- «derivado_de» la venta que frena, disparador para los trámites nuevos del panel viejo, y la verificación de conteos y suma de control.
