-- Panel por asuntos, bloque 4: el Plan (etapas y tareas) y «lo que sigue» de cada asunto.
-- Se adelanta al de inmuebles porque la lista de Asuntos (etapa 2 de PLAN.md) muestra la próxima tarea de cada uno.
-- Las ligas a inmueble, documento, consulta e interesado quedan como uuid sin llave foránea: la ganan en su bloque.
-- Aditiva; no toca tablas del panel provisional. Modelo: docs/operacion/modelo-de-datos-panel.md, sección 4.8.
begin;

-- ── Etapas del plan ───────────────────────────────────────────────────────────────────────────────────
-- Varias pueden estar abiertas a la vez: no hay «etapa actual».
create table public.fortius_inmuebles_plan_etapas (
  id uuid primary key default gen_random_uuid(),
  asunto_id uuid not null references public.fortius_inmuebles_asuntos (id) on delete restrict,
  nombre text not null check (length(btrim(nombre)) between 1 and 120),
  orden numeric not null default 0,
  biblioteca_id uuid,                         -- de dónde se copió; llave foránea cuando exista la Biblioteca
  biblioteca_version integer,
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on public.fortius_inmuebles_plan_etapas (asunto_id, orden) where deleted_at is null;
create trigger fortius_01_version before update on public.fortius_inmuebles_plan_etapas
  for each row execute function public.fortius_inmuebles_panel_version();
create trigger fortius_zz_historial after insert or update of nombre, deleted_at on public.fortius_inmuebles_plan_etapas
  for each row execute function public.fortius_inmuebles_registrar_cambio('etapa', 'nombre');

alter table public.fortius_inmuebles_plan_etapas enable row level security;
revoke all on public.fortius_inmuebles_plan_etapas from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_plan_etapas to authenticated;
grant all on public.fortius_inmuebles_plan_etapas to service_role;
create policy plan_etapas_read on public.fortius_inmuebles_plan_etapas for select to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(asunto_id));
create policy plan_etapas_insert on public.fortius_inmuebles_plan_etapas for insert to authenticated
  with check (creado_por = (select auth.uid()) and public.fortius_inmuebles_puede_ver_asunto(asunto_id));
create policy plan_etapas_update on public.fortius_inmuebles_plan_etapas for update to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(asunto_id)) with check (public.fortius_inmuebles_puede_ver_asunto(asunto_id));

-- ── Tareas ────────────────────────────────────────────────────────────────────────────────────────────
-- Del asunto, o sueltas (un contacto a quien volver a llamar, una consulta). Nada aquí frena: solo se anota.
create table public.fortius_inmuebles_tareas (
  id uuid primary key default gen_random_uuid(),
  asunto_id uuid references public.fortius_inmuebles_asuntos (id) on delete restrict,
  etapa_id uuid references public.fortius_inmuebles_plan_etapas (id) on delete restrict,
  persona_id uuid references public.fortius_inmuebles_personas (id) on delete restrict,
  consulta_id uuid,
  interesado_id uuid,
  inmueble_id uuid,
  documento_id uuid,
  clase text not null default 'tarea'
    check (clase in ('tarea', 'llamada', 'visita', 'firma', 'cita', 'seguimiento', 'cobro')),
  titulo text not null check (length(btrim(titulo)) between 1 and 300),
  detalle text not null default '' check (length(detalle) <= 5000),
  quien text not null default 'fortius' check (quien in ('fortius', 'cliente', 'abogado', 'notaria', 'otro')),
  quien_persona_id uuid references public.fortius_inmuebles_personas (id) on delete restrict,
  responsable_id uuid not null default auth.uid() references public.fortius_inmuebles_staff (user_id) on delete restrict,
  fecha date,
  hora time,
  check (hora is null or fecha is not null),
  duracion_min integer check (duracion_min between 5 and 1440),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'hecha', 'no_aplica', 'no_se_puede')),
  motivo text check (length(motivo) <= 1000),
  espera_a uuid references public.fortius_inmuebles_tareas (id) on delete restrict,
  check (espera_a is distinct from id),
  repetir jsonb check (repetir is null or (jsonb_typeof(repetir) = 'object' and repetir->>'cada' in ('dia', 'semana', 'quincena', 'mes', 'bimestre', 'trimestre', 'año'))),
  volver_a_preguntar date,
  pospuesta integer not null default 0 check (pospuesta >= 0),
  recordada_el timestamptz,
  hecha_el timestamptz,
  hecha_por uuid references auth.users (id),
  origen text not null default 'manual' check (origen in ('manual', 'consulta', 'biblioteca', 'opinion', 'situacion', 'sistema', 'linea')),
  orden numeric not null default 0,
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on public.fortius_inmuebles_tareas (asunto_id, estado, fecha) where deleted_at is null;
create index on public.fortius_inmuebles_tareas (responsable_id, estado, fecha) where deleted_at is null;
create index on public.fortius_inmuebles_tareas (etapa_id, orden) where deleted_at is null;
create index on public.fortius_inmuebles_tareas (persona_id) where persona_id is not null;
create trigger fortius_01_version before update on public.fortius_inmuebles_tareas
  for each row execute function public.fortius_inmuebles_panel_version();

