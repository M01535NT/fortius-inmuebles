-- Panel por asuntos · bloque 3: personas, sus datos para contratos, su papel en cada asunto y el registro de uniones
-- (docs/operacion/modelo-de-datos-panel.md, sección 4.3; SPEC.md, sección 6). Autorizado por el titular el 16/11/2026.
-- Aditivo: no toca la colección «clientes» de records, que sigue sirviendo al panel provisional.
--  · Una persona puede ser una persona, una empresa o una institución, y puede estar fallecida.
--  · Teléfonos con clave de país. Los duplicados se buscan por teléfono y correo: la pantalla avisa, la base no lo impide.
--  · CURP, RFC y demás datos para contratos viven aparte, para que ninguna lista los traiga por accidente.
--  · Visibilidad: director todo; asesor las personas que lleva y las de los asuntos que ve.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(781023);

-- ── Personas ──────────────────────────────────────────────────────────────────────────────────────────
create table public.fortius_inmuebles_personas (
  id uuid primary key default gen_random_uuid(),
  clase text not null default 'persona' check (clase in ('persona', 'empresa', 'institucion')),
  nombre text not null check (length(btrim(nombre)) between 1 and 160),
  representante_id uuid references public.fortius_inmuebles_personas (id) on delete restrict,
  check (representante_id is distinct from id),
  fallecida boolean not null default false,
  -- [{pais: '+1', numero: '6195550142', etiqueta?: 'celular'}]
  telefonos jsonb not null default '[]' check (jsonb_typeof(telefonos) = 'array' and jsonb_array_length(telefonos) <= 10),
  telefonos_normales text[] not null default '{}',   -- solo dígitos con su clave; lo llena la base
  correo text check (correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(correo) <= 200),
  no_contactar boolean not null default false,
  canal text check (length(canal) <= 60),
  volver_a_llamar date,                               -- contacto sin asunto: ese día aparece en Inicio
  nota text not null default '' check (length(nota) <= 2000),
  responsable_id uuid not null default auth.uid() references public.fortius_inmuebles_staff (user_id) on delete restrict,
  es_ejemplo boolean not null default false,
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id)
);
create index on public.fortius_inmuebles_personas using gin (telefonos_normales);
create index on public.fortius_inmuebles_personas (lower(correo)) where correo is not null;
create index on public.fortius_inmuebles_personas (responsable_id) where deleted_at is null;
create index on public.fortius_inmuebles_personas (volver_a_llamar) where volver_a_llamar is not null and deleted_at is null;

-- Teléfonos: cada uno con su clave (+52 por omisión) y su número; se guardan también en dígitos para buscar duplicados.
create function public.fortius_inmuebles_normalizar_persona() returns trigger
language plpgsql set search_path = '' as $$
declare t jsonb; pais text; numero text; lista jsonb := '[]'; normales text[] := '{}';
begin
  for t in select * from jsonb_array_elements(new.telefonos) loop
    if jsonb_typeof(t) <> 'object' then
      raise sqlstate '22023' using message = 'Teléfono no válido';
    end if;
    pais := '+' || regexp_replace(coalesce(nullif(t->>'pais', ''), '+52'), '\D', '', 'g');
    numero := regexp_replace(coalesce(t->>'numero', ''), '\D', '', 'g');
    if pais !~ '^\+[0-9]{1,4}$' or numero !~ '^[0-9]{4,15}$' then
      raise sqlstate '22023' using message = 'Teléfono no válido: revisa la clave y el número';
    end if;
    lista := lista || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'pais', pais, 'numero', numero, 'etiqueta', nullif(left(btrim(coalesce(t->>'etiqueta', '')), 40), ''))));
    normales := normales || (substring(pais from 2) || numero);
  end loop;
  new.telefonos := lista;
  new.telefonos_normales := normales;
  new.correo := nullif(lower(btrim(new.correo)), '');
  new.nombre := btrim(new.nombre);
  return new;
end; $$;
create trigger fortius_00_normalizar before insert or update of telefonos, correo, nombre on public.fortius_inmuebles_personas
  for each row execute function public.fortius_inmuebles_normalizar_persona();
