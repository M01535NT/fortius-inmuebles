-- Panel por asuntos · bloque 2: asuntos, colaboradores, visibilidad, historial y apartados
-- (docs/operacion/modelo-de-datos-panel.md, secciones 4.1, 4.2 y 4.10). Autorizado por el titular el 16/11/2026.
-- Aditivo: tablas nuevas; no toca expedientes ni records. Nada de aquí llega al sitio público.
--  · Director (admin) ve todo, también lo borrado. Asesor ve los asuntos que lleva o en los que colabora.
--  · Nada frena por falta de un dato o un paso: solo se rechaza lo que es permiso, versión vieja o dato inválido.
--  · Nada se borra: se marca deleted_at y se puede restaurar. El historial solo se agrega.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(781023);

-- ── Asuntos ───────────────────────────────────────────────────────────────────────────────────────────
create table public.fortius_inmuebles_asuntos (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique,                 -- lo pone la base (EXP-000031); no cambia
  nombre text not null check (length(btrim(nombre)) between 1 and 160),
  encargos text[] not null default '{}'
    check (encargos <@ array['revisar', 'comercializar', 'tramitar', 'asesorar']::text[]),
  en_que_va text not null default 'estudio'
    check (en_que_va in ('estudio', 'propuesta', 'en_marcha', 'por_cobrar', 'cerrado')),
  en_espera boolean not null default false,
  espera_motivo text check (length(espera_motivo) <= 500),
  espera_hasta date,
  resultado text check (resultado in ('se_logro', 'no_se_dio')),
  motivo_cierre text check (length(motivo_cierre) <= 1000),
  cerrado_el timestamptz,
  check (resultado is null or en_que_va = 'cerrado'),
  capto_id uuid references public.fortius_inmuebles_staff (user_id) on delete restrict,
  vendio_id uuid references public.fortius_inmuebles_staff (user_id) on delete restrict,
  responsable_id uuid not null default auth.uid() references public.fortius_inmuebles_staff (user_id) on delete restrict,
  viene_de uuid references public.fortius_inmuebles_asuntos (id) on delete restrict,
  check (viene_de is distinct from id),
  consulta_id uuid,                           -- llave foránea cuando exista la tabla de consultas
  situacion text not null default '' check (length(situacion) <= 20000),
  es_ejemplo boolean not null default false,
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id)
);
create index on public.fortius_inmuebles_asuntos (responsable_id, en_que_va) where deleted_at is null;
create index on public.fortius_inmuebles_asuntos (viene_de) where viene_de is not null;

create trigger fortius_00_folio before insert or update of folio on public.fortius_inmuebles_asuntos
  for each row execute function public.fortius_inmuebles_panel_folio('EXP');
create trigger fortius_01_version before update on public.fortius_inmuebles_asuntos
  for each row execute function public.fortius_inmuebles_panel_version();

-- Colaboradores del asunto (el responsable no va aquí), con su parte de la comisión si la tiene.
create table public.fortius_inmuebles_asunto_miembros (
  asunto_id uuid not null references public.fortius_inmuebles_asuntos (id) on delete restrict,
  usuario_id uuid not null references public.fortius_inmuebles_staff (user_id) on delete restrict,
  porcentaje numeric(5, 2) check (porcentaje between 0 and 100),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  retirado_el timestamptz,
  primary key (asunto_id, usuario_id)
);
create index on public.fortius_inmuebles_asunto_miembros (usuario_id) where retirado_el is null;