-- Coherencia y sellos: la etapa es del mismo asunto; hecha lleva quién y cuándo; lo que le toca a otro
-- nace con «volver a preguntar» (fecha + 3 días, u hoy + 3); mover la fecha hacia adelante cuenta como pospuesta.
create function public.fortius_inmuebles_guard_tarea() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.etapa_id is not null and not exists (
       select 1 from public.fortius_inmuebles_plan_etapas e where e.id = new.etapa_id and e.asunto_id is not distinct from new.asunto_id) then
    raise sqlstate '22023' using message = 'La etapa es de otro asunto';
  end if;
  if tg_op = 'UPDATE' and old.asunto_id is not null and new.asunto_id is distinct from old.asunto_id then
    raise sqlstate '22023' using message = 'Una tarea no cambia de asunto';
  end if;
  if auth.uid() is not null and tg_op = 'INSERT' and new.responsable_id is distinct from auth.uid()
     and not public.fortius_inmuebles_is_admin()
     and not (new.asunto_id is not null and public.fortius_inmuebles_lleva_asunto(new.asunto_id)) then
    raise sqlstate 'PT403' using message = 'Solo quien lleva el asunto o el director asignan tareas a otra persona';
  end if;
  if new.estado = 'hecha' and (tg_op = 'INSERT' or old.estado <> 'hecha') then
    new.hecha_el := now();
    new.hecha_por := auth.uid();
  elsif new.estado <> 'hecha' then
    new.hecha_el := null;
    new.hecha_por := null;
  end if;
  if new.estado in ('pendiente', 'hecha') then
    new.motivo := null;
  end if;
  if new.quien <> 'fortius' and new.volver_a_preguntar is null and new.estado = 'pendiente' then
    new.volver_a_preguntar := coalesce(new.fecha, current_date) + 3;
  end if;
  if tg_op = 'UPDATE' and new.estado = 'pendiente' and old.fecha is not null and new.fecha > old.fecha then
    new.pospuesta := old.pospuesta + 1;
  end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_tarea() from public, anon, authenticated, service_role;
create trigger fortius_02_guard before insert or update on public.fortius_inmuebles_tareas
  for each row execute function public.fortius_inmuebles_guard_tarea();
create trigger fortius_zz_historial after insert or update of titulo, estado, motivo, fecha, hora, quien, responsable_id, deleted_at
  on public.fortius_inmuebles_tareas
  for each row execute function public.fortius_inmuebles_registrar_cambio('tarea', 'titulo,estado,motivo,fecha,hora,quien,responsable_id');

alter table public.fortius_inmuebles_tareas enable row level security;
revoke all on public.fortius_inmuebles_tareas from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_tareas to authenticated;
grant all on public.fortius_inmuebles_tareas to service_role;
-- Del asunto: quien ve el asunto. Sueltas: quien la tiene a su cargo, quien la escribió o el director.
create policy tareas_read on public.fortius_inmuebles_tareas for select to authenticated using (
  case when asunto_id is not null then public.fortius_inmuebles_puede_ver_asunto(asunto_id)
       else (select public.fortius_inmuebles_is_admin())
            or ((select public.fortius_inmuebles_is_staff()) and (responsable_id = (select auth.uid()) or creado_por = (select auth.uid())))
  end);
create policy tareas_insert on public.fortius_inmuebles_tareas for insert to authenticated with check (
  creado_por = (select auth.uid()) and (select public.fortius_inmuebles_is_staff())
  and (asunto_id is null or public.fortius_inmuebles_puede_ver_asunto(asunto_id)));
create policy tareas_update on public.fortius_inmuebles_tareas for update to authenticated using (
  case when asunto_id is not null then public.fortius_inmuebles_puede_ver_asunto(asunto_id)
       else (select public.fortius_inmuebles_is_admin())
            or ((select public.fortius_inmuebles_is_staff()) and (responsable_id = (select auth.uid()) or creado_por = (select auth.uid())))
  end)
  with check (asunto_id is null or public.fortius_inmuebles_puede_ver_asunto(asunto_id));

-- ── Lo que sigue ──────────────────────────────────────────────────────────────────────────────────────
-- La tarea pendiente más próxima de cada asunto (sin fecha, al final). Respeta la RLS de quien consulta.
create view public.fortius_inmuebles_asunto_siguiente with (security_invoker = true) as
select distinct on (t.asunto_id)
       t.asunto_id, t.id as tarea_id, t.titulo, t.quien, t.fecha, t.hora, t.responsable_id, t.version
  from public.fortius_inmuebles_tareas t
 where t.asunto_id is not null and t.estado = 'pendiente' and t.deleted_at is null
 order by t.asunto_id, t.fecha nulls last, t.hora nulls last, t.orden, t.created_at;
revoke all on public.fortius_inmuebles_asunto_siguiente from anon, authenticated;
grant select on public.fortius_inmuebles_asunto_siguiente to authenticated, service_role;

notify pgrst, 'reload schema';
commit;