create trigger fortius_01_version before update on public.fortius_inmuebles_personas
  for each row execute function public.fortius_inmuebles_panel_version();

-- ── Papel de cada persona en cada asunto ──────────────────────────────────────────────────────────────
-- Papeles: los de SPEC.md, sección 5 (con apoderado y banco, titular 16/11/2026).
-- inmueble_id: de qué inmueble es el papel (el inquilino del local 5). Su llave foránea llega con los inmuebles.
create table public.fortius_inmuebles_asunto_personas (
  id uuid primary key default gen_random_uuid(),
  asunto_id uuid not null references public.fortius_inmuebles_asuntos (id) on delete restrict,
  persona_id uuid not null references public.fortius_inmuebles_personas (id) on delete restrict,
  papel text not null check (papel in ('contacto', 'propietario', 'titular', 'heredero', 'copropietario', 'comprador',
                                       'vendedor', 'inquilino', 'inversionista', 'contraparte', 'apoderado', 'abogado',
                                       'notaria', 'banco')),
  inmueble_id uuid,
  principal boolean not null default false,
  nota text not null default '' check (length(nota) <= 500),
  orden numeric not null default 0,
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0),
  retirado_el timestamptz,                    -- quitar a alguien del asunto: no se borra
  unique nulls not distinct (asunto_id, persona_id, papel, inmueble_id)
);
create index on public.fortius_inmuebles_asunto_personas (persona_id) where retirado_el is null;
create index on public.fortius_inmuebles_asunto_personas (asunto_id, orden) where retirado_el is null;
create trigger fortius_01_version before update on public.fortius_inmuebles_asunto_personas
  for each row execute function public.fortius_inmuebles_panel_version();