-- ── Visibilidad ───────────────────────────────────────────────────────────────────────────────────────
-- ¿Puede quien está en sesión ver este asunto? Director: todo (también lo borrado). Asesor: lo que lleva o en lo que colabora.
create function public.fortius_inmuebles_puede_ver_asunto(p_asunto uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_asunto is not null and (
    public.fortius_inmuebles_is_admin()
    or (public.fortius_inmuebles_is_staff() and exists (
      select 1 from public.fortius_inmuebles_asuntos a
       where a.id = p_asunto and a.deleted_at is null
         and (a.responsable_id = auth.uid()
              or exists (select 1 from public.fortius_inmuebles_asunto_miembros m
                          where m.asunto_id = a.id and m.usuario_id = auth.uid() and m.retirado_el is null)))));
$$;
revoke all on function public.fortius_inmuebles_puede_ver_asunto(uuid) from public, anon;
grant execute on function public.fortius_inmuebles_puede_ver_asunto(uuid) to authenticated, service_role;

-- ¿Lo lleva quien está en sesión (o es director)? Para sumar colaboradores.
create function public.fortius_inmuebles_lleva_asunto(p_asunto uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.fortius_inmuebles_is_admin()
      or (public.fortius_inmuebles_is_staff() and exists (
            select 1 from public.fortius_inmuebles_asuntos a
             where a.id = p_asunto and a.deleted_at is null and a.responsable_id = auth.uid()));
$$;
revoke all on function public.fortius_inmuebles_lleva_asunto(uuid) from public, anon;
grant execute on function public.fortius_inmuebles_lleva_asunto(uuid) to authenticated, service_role;

-- Permisos del asunto (protecciones, no frenos de proceso):
--  · solo el director cambia quién lo lleva; lo manda a Eliminados quien lo lleva o el director, y solo el director lo restaura;
--  · al cerrar se anota la fecha; al reabrir se limpian resultado y fecha.
create function public.fortius_inmuebles_guard_asunto() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Sin sesión solo llega el servidor con la llave privilegiada (cargas y restauraciones); ya comprobó el acceso.
  if auth.uid() is null then
    null;
  elsif tg_op = 'INSERT' then
    if not public.fortius_inmuebles_is_admin() and new.responsable_id is distinct from auth.uid() then
      raise sqlstate 'PT403' using message = 'Solo el director abre un asunto a nombre de otra persona';
    end if;
    if new.deleted_at is not null then
      raise sqlstate 'PT403' using message = 'Un asunto nuevo no nace borrado';
    end if;
  else
    if new.responsable_id is distinct from old.responsable_id and not public.fortius_inmuebles_is_admin() then
      raise sqlstate 'PT403' using message = 'Solo el director cambia quién lleva el asunto';
    end if;
    if new.deleted_at is distinct from old.deleted_at then
      if not public.fortius_inmuebles_is_admin() and not (old.deleted_at is null and old.responsable_id = auth.uid()) then
        raise sqlstate 'PT403' using message = 'Solo el director o quien lo lleva lo manda a Eliminados; solo el director lo restaura';
      end if;
    end if;
  end if;
  if tg_op = 'UPDATE' and new.deleted_at is distinct from old.deleted_at then
    new.deleted_by := case when new.deleted_at is null then null else auth.uid() end;
  end if;
  if new.en_que_va = 'cerrado' and (tg_op = 'INSERT' or old.en_que_va is distinct from 'cerrado') then
    new.cerrado_el := now();
  elsif new.en_que_va <> 'cerrado' then
    new.resultado := null;
    new.cerrado_el := null;
  end if;
  if not new.en_espera then
    new.espera_motivo := null;
    new.espera_hasta := null;
  end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_asunto() from public, anon, authenticated, service_role;
create trigger fortius_02_guard before insert or update on public.fortius_inmuebles_asuntos
  for each row execute function public.fortius_inmuebles_guard_asunto();

alter table public.fortius_inmuebles_asuntos enable row level security;
revoke all on public.fortius_inmuebles_asuntos from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_asuntos to authenticated;
grant all on public.fortius_inmuebles_asuntos to service_role;
create policy asuntos_read on public.fortius_inmuebles_asuntos for select to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(id));
create policy asuntos_insert on public.fortius_inmuebles_asuntos for insert to authenticated
  with check ((select public.fortius_inmuebles_is_staff()) and creado_por = (select auth.uid()));
-- Mandar a Eliminados deja de cumplir puede_ver_asunto para el asesor; por eso el «with check» solo pide ser del equipo
-- y la guarda de arriba cuida quién borra, quién restaura y quién reasigna. El servidor manda a Eliminados sin «returning».
create policy asuntos_update on public.fortius_inmuebles_asuntos for update to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(id))
  with check ((select public.fortius_inmuebles_is_staff()));

alter table public.fortius_inmuebles_asunto_miembros enable row level security;
revoke all on public.fortius_inmuebles_asunto_miembros from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_asunto_miembros to authenticated;
grant all on public.fortius_inmuebles_asunto_miembros to service_role;
create policy asunto_miembros_read on public.fortius_inmuebles_asunto_miembros for select to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(asunto_id));
-- Quitar a alguien es marcar retirado_el; no se borra.
create policy asunto_miembros_insert on public.fortius_inmuebles_asunto_miembros for insert to authenticated
  with check (creado_por = (select auth.uid()) and public.fortius_inmuebles_lleva_asunto(asunto_id));
create policy asunto_miembros_update on public.fortius_inmuebles_asunto_miembros for update to authenticated
  using (public.fortius_inmuebles_lleva_asunto(asunto_id)) with check (public.fortius_inmuebles_lleva_asunto(asunto_id));

