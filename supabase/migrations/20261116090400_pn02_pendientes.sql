-- PN-02 · Bloque 5: pendientes. Una sola tabla para tareas, llamadas, citas, visitas, firmas, esperas, cobros y vencimientos;
-- Hoy, Agenda, Trámites y Dinero son vistas de ella. Cada pendiente tiene responsable y quien lo creó (RP-101).
-- Las tareas y eventos del panel viejo no se copian todavía: el panel nuevo los lee aparte mientras convivan
-- y se copian una sola vez al retirar el viejo (decisión 4 de AUD-02). Sin doble escritura.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(781023);

create table public.fortius_inmuebles_pendientes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'tarea' check (tipo in ('tarea', 'llamada', 'cita', 'visita', 'firma', 'seguimiento', 'espera', 'cobro', 'entrega', 'vencimiento')),
  titulo text not null check (length(btrim(titulo)) between 1 and 160),
  detalle text not null default '' check (length(detalle) <= 2000),
  fecha date,
  hora time,
  duracion_min integer check (duracion_min between 5 and 1440),
  check (hora is null or fecha is not null),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'hecho', 'cancelado')),
  resultado text check (resultado is null or length(resultado) <= 2000),
  responsable_id text not null default public.fortius_inmuebles_mi_asesor_id(),  -- anotar rápido: por omisión, quien anota
  responsable_collection text not null default 'asesores' check (responsable_collection = 'asesores'),
  creado_por uuid default auth.uid() references auth.users (id),
  asunto_id uuid references public.fortius_inmuebles_expedientes (id) on delete restrict,
  persona_id text,
  persona_collection text not null default 'clientes' check (persona_collection = 'clientes'),
  inmueble_id text,
  inmueble_collection text not null default 'propiedades' check (inmueble_collection = 'propiedades'),
  consulta_id text,       -- id de la consulta (colección leads); llave foránea en PN-05
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
create index on public.fortius_inmuebles_pendientes (fecha) where estado = 'pendiente';
create index on public.fortius_inmuebles_pendientes (asunto_id) where asunto_id is not null;
create index on public.fortius_inmuebles_pendientes (persona_id) where persona_id is not null;

-- ¿Puede la persona en sesión ver este pendiente? Director: todo. Asesor: lo suyo y lo de sus asuntos.
create function public.fortius_inmuebles_puede_ver_pendiente(p_responsable text, p_asunto uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.fortius_inmuebles_is_admin() or (public.fortius_inmuebles_is_staff() and (
    p_responsable = public.fortius_inmuebles_mi_asesor_id()
    or (p_asunto is not null and public.fortius_inmuebles_puede_ver_asunto(p_asunto))));
$$;
revoke all on function public.fortius_inmuebles_puede_ver_pendiente(text, uuid) from public, anon;
grant execute on function public.fortius_inmuebles_puede_ver_pendiente(text, uuid) to authenticated, service_role;

-- ¿Puede guardar un pendiente así? Además de verlo (AUD-04, I3 e I4):
-- · el asunto, si lo trae, tiene que ser uno que ve (no se cuelga nada del asunto de otro);
-- · la persona, si la trae, tiene que poder verla, o ser parte de ese asunto (principal o con papel).
create function public.fortius_inmuebles_puede_guardar_pendiente(p_responsable text, p_asunto uuid, p_persona text) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.fortius_inmuebles_is_admin() or (
    public.fortius_inmuebles_puede_ver_pendiente(p_responsable, p_asunto)
    and (p_asunto is null or public.fortius_inmuebles_puede_ver_asunto(p_asunto))
    and (p_persona is null
         or public.fortius_inmuebles_can_access_client_id(p_persona)
         or (p_asunto is not null and (
              exists (select 1 from public.fortius_inmuebles_expedientes e where e.id = p_asunto and e.cliente_id = p_persona)
              or exists (select 1 from public.fortius_inmuebles_asunto_personas ap
                          where ap.asunto_id = p_asunto and ap.persona_id = p_persona and ap.retirado_el is null)))));
$$;
revoke all on function public.fortius_inmuebles_puede_guardar_pendiente(text, uuid, text) from public, anon;
grant execute on function public.fortius_inmuebles_puede_guardar_pendiente(text, uuid, text) to authenticated, service_role;

alter table public.fortius_inmuebles_pendientes enable row level security;
revoke all on public.fortius_inmuebles_pendientes from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_pendientes to authenticated;   -- no se borra: se cancela
grant all on public.fortius_inmuebles_pendientes to service_role;
create policy pendientes_read on public.fortius_inmuebles_pendientes for select to authenticated
  using (public.fortius_inmuebles_puede_ver_pendiente(responsable_id, asunto_id));
-- El asesor solo se asigna pendientes a sí mismo (o dentro de un asunto que ve); el director, a cualquiera.
create policy pendientes_insert on public.fortius_inmuebles_pendientes for insert to authenticated
  with check (creado_por = (select auth.uid()) and origen <> 'legado'
              and public.fortius_inmuebles_puede_guardar_pendiente(responsable_id, asunto_id, persona_id));
create policy pendientes_update on public.fortius_inmuebles_pendientes for update to authenticated
  using (public.fortius_inmuebles_puede_ver_pendiente(responsable_id, asunto_id))
  with check (public.fortius_inmuebles_puede_guardar_pendiente(responsable_id, asunto_id, persona_id));

-- Reglas que no dependen de quién mira: versión, fechas, quién lo hizo y quién puede reasignar.
create function public.fortius_inmuebles_guardar_pendiente() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.version := 1;
    new.created_at := now();
    new.updated_at := now();
    if new.estado = 'hecho' then new.hecho_el := now(); new.hecho_por := auth.uid(); else new.hecho_el := null; new.hecho_por := null; end if;
    return new;
  end if;
  -- Versión optimista: quien guarda manda la versión que leyó; si alguien guardó antes, 409.
  if new.version is distinct from old.version then
    raise sqlstate 'PT409' using message = 'Alguien más cambió este pendiente. Vuelve a abrirlo.';
  end if;
  if new.creado_por is distinct from old.creado_por or new.created_at is distinct from old.created_at
     or new.origen is distinct from old.origen or new.origen_ref is distinct from old.origen_ref then
    raise sqlstate 'PT403' using message = 'Esos datos del pendiente no se cambian';
  end if;
  if new.responsable_id is distinct from old.responsable_id and auth.uid() is not null and not public.fortius_inmuebles_is_admin() then
    raise sqlstate 'PT403' using message = 'Solo dirección reasigna un pendiente';
  end if;
  if new.estado = 'hecho' and old.estado <> 'hecho' then
    new.hecho_el := now(); new.hecho_por := auth.uid();
  elsif new.estado <> 'hecho' then
    new.hecho_el := null; new.hecho_por := null;
  else
    new.hecho_el := old.hecho_el; new.hecho_por := old.hecho_por;
  end if;
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_guardar_pendiente() from public, anon, authenticated, service_role;
create trigger fortius_00_guardar_pendiente before insert or update on public.fortius_inmuebles_pendientes
  for each row execute function public.fortius_inmuebles_guardar_pendiente();

commit;