-- ¿Puede quien está en sesión ver a esta persona? Director: todas. Asesor: las que lleva y las de los asuntos que ve.
create function public.fortius_inmuebles_puede_ver_persona(p_persona uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_persona is not null and (
    public.fortius_inmuebles_is_admin()
    or (public.fortius_inmuebles_is_staff() and (
      exists (select 1 from public.fortius_inmuebles_personas p
               where p.id = p_persona and p.deleted_at is null and p.responsable_id = auth.uid())
      or exists (select 1 from public.fortius_inmuebles_asunto_personas ap
                  where ap.persona_id = p_persona and ap.retirado_el is null
                    and public.fortius_inmuebles_puede_ver_asunto(ap.asunto_id)))));
$$;
revoke all on function public.fortius_inmuebles_puede_ver_persona(uuid) from public, anon;
grant execute on function public.fortius_inmuebles_puede_ver_persona(uuid) to authenticated, service_role;

-- Permisos de la persona (protecciones, no frenos de proceso), igual que en el asunto.
create function public.fortius_inmuebles_guard_persona() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    null;   -- servidor con la llave privilegiada; ya comprobó el acceso
  elsif tg_op = 'INSERT' then
    if not public.fortius_inmuebles_is_admin() and new.responsable_id is distinct from auth.uid() then
      raise sqlstate 'PT403' using message = 'Solo el director da de alta una persona a nombre de otro asesor';
    end if;
    if new.deleted_at is not null then
      raise sqlstate 'PT403' using message = 'Una persona nueva no nace borrada';
    end if;
  else
    if new.responsable_id is distinct from old.responsable_id and not public.fortius_inmuebles_is_admin() then
      raise sqlstate 'PT403' using message = 'Solo el director cambia quién lleva a esta persona';
    end if;
    if new.deleted_at is distinct from old.deleted_at
       and not public.fortius_inmuebles_is_admin()
       and not (old.deleted_at is null and old.responsable_id = auth.uid()) then
      raise sqlstate 'PT403' using message = 'Solo el director o quien la lleva la manda a Eliminados; solo el director la restaura';
    end if;
  end if;
  if tg_op = 'UPDATE' and new.deleted_at is distinct from old.deleted_at then
    new.deleted_by := case when new.deleted_at is null then null else auth.uid() end;
  end if;
  if new.representante_id is not null and not public.fortius_inmuebles_puede_ver_persona(new.representante_id) and auth.uid() is not null then
    raise sqlstate 'PT403' using message = 'Sin acceso a ese representante';
  end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_persona() from public, anon, authenticated, service_role;
create trigger fortius_02_guard before insert or update on public.fortius_inmuebles_personas
  for each row execute function public.fortius_inmuebles_guard_persona();

-- El papel no cambia de asunto ni de persona: se retira y se agrega otro.
create function public.fortius_inmuebles_guard_asunto_persona() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.asunto_id <> old.asunto_id or new.persona_id <> old.persona_id then
    raise sqlstate '22023' using message = 'Para cambiar la persona o el asunto, quita este renglón y agrega otro';
  end if;
  return new;
end; $$;
create trigger fortius_02_guard before update on public.fortius_inmuebles_asunto_personas
  for each row execute function public.fortius_inmuebles_guard_asunto_persona();

-- Historial: en la persona solo se anotan con valor los campos que no son datos personales.
create trigger fortius_zz_historial after insert or update on public.fortius_inmuebles_personas
  for each row execute function public.fortius_inmuebles_registrar_cambio('persona', 'clase,fallecida,no_contactar,responsable_id,volver_a_llamar');
create trigger fortius_zz_historial after insert or update on public.fortius_inmuebles_asunto_personas
  for each row execute function public.fortius_inmuebles_registrar_cambio('asunto_persona', 'persona_id,papel,inmueble_id,principal,retirado_el');

alter table public.fortius_inmuebles_personas enable row level security;
revoke all on public.fortius_inmuebles_personas from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_personas to authenticated;
grant all on public.fortius_inmuebles_personas to service_role;
create policy personas_read on public.fortius_inmuebles_personas for select to authenticated
  using (public.fortius_inmuebles_puede_ver_persona(id));
create policy personas_insert on public.fortius_inmuebles_personas for insert to authenticated
  with check ((select public.fortius_inmuebles_is_staff()) and creado_por = (select auth.uid()));
-- Igual que en el asunto: la guarda cuida quién borra, restaura y reasigna. El servidor borra sin «returning».
create policy personas_update on public.fortius_inmuebles_personas for update to authenticated
  using (public.fortius_inmuebles_puede_ver_persona(id)) with check ((select public.fortius_inmuebles_is_staff()));

alter table public.fortius_inmuebles_asunto_personas enable row level security;
revoke all on public.fortius_inmuebles_asunto_personas from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_asunto_personas to authenticated;
grant all on public.fortius_inmuebles_asunto_personas to service_role;
create policy asunto_personas_read on public.fortius_inmuebles_asunto_personas for select to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(asunto_id));
-- Para sumar a alguien al asunto hay que ver el asunto y también a esa persona:
-- así nadie se da acceso a una ficha ajena colgándola de su asunto.
create policy asunto_personas_insert on public.fortius_inmuebles_asunto_personas for insert to authenticated
  with check (creado_por = (select auth.uid()) and public.fortius_inmuebles_puede_ver_asunto(asunto_id)
              and public.fortius_inmuebles_puede_ver_persona(persona_id));
create policy asunto_personas_update on public.fortius_inmuebles_asunto_personas for update to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(asunto_id)) with check (public.fortius_inmuebles_puede_ver_asunto(asunto_id));