-- ── Historial ─────────────────────────────────────────────────────────────────────────────────────────
-- Todo lo que pasó, lo más nuevo arriba. Solo se agrega: una nota se corrige con otra.
create table public.fortius_inmuebles_historial (
  id bigint generated by default as identity primary key,  -- «by default»: la restauración vuelve a poner los mismos números
  entidad text not null check (entidad ~ '^[a-z_]{2,30}$'),
  entidad_id text not null check (length(entidad_id) between 1 and 80),
  asunto_id uuid references public.fortius_inmuebles_asuntos (id) on delete restrict,
  clase text not null default 'cambio' check (clase in ('cambio', 'nota', 'decision', 'comentario', 'aviso', 'sistema')),
  resumen text not null check (length(btrim(resumen)) between 1 and 2000),
  detalle jsonb check (detalle is null or jsonb_typeof(detalle) = 'object'),
  menciones uuid[] not null default '{}',
  actor_id uuid,
  actor_tipo text not null default 'usuario' check (actor_tipo in ('usuario', 'sistema', 'publico')),
  check (actor_tipo <> 'usuario' or actor_id is not null),
  created_at timestamptz not null default clock_timestamp()
);
create index on public.fortius_inmuebles_historial (asunto_id, created_at desc) where asunto_id is not null;
create index on public.fortius_inmuebles_historial (entidad, entidad_id, created_at desc);
create index on public.fortius_inmuebles_historial using gin (menciones) where menciones <> '{}';
alter table public.fortius_inmuebles_historial enable row level security;
revoke all on public.fortius_inmuebles_historial from anon, authenticated;
grant select on public.fortius_inmuebles_historial to authenticated;   -- se escribe solo por las funciones de abajo
grant all on public.fortius_inmuebles_historial to service_role;
create policy historial_read on public.fortius_inmuebles_historial for select to authenticated using (
  (select public.fortius_inmuebles_is_admin())
  or (asunto_id is not null and public.fortius_inmuebles_puede_ver_asunto(asunto_id))
  or ((select public.fortius_inmuebles_is_staff()) and (actor_id = (select auth.uid()) or (select auth.uid()) = any (menciones))));
create trigger fortius_solo_agregar before update or delete on public.fortius_inmuebles_historial
  for each row execute function public.fortius_inmuebles_solo_agregar();

-- Única forma de escribir en el historial desde la app (notas, decisiones, comentarios y avisos): el actor es quien está en sesión.
-- Un aviso es lo que faltaba cuando alguien siguió adelante («Se publicó sin fotos»): se anota y no frena.
create function public.fortius_inmuebles_anotar_historial(
  p_entidad text, p_entidad_id text, p_asunto uuid, p_clase text, p_resumen text,
  p_detalle jsonb default null, p_menciones uuid[] default '{}')
returns bigint language plpgsql security definer set search_path = '' as $$
declare nuevo bigint;
begin
  if not public.fortius_inmuebles_is_staff() then
    raise sqlstate 'PT403' using message = 'Sin acceso';
  end if;
  if p_asunto is not null and not public.fortius_inmuebles_puede_ver_asunto(p_asunto) then
    raise sqlstate 'PT403' using message = 'Sin acceso a ese asunto';
  end if;
  if p_clase not in ('nota', 'decision', 'comentario', 'aviso') then
    raise sqlstate '22023' using message = 'Clase de anotación no válida';
  end if;
  if exists (select 1 from unnest(coalesce(p_menciones, '{}')) u
              where not exists (select 1 from public.fortius_inmuebles_staff s where s.user_id = u and s.active)) then
    raise sqlstate '22023' using message = 'Solo se menciona a personas del equipo';
  end if;
  insert into public.fortius_inmuebles_historial (entidad, entidad_id, asunto_id, clase, resumen, detalle, menciones, actor_id, actor_tipo)
  values (p_entidad, p_entidad_id, p_asunto, p_clase, p_resumen, p_detalle, coalesce(p_menciones, '{}'), auth.uid(), 'usuario')
  returning id into nuevo;
  return nuevo;
end; $$;
revoke all on function public.fortius_inmuebles_anotar_historial(text, text, uuid, text, text, jsonb, uuid[]) from public, anon;
grant execute on function public.fortius_inmuebles_anotar_historial(text, text, uuid, text, text, jsonb, uuid[]) to authenticated, service_role;

