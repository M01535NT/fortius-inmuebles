-- Panel · el Directorio absorbe a Personas (SPEC.md, sección 6). Una sola pantalla de gente, sobre esta tabla; los
-- registros viejos «clientes» siguen sirviendo solo al panel provisional y no se copian.
--  · Archivar no es eliminar: la persona sale de la lista diaria y se recupera con un clic. Eliminados sigue aparte.
--  · Lo que sigue con esa persona (texto), junto a la fecha de «volver a llamar» que ya existía.
--  · Qué busca y qué ofrece (presupuesto y zona), el canal preferido (ya existía: `canal`) y el aviso de privacidad.
--  · Historial de contacto: cada llamada o mensaje con su resultado («¿cómo te fue?»), quién y cuándo. Solo se agrega.
--  · El tipo de cliente no lleva columna: es el papel de la persona en cada asunto.
-- Visibilidad igual que la persona: director todo; asesor las que lleva y las de los asuntos que ve.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(781023);

-- ── Columnas nuevas de la persona ─────────────────────────────────────────────────────────────────────
alter table public.fortius_inmuebles_personas
  add column if not exists archivada_el timestamptz,
  add column if not exists archivada_por uuid references auth.users (id),
  add column if not exists lo_que_sigue text not null default '' check (length(lo_que_sigue) <= 300),
  add column if not exists que_busca text not null default '' check (length(que_busca) <= 500),
  add column if not exists que_ofrece text not null default '' check (length(que_ofrece) <= 500),
  add column if not exists presupuesto numeric(14, 2) check (presupuesto is null or presupuesto between 0 and 1e12),
  add column if not exists presupuesto_moneda text not null default 'MXN' check (presupuesto_moneda in ('MXN', 'USD')),
  add column if not exists zona text not null default '' check (length(zona) <= 160),
  add column if not exists aviso_privacidad text not null default 'pendiente'
    check (aviso_privacidad in ('pendiente', 'enviado', 'aceptado', 'no_acepto')),
  add column if not exists aviso_privacidad_el date;

create index if not exists fortius_inmuebles_personas_archivadas on public.fortius_inmuebles_personas (archivada_el)
  where archivada_el is not null and deleted_at is null;

-- Quién archivó y cuándo cambió el aviso los pone la base, no la pantalla.
create or replace function public.fortius_inmuebles_sellos_persona() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.archivada_por := case when new.archivada_el is null then null else auth.uid() end;
    new.aviso_privacidad_el := case when new.aviso_privacidad = 'pendiente' then null else public.fortius_inmuebles_hoy() end;
    return new;
  end if;
  if new.archivada_el is distinct from old.archivada_el then
    new.archivada_por := case when new.archivada_el is null then null else auth.uid() end;
  else
    new.archivada_por := old.archivada_por;
  end if;
  if new.aviso_privacidad is distinct from old.aviso_privacidad then
    new.aviso_privacidad_el := case when new.aviso_privacidad = 'pendiente' then null else public.fortius_inmuebles_hoy() end;
  else
    new.aviso_privacidad_el := old.aviso_privacidad_el;
  end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_sellos_persona() from public, anon, authenticated;
drop trigger if exists fortius_03_sellos on public.fortius_inmuebles_personas;
create trigger fortius_03_sellos before insert or update on public.fortius_inmuebles_personas
  for each row execute function public.fortius_inmuebles_sellos_persona();

-- El historial anota con valor lo que no es dato personal; ahora también archivar y el aviso de privacidad.
drop trigger if exists fortius_zz_historial on public.fortius_inmuebles_personas;
create trigger fortius_zz_historial after insert or update on public.fortius_inmuebles_personas
  for each row execute function public.fortius_inmuebles_registrar_cambio(
    'persona', 'clase,fallecida,no_contactar,responsable_id,volver_a_llamar,archivada_el,aviso_privacidad');