-- ── Datos para contratos ──────────────────────────────────────────────────────────────────────────────
-- De aquí los toman los formatos. CURP y RFC se muestran ocultos en pantalla y no salen del panel.
create table public.fortius_inmuebles_persona_datos_legales (
  persona_id uuid primary key references public.fortius_inmuebles_personas (id) on delete restrict,
  nombre_completo text check (length(btrim(nombre_completo)) between 1 and 200),
  estado_civil text check (length(btrim(estado_civil)) between 1 and 80),   -- texto: las opciones las da la plantilla del titular
  curp text check (curp ~ '^[A-Z][AEIOUX][A-Z]{2}[0-9]{6}[HMX][A-Z]{5}[A-Z0-9][0-9]$'),
  rfc text check (rfc ~ '^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$'),
  identificacion_tipo text check (length(identificacion_tipo) <= 60),
  identificacion_numero text check (length(identificacion_numero) <= 60),
  domicilio jsonb check (domicilio is null or (jsonb_typeof(domicilio) = 'object' and length(domicilio::text) <= 2000)),
  nacionalidad text check (length(nacionalidad) <= 60),
  ocupacion text check (length(ocupacion) <= 120),
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.fortius_inmuebles_normalizar_datos_legales() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.curp := nullif(upper(btrim(new.curp)), '');
  new.rfc := nullif(upper(btrim(new.rfc)), '');
  new.nombre_completo := nullif(btrim(new.nombre_completo), '');
  return new;
end; $$;
create trigger fortius_00_normalizar before insert or update on public.fortius_inmuebles_persona_datos_legales
  for each row execute function public.fortius_inmuebles_normalizar_datos_legales();
create trigger fortius_01_version before update on public.fortius_inmuebles_persona_datos_legales
  for each row execute function public.fortius_inmuebles_panel_version();
-- Sin valores en el historial: solo qué campo cambió.
create trigger fortius_zz_historial after insert or update on public.fortius_inmuebles_persona_datos_legales
  for each row execute function public.fortius_inmuebles_registrar_cambio('persona_datos_legales');

alter table public.fortius_inmuebles_persona_datos_legales enable row level security;
revoke all on public.fortius_inmuebles_persona_datos_legales from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_persona_datos_legales to authenticated;
grant all on public.fortius_inmuebles_persona_datos_legales to service_role;
create policy persona_datos_legales_read on public.fortius_inmuebles_persona_datos_legales for select to authenticated
  using (public.fortius_inmuebles_puede_ver_persona(persona_id));
create policy persona_datos_legales_insert on public.fortius_inmuebles_persona_datos_legales for insert to authenticated
  with check (creado_por = (select auth.uid()) and public.fortius_inmuebles_puede_ver_persona(persona_id));
create policy persona_datos_legales_update on public.fortius_inmuebles_persona_datos_legales for update to authenticated
  using (public.fortius_inmuebles_puede_ver_persona(persona_id)) with check (public.fortius_inmuebles_puede_ver_persona(persona_id));

-- ── Personas unidas ───────────────────────────────────────────────────────────────────────────────────
-- Registro de fichas duplicadas que se unieron. La ficha que se va se archiva, no se borra.
-- La acción «Unir» (pasar asuntos, tareas, interesados y consultas en una transacción, solo el director) llega con el Directorio.
create table public.fortius_inmuebles_persona_uniones (
  origen_id uuid primary key references public.fortius_inmuebles_personas (id) on delete restrict,
  destino_id uuid not null references public.fortius_inmuebles_personas (id) on delete restrict,
  check (origen_id <> destino_id),
  detalle jsonb check (detalle is null or jsonb_typeof(detalle) = 'object'),
  unido_por uuid not null default auth.uid() references auth.users (id),
  unido_el timestamptz not null default now()
);
create index on public.fortius_inmuebles_persona_uniones (destino_id);

-- Sin cadenas: la ficha que se queda no puede estar unida a otra, y la que se va no puede ser destino de nadie.
create function public.fortius_inmuebles_union_sin_cadenas() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from public.fortius_inmuebles_persona_uniones where origen_id = new.destino_id)
     or exists (select 1 from public.fortius_inmuebles_persona_uniones where destino_id = new.origen_id) then
    raise sqlstate '22023' using message = 'Esa ficha ya se unió con otra';
  end if;
  return new;
end; $$;
create trigger fortius_00_sin_cadenas before insert on public.fortius_inmuebles_persona_uniones
  for each row execute function public.fortius_inmuebles_union_sin_cadenas();
create trigger fortius_solo_agregar before update or delete on public.fortius_inmuebles_persona_uniones
  for each row execute function public.fortius_inmuebles_solo_agregar();

alter table public.fortius_inmuebles_persona_uniones enable row level security;
revoke all on public.fortius_inmuebles_persona_uniones from anon, authenticated;
grant select on public.fortius_inmuebles_persona_uniones to authenticated;   -- se escribe solo con la acción «Unir»
grant all on public.fortius_inmuebles_persona_uniones to service_role;
create policy persona_uniones_read on public.fortius_inmuebles_persona_uniones for select to authenticated
  using (public.fortius_inmuebles_puede_ver_persona(destino_id));

notify pgrst, 'reload schema';
commit;