-- Cambios automáticos: cada alta, cambio, envío a Eliminados y restauración queda con quién y cuándo.
-- Argumentos: entidad y, opcional, la lista de campos cuyo valor se anota (los demás solo por nombre, para no copiar
-- datos personales al historial). Nunca se anotan version, updated_at ni created_at.
create function public.fortius_inmuebles_registrar_cambio() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  entidad text := tg_argv[0];
  con_valor text[] := case when tg_nargs > 1 then string_to_array(tg_argv[1], ',') else '{}' end;
  nuevo jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  viejo jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  fila jsonb := coalesce(nuevo, viejo);
  asunto uuid;
  campos text[];
  valores jsonb := '{}';
  resumen text;
  k text;
begin
  asunto := case when tg_table_name = 'fortius_inmuebles_asuntos' then (fila->>'id')::uuid
                 else nullif(fila->>'asunto_id', '')::uuid end;
  if tg_op = 'INSERT' then
    resumen := 'Se creó';
  else
    select coalesce(array_agg(key order by key), '{}') into campos
      from jsonb_each(nuevo) n
     where key not in ('version', 'updated_at', 'created_at', 'deleted_by')
       and n.value is distinct from viejo->key;
    if cardinality(campos) = 0 then
      return null;
    end if;
    if 'deleted_at' = any (campos) then
      resumen := case when nuevo->>'deleted_at' is null then 'Se restauró' else 'Se mandó a Eliminados' end;
    else
      resumen := 'Cambió: ' || array_to_string(campos, ', ');
    end if;
    foreach k in array campos loop
      if k = any (con_valor) then
        valores := valores || jsonb_build_object(k, jsonb_build_object('antes', viejo->k, 'ahora', nuevo->k));
      end if;
    end loop;
  end if;
  insert into public.fortius_inmuebles_historial (entidad, entidad_id, asunto_id, clase, resumen, detalle, actor_id, actor_tipo)
  values (entidad, coalesce(fila->>'id', fila->>'persona_id'), asunto, 'cambio', resumen,
          case when tg_op = 'INSERT' then null else jsonb_build_object('campos', to_jsonb(campos), 'valores', valores) end,
          auth.uid(), case when auth.uid() is null then 'sistema' else 'usuario' end);
  return null;
end; $$;
revoke all on function public.fortius_inmuebles_registrar_cambio() from public, anon, authenticated, service_role;

create trigger fortius_zz_historial after insert or update on public.fortius_inmuebles_asuntos
  for each row execute function public.fortius_inmuebles_registrar_cambio(
    'asunto', 'nombre,encargos,en_que_va,en_espera,espera_motivo,espera_hasta,resultado,motivo_cierre,responsable_id,capto_id,vendio_id');