-- ── Historial de contacto ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.fortius_inmuebles_persona_contactos (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.fortius_inmuebles_personas (id) on delete restrict,
  cuando timestamptz not null default now(),
  medio text not null check (medio in ('llamada', 'whatsapp', 'correo', 'en_persona', 'otro')),
  resultado text not null check (resultado in ('contesto', 'no_contesto', 'pidio_llamar_despues', 'le_interesa',
                                               'no_le_interesa', 'cita', 'otro')),
  nota text not null default '' check (length(nota) <= 1000),
  quien_id uuid not null default auth.uid() references auth.users (id),
  es_ejemplo boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists fortius_inmuebles_persona_contactos_persona
  on public.fortius_inmuebles_persona_contactos (persona_id, cuando desc);

-- Solo se agrega: un error se corrige con otro renglón, igual que el historial.
drop trigger if exists fortius_solo_agregar on public.fortius_inmuebles_persona_contactos;
create trigger fortius_solo_agregar before update or delete on public.fortius_inmuebles_persona_contactos
  for each row execute function public.fortius_inmuebles_solo_agregar();

alter table public.fortius_inmuebles_persona_contactos enable row level security;
revoke all on public.fortius_inmuebles_persona_contactos from anon, authenticated;
grant select on public.fortius_inmuebles_persona_contactos to authenticated;   -- se escribe solo con la función de abajo
grant all on public.fortius_inmuebles_persona_contactos to service_role;
-- Al unir dos fichas los contactos no se mueven (solo se agregan): la ficha que se queda los muestra por el registro de
-- uniones, así que quien ve la que se queda ve también los de la que se fue.
drop policy if exists persona_contactos_read on public.fortius_inmuebles_persona_contactos;
create policy persona_contactos_read on public.fortius_inmuebles_persona_contactos for select to authenticated
  using (public.fortius_inmuebles_puede_ver_persona(persona_id)
         or exists (select 1 from public.fortius_inmuebles_persona_uniones u
                     where u.origen_id = persona_id and public.fortius_inmuebles_puede_ver_persona(u.destino_id)));

-- Anotar un contacto y, en el mismo paso, cambiar «volver a llamar» y «lo que sigue» de la persona. Con la versión que
-- vio quien anota: si alguien la cambió antes, 409 y no queda nada a medias.
create or replace function public.fortius_inmuebles_anotar_contacto(
  p_persona uuid, p_version bigint, p_medio text, p_resultado text, p_nota text default '',
  p_cuando timestamptz default null, p_cambia_volver boolean default false, p_volver date default null,
  p_sigue text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare p public.fortius_inmuebles_personas; c public.fortius_inmuebles_persona_contactos; v bigint;
begin
  if not public.fortius_inmuebles_is_staff() then
    raise sqlstate 'PT403' using message = 'Sin acceso';
  end if;
  select * into p from public.fortius_inmuebles_personas where id = p_persona and deleted_at is null for update;
  if not found or not public.fortius_inmuebles_puede_ver_persona(p_persona) then
    raise sqlstate 'PT404' using message = 'Esa persona no existe o no te toca verla';
  end if;
  if p.version <> p_version then
    raise sqlstate 'PT409' using message = 'Alguien más cambió esta ficha. Vuelve a cargar y repite el cambio.';
  end if;
  if p_cuando is not null and (p_cuando > now() + interval '5 minutes' or p_cuando < now() - interval '1 year') then
    raise sqlstate '22023' using message = 'La fecha del contacto no es válida';
  end if;
  if p_sigue is not null and length(p_sigue) > 300 then
    raise sqlstate '22023' using message = 'Lo que sigue es muy largo';
  end if;

  insert into public.fortius_inmuebles_persona_contactos (persona_id, cuando, medio, resultado, nota, quien_id, es_ejemplo)
  values (p_persona, coalesce(p_cuando, now()), p_medio, p_resultado, left(btrim(coalesce(p_nota, '')), 1000), auth.uid(), p.es_ejemplo)
  returning * into c;

  if p_cambia_volver or p_sigue is not null then
    update public.fortius_inmuebles_personas
       set volver_a_llamar = case when p_cambia_volver then p_volver else volver_a_llamar end,
           lo_que_sigue = coalesce(btrim(p_sigue), lo_que_sigue)
     where id = p_persona
    returning version into v;
  else
    -- Anotar un contacto también cuenta como cambio de la ficha: quien la tenía abierta vuelve a cargar.
    update public.fortius_inmuebles_personas set updated_at = now() where id = p_persona returning version into v;
  end if;

  return jsonb_build_object('contacto', to_jsonb(c), 'version', v);
end; $$;
revoke all on function public.fortius_inmuebles_anotar_contacto(uuid, bigint, text, text, text, timestamptz, boolean, date, text) from public, anon;
grant execute on function public.fortius_inmuebles_anotar_contacto(uuid, bigint, text, text, text, timestamptz, boolean, date, text) to authenticated, service_role;

-- ── Consulta del sitio → persona del Directorio ───────────────────────────────────────────────────────
-- «Crear persona» desde una consulta del sitio (registro viejo «leads») en el panel nuevo: liga la consulta a una ficha
-- que quien está en sesión ve (por teléfono o correo, primero las suyas) o crea una nueva a su cargo. No toca «clientes»
-- ni la conversión del panel provisional (fortius_inmuebles_convert_lead). Repetirlo devuelve la misma persona.
create or replace function public.fortius_inmuebles_lead_a_persona(p_lead_id text, p_version bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  fuente public.fortius_inmuebles_records; d jsonb; persona uuid; creada boolean := false;
  digitos text; pais text; numero text; v_correo text; resultado jsonb;
begin
  if auth.uid() is null then raise sqlstate 'PT401' using message = 'Sesión requerida'; end if;
  if not public.fortius_inmuebles_is_staff() then raise sqlstate 'PT403' using message = 'Sin acceso'; end if;
  if p_lead_id is null or p_lead_id !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$'
     or p_version is null or p_version not between 1 and 9007199254740991 then
    raise sqlstate '22023' using message = 'Solicitud no válida';
  end if;
  -- El mismo candado que toda escritura de registros: no se cruza con otra edición de la consulta.
  perform pg_advisory_xact_lock(781023);
  select * into fuente from public.fortius_inmuebles_records where collection = 'leads' and id = p_lead_id for update;
  if fuente.id is null then raise sqlstate 'PT404' using message = 'Esa consulta no existe'; end if;
  if not public.fortius_inmuebles_record_visible('leads', fuente.data) then
    raise sqlstate 'PT403' using message = 'Esa consulta la lleva otro asesor';
  end if;
  d := fuente.data;

  -- Ya ligada: se devuelve la misma persona si quien pregunta la ve (un reintento no crea otra). Si la ficha sigue viva
  -- pero la lleva alguien que quien pregunta no ve, el enlace se conserva y se avisa, sin decir de qué ficha se trata.
  -- Solo si la ficha ya no existe o está en Eliminados se vuelve a ligar.
  if nullif(d->>'personaId', '') is not null
     and (d->>'personaId') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    persona := (d->>'personaId')::uuid;
    if exists (select 1 from public.fortius_inmuebles_personas p where p.id = persona and p.deleted_at is null) then
      if public.fortius_inmuebles_puede_ver_persona(persona) then
        return jsonb_build_object('persona_id', persona, 'creada', false, 'lead_version', fuente.version);
      end if;
      raise sqlstate 'PT409' using message = 'Esta consulta ya está ligada a una ficha que lleva otro asesor', hint = 'ligada';
    end if;
    persona := null;
  end if;
  if fuente.version <> p_version then
    raise sqlstate 'PT409' using message = 'Alguien más cambió esta consulta. Vuelve a cargar y repite el cambio.';
  end if;

  digitos := regexp_replace(coalesce(d->>'telefono', ''), '\D', '', 'g');
  v_correo := nullif(lower(btrim(coalesce(d->>'email', ''))), '');
  if v_correo !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_correo) > 200 then v_correo := null; end if;
  -- Como en el resto del panel, un teléfono es el mismo si coinciden sus últimos 10 dígitos («+52 1 664…» y «664…»).
  -- La clave de país es lo que sobra; el «1» viejo de los celulares de México no cuenta.
  if length(digitos) between 6 and 15 then
    if length(digitos) > 10 then pais := left(digitos, length(digitos) - 10); numero := right(digitos, 10);
      pais := '+' || case when pais = '521' then '52' else pais end;
    else pais := '+52'; numero := digitos; end if;
    if pais !~ '^\+[0-9]{1,4}$' or numero !~ '^[0-9]{4,15}$' then pais := null; numero := null; end if;
  end if;

  if numero is not null then
    select p.id into persona from public.fortius_inmuebles_personas p
     where p.deleted_at is null
       and exists (select 1 from unnest(p.telefonos_normales) n where right(n, 10) = right(numero, 10))
       and public.fortius_inmuebles_puede_ver_persona(p.id)
     order by (p.responsable_id = auth.uid()) desc, p.created_at limit 1;
  end if;
  if persona is null and v_correo is not null then
    select p.id into persona from public.fortius_inmuebles_personas p
     where p.deleted_at is null and p.correo = v_correo and public.fortius_inmuebles_puede_ver_persona(p.id)
     order by (p.responsable_id = auth.uid()) desc, p.created_at limit 1;
  end if;
  if persona is null then
    insert into public.fortius_inmuebles_personas (nombre, telefonos, correo, canal, nota, responsable_id, creado_por)
    values (coalesce(nullif(left(btrim(coalesce(d->>'nombre', '')), 160), ''), 'Sin nombre'),
            case when numero is null then '[]'::jsonb else jsonb_build_array(jsonb_build_object('pais', pais, 'numero', numero)) end,
            v_correo, 'Sitio', left(btrim(coalesce(d->>'mensaje', '')), 2000), auth.uid(), auth.uid())
    returning id into persona;
    creada := true;
  else
    -- Si estaba archivada y vuelve a escribir, vuelve a la lista.
    update public.fortius_inmuebles_personas set archivada_el = null where id = persona and archivada_el is not null;
  end if;

  resultado := public.fortius_inmuebles_put_record('leads', fuente.id,
    d || jsonb_build_object('personaId', persona::text,
                            'personaEl', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
    p_version);
  return jsonb_build_object('persona_id', persona, 'creada', creada, 'lead_version', (resultado->>'version')::bigint);
end; $$;
revoke all on function public.fortius_inmuebles_lead_a_persona(text, bigint) from public, anon;
grant execute on function public.fortius_inmuebles_lead_a_persona(text, bigint) to authenticated, service_role;

notify pgrst, 'reload schema';
commit;
