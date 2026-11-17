-- Etapa 5 de PLAN.md: los apartados a fondo (SPEC.md, secciones 5, 8 y 11).
-- Situación, opinión jurídica, honorarios (presupuesto, conceptos y cobros), interesados con sus ofertas,
-- la liga para que el cliente suba sus documentos y «Continuar en un asunto nuevo».
-- Nada frena: las reglas de aquí son de integridad (de qué asunto es cada cosa), no de proceso.
-- Detalle: docs/operacion/modelo-de-datos-panel.md, secciones 4.5 a 4.9.

-- ── Situación ─────────────────────────────────────────────────────────────────────────────────────────
-- Los hechos del caso (una clave con su valor: «de quién es», «quién lo ocupa»…) y lo que falta averiguar.
create table public.fortius_inmuebles_situacion_puntos (
  id uuid primary key default gen_random_uuid(),
  asunto_id uuid not null references public.fortius_inmuebles_asuntos (id) on delete restrict,
  clase text not null check (clase in ('hecho', 'por_averiguar')),
  clave text check (clave ~ '^[a-z_]{1,40}$'),
  valor jsonb check (valor is null or jsonb_typeof(valor) in ('string', 'array')),
  texto text not null default '' check (length(texto) <= 500),
  check (clase <> 'hecho' or clave is not null),
  check (clase <> 'por_averiguar' or length(btrim(texto)) >= 1),
  tarea_id uuid references public.fortius_inmuebles_tareas (id) on delete restrict,
  resuelto_el timestamptz,
  orden numeric not null default 0,
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index fortius_inmuebles_situacion_un_hecho on public.fortius_inmuebles_situacion_puntos (asunto_id, clave)
  where clase = 'hecho' and deleted_at is null;
create index on public.fortius_inmuebles_situacion_puntos (asunto_id, orden) where deleted_at is null;
create trigger fortius_01_version before update on public.fortius_inmuebles_situacion_puntos
  for each row execute function public.fortius_inmuebles_panel_version();
create trigger fortius_zz_historial after insert or update of valor, texto, resuelto_el, deleted_at on public.fortius_inmuebles_situacion_puntos
  for each row execute function public.fortius_inmuebles_registrar_cambio('situacion', 'clase,clave,valor,resuelto_el');

-- ── Opinión jurídica ──────────────────────────────────────────────────────────────────────────────────
-- Una por asunto. Elegir el resultado es emitirla: se anota cuándo y quién.
create table public.fortius_inmuebles_opiniones (
  id uuid primary key default gen_random_uuid(),
  asunto_id uuid not null references public.fortius_inmuebles_asuntos (id) on delete restrict,
  resultado text check (resultado in ('factible', 'factible_con_observaciones', 'no_factible')),
  analisis text not null default '' check (length(analisis) <= 20000),
  emitida_el timestamptz,
  emitida_por uuid references auth.users (id),
  documento_id uuid references public.fortius_inmuebles_asunto_documentos (id) on delete restrict,
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index fortius_inmuebles_opinion_una on public.fortius_inmuebles_opiniones (asunto_id) where deleted_at is null;
create trigger fortius_01_version before update on public.fortius_inmuebles_opiniones
  for each row execute function public.fortius_inmuebles_panel_version();

create function public.fortius_inmuebles_guard_opinion() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.asunto_id <> old.asunto_id then
    raise sqlstate '22023' using message = 'Una opinión no cambia de asunto';
  end if;
  if new.documento_id is not null and not exists (
       select 1 from public.fortius_inmuebles_asunto_documentos d where d.id = new.documento_id and d.asunto_id = new.asunto_id) then
    raise sqlstate '22023' using message = 'El documento es de otro asunto';
  end if;
  if new.resultado is null then
    new.emitida_el := null;
    new.emitida_por := null;
  elsif tg_op = 'INSERT' or old.resultado is distinct from new.resultado then
    new.emitida_el := now();
    new.emitida_por := auth.uid();
  end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_opinion() from public, anon, authenticated, service_role;
create trigger fortius_02_guard before insert or update on public.fortius_inmuebles_opiniones
  for each row execute function public.fortius_inmuebles_guard_opinion();
create trigger fortius_zz_historial after insert or update of resultado, documento_id, deleted_at on public.fortius_inmuebles_opiniones
  for each row execute function public.fortius_inmuebles_registrar_cambio('opinion', 'resultado');

-- Qué hay que resolver y quién lo hace. «Pasar al plan» lo vuelve tarea y anota cuál.
create table public.fortius_inmuebles_opinion_puntos (
  id uuid primary key default gen_random_uuid(),
  opinion_id uuid not null references public.fortius_inmuebles_opiniones (id) on delete restrict,
  asunto_id uuid not null references public.fortius_inmuebles_asuntos (id) on delete restrict,
  texto text not null check (length(btrim(texto)) between 1 and 500),
  quien text not null default 'fortius' check (quien in ('fortius', 'cliente', 'abogado', 'notaria', 'otro')),
  tarea_id uuid references public.fortius_inmuebles_tareas (id) on delete restrict,
  orden numeric not null default 0,
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on public.fortius_inmuebles_opinion_puntos (opinion_id, orden) where deleted_at is null;
create trigger fortius_01_version before update on public.fortius_inmuebles_opinion_puntos
  for each row execute function public.fortius_inmuebles_panel_version();

-- ── Dinero ────────────────────────────────────────────────────────────────────────────────────────────
-- El presupuesto (con su versión), sus conceptos y los cobros. Pesos y dólares no se mezclan: cada monto dice su moneda.
create table public.fortius_inmuebles_presupuestos (
  id uuid primary key default gen_random_uuid(),
  asunto_id uuid not null references public.fortius_inmuebles_asuntos (id) on delete restrict,
  numero integer not null default 1 check (numero between 1 and 999),
  estado text not null default 'borrador' check (estado in ('borrador', 'enviado', 'aceptado', 'rechazado')),
  enviado_el timestamptz,
  vigente_hasta date,
  paga_persona_id uuid references public.fortius_inmuebles_personas (id) on delete restrict,
  documento_id uuid references public.fortius_inmuebles_asunto_documentos (id) on delete restrict,
  nota text not null default '' check (length(nota) <= 2000),
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (asunto_id, numero)
);
create trigger fortius_01_version before update on public.fortius_inmuebles_presupuestos
  for each row execute function public.fortius_inmuebles_panel_version();

-- Número consecutivo por asunto; al enviarlo se anota cuándo y, si no tiene vigencia, vale quince días.
create function public.fortius_inmuebles_guard_presupuesto() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform pg_advisory_xact_lock(hashtext('presupuesto:' || new.asunto_id::text));
    new.numero := coalesce((select max(numero) from public.fortius_inmuebles_presupuestos where asunto_id = new.asunto_id), 0) + 1;
  elsif new.asunto_id <> old.asunto_id or new.numero <> old.numero then
    raise sqlstate '22023' using message = 'Un presupuesto no cambia de asunto ni de número';
  end if;
  if new.documento_id is not null and not exists (
       select 1 from public.fortius_inmuebles_asunto_documentos d where d.id = new.documento_id and d.asunto_id = new.asunto_id) then
    raise sqlstate '22023' using message = 'El documento es de otro asunto';
  end if;
  if new.estado = 'enviado' and (tg_op = 'INSERT' or old.estado <> 'enviado') then
    new.enviado_el := coalesce(new.enviado_el, now());
    new.vigente_hasta := coalesce(new.vigente_hasta, current_date + 15);
  end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_presupuesto() from public, anon, authenticated, service_role;
create trigger fortius_02_guard before insert or update on public.fortius_inmuebles_presupuestos
  for each row execute function public.fortius_inmuebles_guard_presupuesto();

-- Al enviarlo nace sola la tarea de darle seguimiento a los tres días (SPEC.md, sección 11), a cargo de quien lo envió.
create function public.fortius_inmuebles_seguimiento_presupuesto() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.estado = 'enviado' and (tg_op = 'INSERT' or old.estado <> 'enviado') then
    insert into public.fortius_inmuebles_tareas (asunto_id, clase, titulo, quien, fecha, origen, responsable_id, creado_por, orden)
    values (new.asunto_id, 'seguimiento', 'Dar seguimiento al presupuesto', 'fortius', current_date + 3, 'sistema',
            coalesce(auth.uid(), (select responsable_id from public.fortius_inmuebles_asuntos where id = new.asunto_id)),
            auth.uid(),
            coalesce((select max(orden) + 10 from public.fortius_inmuebles_tareas where asunto_id = new.asunto_id), 10));
  end if;
  return null;
end; $$;
revoke all on function public.fortius_inmuebles_seguimiento_presupuesto() from public, anon, authenticated, service_role;
create trigger fortius_03_seguimiento after insert or update of estado on public.fortius_inmuebles_presupuestos
  for each row execute function public.fortius_inmuebles_seguimiento_presupuesto();
create trigger fortius_zz_historial after insert or update of estado, vigente_hasta, paga_persona_id, documento_id, deleted_at
  on public.fortius_inmuebles_presupuestos
  for each row execute function public.fortius_inmuebles_registrar_cambio('presupuesto', 'numero,estado,vigente_hasta');

-- Honorario de Fortius o gasto de terceros. Un honorario puede ser un porcentaje del precio final.
create table public.fortius_inmuebles_presupuesto_conceptos (
  id uuid primary key default gen_random_uuid(),
  presupuesto_id uuid not null references public.fortius_inmuebles_presupuestos (id) on delete restrict,
  asunto_id uuid not null references public.fortius_inmuebles_asuntos (id) on delete restrict,
  clase text not null default 'honorario' check (clase in ('honorario', 'tercero')),
  concepto text not null check (length(btrim(concepto)) between 1 and 200),
  monto numeric(14, 2) check (monto >= 0),
  moneda text not null default 'MXN' check (moneda in ('MXN', 'USD')),
  porcentaje numeric(5, 2) check (porcentaje > 0 and porcentaje <= 100),
  check (monto is not null or porcentaje is not null),
  base_inmueble_id uuid references public.fortius_inmuebles_inmuebles (id) on delete restrict,
  inmueble_id uuid references public.fortius_inmuebles_inmuebles (id) on delete restrict,
  paga_persona_id uuid references public.fortius_inmuebles_personas (id) on delete restrict,
  tercero text check (length(tercero) <= 120),
  orden numeric not null default 0,
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on public.fortius_inmuebles_presupuesto_conceptos (presupuesto_id, orden) where deleted_at is null;
create trigger fortius_01_version before update on public.fortius_inmuebles_presupuesto_conceptos
  for each row execute function public.fortius_inmuebles_panel_version();

create table public.fortius_inmuebles_cobros (
  id uuid primary key default gen_random_uuid(),
  asunto_id uuid not null references public.fortius_inmuebles_asuntos (id) on delete restrict,
  concepto_id uuid references public.fortius_inmuebles_presupuesto_conceptos (id) on delete restrict,
  paga_persona_id uuid references public.fortius_inmuebles_personas (id) on delete restrict,
  inmueble_id uuid references public.fortius_inmuebles_inmuebles (id) on delete restrict,
  monto numeric(14, 2) not null check (monto > 0),
  moneda text not null default 'MXN' check (moneda in ('MXN', 'USD')),
  forma text not null default 'transferencia' check (forma in ('efectivo', 'transferencia', 'cheque', 'tarjeta', 'otro')),
  fecha date not null default current_date,
  recibo_documento_id uuid references public.fortius_inmuebles_asunto_documentos (id) on delete restrict,
  nota text not null default '' check (length(nota) <= 1000),
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on public.fortius_inmuebles_cobros (asunto_id, fecha) where deleted_at is null;
create trigger fortius_01_version before update on public.fortius_inmuebles_cobros
  for each row execute function public.fortius_inmuebles_panel_version();
create trigger fortius_zz_historial after insert or update of monto, moneda, forma, fecha, recibo_documento_id, deleted_at
  on public.fortius_inmuebles_cobros
  for each row execute function public.fortius_inmuebles_registrar_cambio('cobro', 'monto,moneda,forma,fecha');

-- ── Interesados ───────────────────────────────────────────────────────────────────────────────────────
-- Quien pregunta por lo que se comercializa. Sus visitas son tareas del plan (clase «visita»), así salen en Inicio.
create table public.fortius_inmuebles_interesados (
  id uuid primary key default gen_random_uuid(),
  asunto_id uuid not null references public.fortius_inmuebles_asuntos (id) on delete restrict,
  persona_id uuid not null references public.fortius_inmuebles_personas (id) on delete restrict,
  solicitud_id uuid,                          -- llave foránea cuando existan las solicitudes del sitio (etapa 8)
  estado text not null default 'nuevo' check (estado in ('nuevo', 'en_contacto', 'visito', 'oferto', 'descartado')),
  nota text not null default '' check (length(nota) <= 2000),
  orden numeric not null default 0,
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index fortius_inmuebles_interesado_uno on public.fortius_inmuebles_interesados (asunto_id, persona_id) where deleted_at is null;
create trigger fortius_01_version before update on public.fortius_inmuebles_interesados
  for each row execute function public.fortius_inmuebles_panel_version();
create trigger fortius_zz_historial after insert or update of estado, deleted_at on public.fortius_inmuebles_interesados
  for each row execute function public.fortius_inmuebles_registrar_cambio('interesado', 'estado');

create table public.fortius_inmuebles_interesado_inmuebles (
  interesado_id uuid not null references public.fortius_inmuebles_interesados (id) on delete cascade,
  inmueble_id uuid not null references public.fortius_inmuebles_inmuebles (id) on delete restrict,
  asunto_id uuid not null references public.fortius_inmuebles_asuntos (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (interesado_id, inmueble_id)
);

create table public.fortius_inmuebles_ofertas (
  id uuid primary key default gen_random_uuid(),
  interesado_id uuid not null references public.fortius_inmuebles_interesados (id) on delete restrict,
  asunto_id uuid not null references public.fortius_inmuebles_asuntos (id) on delete restrict,
  inmueble_id uuid references public.fortius_inmuebles_inmuebles (id) on delete restrict,
  monto numeric(14, 2) not null check (monto > 0),
  moneda text not null default 'MXN' check (moneda in ('MXN', 'USD')),
  fecha date not null default current_date,
  respuesta text not null default 'por_responder' check (respuesta in ('por_responder', 'aceptada', 'rechazada', 'contraoferta')),
  contraoferta_monto numeric(14, 2) check (contraoferta_monto > 0),
  nota text not null default '' check (length(nota) <= 1000),
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on public.fortius_inmuebles_ofertas (interesado_id) where deleted_at is null;
create trigger fortius_01_version before update on public.fortius_inmuebles_ofertas
  for each row execute function public.fortius_inmuebles_panel_version();
create trigger fortius_zz_historial after insert or update of monto, moneda, respuesta, contraoferta_monto, deleted_at
  on public.fortius_inmuebles_ofertas
  for each row execute function public.fortius_inmuebles_registrar_cambio('oferta', 'monto,moneda,respuesta,contraoferta_monto');

alter table public.fortius_inmuebles_tareas
  add constraint fortius_inmuebles_tareas_interesado_fk
  foreign key (interesado_id) references public.fortius_inmuebles_interesados (id) on delete restrict;

-- ── Ligas del cliente ─────────────────────────────────────────────────────────────────────────────────
-- Para que el cliente suba sus documentos. Se guarda solo la huella del enlace; el enlace lo ve una vez quien lo crea.
create table public.fortius_inmuebles_ligas_cliente (
  id uuid primary key default gen_random_uuid(),
  asunto_id uuid not null references public.fortius_inmuebles_asuntos (id) on delete restrict,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  expira_el timestamptz not null,
  revocada boolean not null default false,
  subidos integer not null default 0 check (subidos between 0 and 200),
  ultimo_uso timestamptz,
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version > 0)
);
create index on public.fortius_inmuebles_ligas_cliente (asunto_id) where not revocada;
create trigger fortius_01_version before update on public.fortius_inmuebles_ligas_cliente
  for each row execute function public.fortius_inmuebles_panel_version();
create trigger fortius_zz_historial after insert or update of revocada on public.fortius_inmuebles_ligas_cliente
  for each row execute function public.fortius_inmuebles_registrar_cambio('liga_cliente', 'revocada');

-- ── De qué asunto es cada cosa ────────────────────────────────────────────────────────────────────────
-- Una sola guarda para las tablas hijas: lo que señalan (opinión, presupuesto, interesado, concepto,
-- tarea, documento, inmueble, persona) es del mismo asunto, y nada cambia de asunto.
create function public.fortius_inmuebles_guard_del_asunto() returns trigger
language plpgsql security definer set search_path = '' as $$
declare f jsonb := to_jsonb(new); a uuid := new.asunto_id;
begin
  if tg_op = 'UPDATE' and a <> (to_jsonb(old)->>'asunto_id')::uuid then
    raise sqlstate '22023' using message = 'No cambia de asunto';
  end if;
  if f ? 'opinion_id' and not exists (select 1 from public.fortius_inmuebles_opiniones x where x.id = (f->>'opinion_id')::uuid and x.asunto_id = a) then
    raise sqlstate '22023' using message = 'La opinión es de otro asunto';
  end if;
  if f ? 'presupuesto_id' and not exists (select 1 from public.fortius_inmuebles_presupuestos x where x.id = (f->>'presupuesto_id')::uuid and x.asunto_id = a) then
    raise sqlstate '22023' using message = 'El presupuesto es de otro asunto';
  end if;
  if f ? 'interesado_id' and not exists (select 1 from public.fortius_inmuebles_interesados x where x.id = (f->>'interesado_id')::uuid and x.asunto_id = a) then
    raise sqlstate '22023' using message = 'El interesado es de otro asunto';
  end if;
  if nullif(f->>'concepto_id', '') is not null and not exists (
       select 1 from public.fortius_inmuebles_presupuesto_conceptos x where x.id = (f->>'concepto_id')::uuid and x.asunto_id = a) then
    raise sqlstate '22023' using message = 'El concepto es de otro asunto';
  end if;
  if nullif(f->>'tarea_id', '') is not null and not exists (
       select 1 from public.fortius_inmuebles_tareas x where x.id = (f->>'tarea_id')::uuid and x.asunto_id = a) then
    raise sqlstate '22023' using message = 'La tarea es de otro asunto';
  end if;
  if nullif(f->>'recibo_documento_id', '') is not null and not exists (
       select 1 from public.fortius_inmuebles_asunto_documentos x where x.id = (f->>'recibo_documento_id')::uuid and x.asunto_id = a) then
    raise sqlstate '22023' using message = 'El recibo es de otro asunto';
  end if;
  if nullif(f->>'inmueble_id', '') is not null and not exists (
       select 1 from public.fortius_inmuebles_asunto_inmuebles x where x.inmueble_id = (f->>'inmueble_id')::uuid and x.asunto_id = a) then
    raise sqlstate '22023' using message = 'Ese inmueble no está en este asunto';
  end if;
  if nullif(f->>'base_inmueble_id', '') is not null and not exists (
       select 1 from public.fortius_inmuebles_asunto_inmuebles x where x.inmueble_id = (f->>'base_inmueble_id')::uuid and x.asunto_id = a) then
    raise sqlstate '22023' using message = 'Ese inmueble no está en este asunto';
  end if;
  if nullif(f->>'paga_persona_id', '') is not null and not exists (
       select 1 from public.fortius_inmuebles_asunto_personas x where x.persona_id = (f->>'paga_persona_id')::uuid and x.asunto_id = a) then
    raise sqlstate '22023' using message = 'Esa persona no está en este asunto';
  end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_del_asunto() from public, anon, authenticated, service_role;
create trigger fortius_02_guard before insert or update on public.fortius_inmuebles_situacion_puntos
  for each row execute function public.fortius_inmuebles_guard_del_asunto();
create trigger fortius_02_guard before insert or update on public.fortius_inmuebles_opinion_puntos
  for each row execute function public.fortius_inmuebles_guard_del_asunto();
create trigger fortius_03_guard before insert or update on public.fortius_inmuebles_presupuestos
  for each row execute function public.fortius_inmuebles_guard_del_asunto();
create trigger fortius_02_guard before insert or update on public.fortius_inmuebles_presupuesto_conceptos
  for each row execute function public.fortius_inmuebles_guard_del_asunto();
create trigger fortius_02_guard before insert or update on public.fortius_inmuebles_cobros
  for each row execute function public.fortius_inmuebles_guard_del_asunto();
create trigger fortius_02_guard before insert or update on public.fortius_inmuebles_interesados
  for each row execute function public.fortius_inmuebles_guard_del_asunto();
create trigger fortius_02_guard before insert on public.fortius_inmuebles_interesado_inmuebles
  for each row execute function public.fortius_inmuebles_guard_del_asunto();
create trigger fortius_02_guard before insert or update on public.fortius_inmuebles_ofertas
  for each row execute function public.fortius_inmuebles_guard_del_asunto();
create trigger fortius_02_guard before insert or update on public.fortius_inmuebles_ligas_cliente
  for each row execute function public.fortius_inmuebles_guard_del_asunto();

-- ── Permisos ──────────────────────────────────────────────────────────────────────────────────────────
-- Quien ve el asunto ve y cambia sus apartados. Nada se borra: se manda a Eliminados (deleted_at).
do $permisos$
declare t text;
begin
  foreach t in array array['situacion_puntos', 'opiniones', 'opinion_puntos', 'presupuestos', 'presupuesto_conceptos',
                           'cobros', 'interesados', 'ofertas', 'ligas_cliente'] loop
    execute format('alter table public.fortius_inmuebles_%s enable row level security', t);
    execute format('revoke all on public.fortius_inmuebles_%s from anon, authenticated', t);
    execute format('grant select, insert, update on public.fortius_inmuebles_%s to authenticated', t);
    execute format('grant all on public.fortius_inmuebles_%s to service_role', t);
    execute format('create policy %1$s_read on public.fortius_inmuebles_%1$s for select to authenticated
                      using (public.fortius_inmuebles_puede_ver_asunto(asunto_id))', t);
    execute format('create policy %1$s_insert on public.fortius_inmuebles_%1$s for insert to authenticated
                      with check (creado_por = (select auth.uid()) and public.fortius_inmuebles_puede_ver_asunto(asunto_id))', t);
    execute format('create policy %1$s_update on public.fortius_inmuebles_%1$s for update to authenticated
                      using (public.fortius_inmuebles_puede_ver_asunto(asunto_id))
                      with check (public.fortius_inmuebles_puede_ver_asunto(asunto_id))', t);
  end loop;
end $permisos$;

alter table public.fortius_inmuebles_interesado_inmuebles enable row level security;
revoke all on public.fortius_inmuebles_interesado_inmuebles from anon, authenticated;
grant select, insert, delete on public.fortius_inmuebles_interesado_inmuebles to authenticated;
grant all on public.fortius_inmuebles_interesado_inmuebles to service_role;
create policy interesado_inmuebles_read on public.fortius_inmuebles_interesado_inmuebles for select to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(asunto_id));
create policy interesado_inmuebles_insert on public.fortius_inmuebles_interesado_inmuebles for insert to authenticated
  with check (public.fortius_inmuebles_puede_ver_asunto(asunto_id));
create policy interesado_inmuebles_delete on public.fortius_inmuebles_interesado_inmuebles for delete to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(asunto_id));

-- ── Continuar en un asunto nuevo ──────────────────────────────────────────────────────────────────────
-- Copia las personas, los inmuebles y los documentos (sin sus archivos: los copia el servidor) y anota en los dos
-- de dónde viene cada uno. Devuelve el asunto nuevo y qué documento nuevo corresponde a cada uno de antes.
create function public.fortius_inmuebles_continuar_asunto(p_asunto uuid, p_nombre text, p_encargos text[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a record; nuevo record; docs jsonb := '{}'; d record; nd uuid;
begin
  if not public.fortius_inmuebles_puede_ver_asunto(p_asunto) then
    raise sqlstate 'PT403' using message = 'Sin acceso a ese asunto';
  end if;
  select * into a from public.fortius_inmuebles_asuntos where id = p_asunto and deleted_at is null;
  if not found then
    raise sqlstate '22023' using message = 'Ese asunto no existe';
  end if;
  insert into public.fortius_inmuebles_asuntos (nombre, encargos, responsable_id, viene_de, es_ejemplo, creado_por)
  values (coalesce(nullif(btrim(p_nombre), ''), left(a.nombre || ' (continúa)', 160)),
          coalesce(p_encargos, a.encargos), auth.uid(), a.id, a.es_ejemplo, auth.uid())
  returning id, folio into nuevo;

  insert into public.fortius_inmuebles_asunto_personas (asunto_id, persona_id, papel, inmueble_id, principal, nota, orden, creado_por)
  select nuevo.id, persona_id, papel, inmueble_id, principal, nota, orden, auth.uid()
    from public.fortius_inmuebles_asunto_personas where asunto_id = a.id and retirado_el is null;
  insert into public.fortius_inmuebles_asunto_inmuebles (asunto_id, inmueble_id, orden, creado_por)
  select nuevo.id, inmueble_id, orden, auth.uid()
    from public.fortius_inmuebles_asunto_inmuebles where asunto_id = a.id and retirado_el is null;

  for d in select * from public.fortius_inmuebles_asunto_documentos where asunto_id = a.id and deleted_at is null order by orden loop
    insert into public.fortius_inmuebles_asunto_documentos (asunto_id, nombre, grupo, estado, recibido_el, entrega_persona_id, entrega_papel,
                                                            de_persona_id, inmueble_id, vence_el, avisar_dias, origen, paso,
                                                            es_contrato, es_recibo, nota, orden, creado_por)
    values (nuevo.id, d.nombre, d.grupo, d.estado, d.recibido_el, d.entrega_persona_id, d.entrega_papel, d.de_persona_id, d.inmueble_id,
            d.vence_el, d.avisar_dias, d.origen, d.paso, d.es_contrato, d.es_recibo, d.nota, d.orden, auth.uid())
    returning id into nd;
    docs := docs || jsonb_build_object(d.id::text, nd);
  end loop;

  insert into public.fortius_inmuebles_historial (entidad, entidad_id, asunto_id, clase, resumen, actor_id, actor_tipo)
  values ('asunto', nuevo.id::text, nuevo.id, 'nota', 'Viene de ' || a.folio || ', ' || a.nombre || '.', auth.uid(), 'usuario'),
         ('asunto', a.id::text, a.id, 'nota', 'Continúa en ' || nuevo.folio || '.', auth.uid(), 'usuario');
  return jsonb_build_object('id', nuevo.id, 'folio', nuevo.folio, 'documentos', docs);
end; $$;
revoke all on function public.fortius_inmuebles_continuar_asunto(uuid, text, text[]) from public, anon;
grant execute on function public.fortius_inmuebles_continuar_asunto(uuid, text, text[]) to authenticated, service_role;