-- ── Apartados ─────────────────────────────────────────────────────────────────────────────────────────
-- Cada parte del asunto. Quitar un apartado lo oculta (visible = false); lo capturado se conserva.
-- Personas, Plan e Historial siempre están. Los apartados propios tienen nombre y vista (lista, tabla, galería, texto).
create table public.fortius_inmuebles_apartados (
  id uuid primary key default gen_random_uuid(),
  asunto_id uuid not null references public.fortius_inmuebles_asuntos (id) on delete restrict,
  clave text not null check (clave in ('personas', 'inmueble', 'interesados', 'situacion', 'documentos', 'opinion',
                                       'honorarios', 'plan', 'historial', 'propio')),
  visible boolean not null default true,
  check (visible or clave not in ('personas', 'plan', 'historial')),
  orden numeric not null default 0,
  nombre text check (length(btrim(nombre)) between 1 and 80),
  icono text check (icono ~ '^[a-z0-9-]{1,40}$'),
  vista text check (vista in ('lista', 'tabla', 'galeria', 'texto')),
  check (clave <> 'propio' or (nombre is not null and vista is not null)),
  -- [{clave, nombre, tipo: texto|numero|dinero|fecha|si_no|lista, opciones?}]; la ruta del servidor valida cada columna.
  columnas jsonb not null default '[]' check (jsonb_typeof(columnas) = 'array' and jsonb_array_length(columnas) <= 30),
  texto text not null default '' check (length(texto) <= 50000),
  biblioteca_id uuid,                         -- llave foránea cuando exista la Biblioteca
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index fortius_inmuebles_apartados_uno_por_clave on public.fortius_inmuebles_apartados (asunto_id, clave)
  where clave <> 'propio';
create index on public.fortius_inmuebles_apartados (asunto_id, orden) where deleted_at is null;
create trigger fortius_01_version before update on public.fortius_inmuebles_apartados
  for each row execute function public.fortius_inmuebles_panel_version();
-- Personas, Plan e Historial nacen solos con el asunto y no se ocultan: no hace falta anotarlos.
create trigger fortius_zz_historial after insert or update of visible, nombre, vista, deleted_at on public.fortius_inmuebles_apartados
  for each row when (new.clave not in ('personas', 'plan', 'historial')) execute function public.fortius_inmuebles_registrar_cambio('apartado', 'clave,visible,nombre,vista');

-- Filas de un apartado propio. Al cambiar de vista se leen las mismas filas: nada se pierde.
create table public.fortius_inmuebles_apartado_filas (
  id uuid primary key default gen_random_uuid(),
  apartado_id uuid not null references public.fortius_inmuebles_apartados (id) on delete restrict,
  asunto_id uuid not null references public.fortius_inmuebles_asuntos (id) on delete restrict,
  datos jsonb not null default '{}' check (jsonb_typeof(datos) = 'object' and length(datos::text) <= 20000),
  hecho boolean not null default false,       -- vista lista
  foto_path text check (foto_path ~ '^asuntos/[0-9a-f-]{36}/[A-Za-z0-9._/-]{1,200}$'),  -- vista galería, bucket privado
  orden numeric not null default 0,
  version bigint not null default 1 check (version > 0),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on public.fortius_inmuebles_apartado_filas (apartado_id, orden) where deleted_at is null;
create trigger fortius_01_version before update on public.fortius_inmuebles_apartado_filas
  for each row execute function public.fortius_inmuebles_panel_version();

-- La fila es del mismo asunto que su apartado, y su apartado es propio.
create function public.fortius_inmuebles_guard_apartado_fila() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.fortius_inmuebles_apartados a
                  where a.id = new.apartado_id and a.asunto_id = new.asunto_id and a.clave = 'propio') then
    raise sqlstate '22023' using message = 'La fila no corresponde a un apartado propio de este asunto';
  end if;
  if tg_op = 'UPDATE' and (new.apartado_id <> old.apartado_id or new.asunto_id <> old.asunto_id) then
    raise sqlstate '22023' using message = 'Una fila no cambia de apartado';
  end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_apartado_fila() from public, anon, authenticated, service_role;
create trigger fortius_02_guard before insert or update on public.fortius_inmuebles_apartado_filas
  for each row execute function public.fortius_inmuebles_guard_apartado_fila();

-- Todo asunto nace con Personas, Plan e Historial. Los demás los agrega la app según lo que encargaron.
create function public.fortius_inmuebles_apartados_de_siempre() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.fortius_inmuebles_apartados (asunto_id, clave, orden, creado_por)
  values (new.id, 'personas', 10, new.creado_por), (new.id, 'plan', 80, new.creado_por), (new.id, 'historial', 90, new.creado_por)
  on conflict do nothing;
  return null;
end; $$;
revoke all on function public.fortius_inmuebles_apartados_de_siempre() from public, anon, authenticated, service_role;
create trigger fortius_zy_apartados_de_siempre after insert on public.fortius_inmuebles_asuntos
  for each row execute function public.fortius_inmuebles_apartados_de_siempre();

alter table public.fortius_inmuebles_apartados enable row level security;
revoke all on public.fortius_inmuebles_apartados from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_apartados to authenticated;
grant all on public.fortius_inmuebles_apartados to service_role;
create policy apartados_read on public.fortius_inmuebles_apartados for select to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(asunto_id));
create policy apartados_insert on public.fortius_inmuebles_apartados for insert to authenticated
  with check (creado_por = (select auth.uid()) and public.fortius_inmuebles_puede_ver_asunto(asunto_id));
create policy apartados_update on public.fortius_inmuebles_apartados for update to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(asunto_id)) with check (public.fortius_inmuebles_puede_ver_asunto(asunto_id));

alter table public.fortius_inmuebles_apartado_filas enable row level security;
revoke all on public.fortius_inmuebles_apartado_filas from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_apartado_filas to authenticated;
grant all on public.fortius_inmuebles_apartado_filas to service_role;
create policy apartado_filas_read on public.fortius_inmuebles_apartado_filas for select to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(asunto_id));
create policy apartado_filas_insert on public.fortius_inmuebles_apartado_filas for insert to authenticated
  with check (creado_por = (select auth.uid()) and public.fortius_inmuebles_puede_ver_asunto(asunto_id));
create policy apartado_filas_update on public.fortius_inmuebles_apartado_filas for update to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(asunto_id)) with check (public.fortius_inmuebles_puede_ver_asunto(asunto_id));

notify pgrst, 'reload schema';
commit;
