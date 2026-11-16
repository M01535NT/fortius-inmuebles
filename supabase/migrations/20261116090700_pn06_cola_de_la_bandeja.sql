-- PN-06 · Cola de la Bandeja en el servidor (DEC-54, 16/11/2026). Hoy un archivo que espera destino vive solo en la página:
-- si se cierra, se pierde. Con esta tabla, cada archivo «Por confirmar» queda anotado con su dueño y sigue en la carga
-- temporal privada (bucket fortius-inmuebles-staging) hasta que se guarda en un asunto o un inmueble, o se descarta.
-- Cada fila tiene quién la creó y responsable (RP-101); la visibilidad la hace cumplir RLS: el director ve todo,
-- el asesor solo lo suyo. No se borra: se marca «descartado». Plazo: 30 días por confirmar (registro de tratamiento).
-- Sin aplicar: se aplica al integrar en main, junto con PN-02 (usa fortius_inmuebles_mi_asesor_id de PN-02).
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(781023);

create table public.fortius_inmuebles_bandeja (
  id uuid primary key default gen_random_uuid(),
  creado_por uuid not null default auth.uid() references auth.users (id),
  responsable_id text default public.fortius_inmuebles_mi_asesor_id(),
  responsable_collection text not null default 'asesores' check (responsable_collection = 'asesores'),
  -- La carga temporal es de quien la subió: su ruta empieza con su id (igual que el permiso de carga del servidor).
  staging_path text not null unique check (staging_path ~ '^[a-f0-9-]+/[a-f0-9-]+\.(jpg|png|webp|gif|pdf)$'),
  check (split_part(staging_path, '/', 1) = creado_por::text),
  nombre text not null check (length(btrim(nombre)) between 1 and 160),
  tipo text not null check (tipo in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif')),
  bytes integer not null check (bytes between 1 and 20971520),
  estado text not null default 'por_confirmar' check (estado in ('por_confirmar', 'guardado', 'descartado')),
  destino_clase text check (destino_clase in ('asunto', 'inmueble')),
  destino_ref text check (destino_ref is null or length(destino_ref) between 1 and 160),
  check ((estado = 'guardado') = (destino_clase is not null and destino_ref is not null)),
  resuelto_el timestamptz,
  resuelto_por uuid,
  vence_el timestamptz not null default now() + interval '30 days',
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (responsable_collection, responsable_id) references public.fortius_inmuebles_records (collection, id) on delete restrict
);
create index on public.fortius_inmuebles_bandeja (creado_por, estado, created_at desc);
create index on public.fortius_inmuebles_bandeja (responsable_id, estado) where responsable_id is not null;
create index on public.fortius_inmuebles_bandeja (vence_el) where estado = 'por_confirmar';

-- ¿Puede la persona en sesión ver este archivo de la Bandeja? Director: todo. Asesor: lo que subió o lo que tiene a su cargo.
create function public.fortius_inmuebles_puede_ver_bandeja(p_creado_por uuid, p_responsable text) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.fortius_inmuebles_is_admin() or (public.fortius_inmuebles_is_staff() and (
    p_creado_por = auth.uid()
    or (p_responsable is not null and p_responsable = public.fortius_inmuebles_mi_asesor_id())));
$$;
revoke all on function public.fortius_inmuebles_puede_ver_bandeja(uuid, text) from public, anon;
grant execute on function public.fortius_inmuebles_puede_ver_bandeja(uuid, text) to authenticated, service_role;

alter table public.fortius_inmuebles_bandeja enable row level security;
revoke all on public.fortius_inmuebles_bandeja from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_bandeja to authenticated;   -- no se borra: se descarta
grant all on public.fortius_inmuebles_bandeja to service_role;
create policy bandeja_read on public.fortius_inmuebles_bandeja for select to authenticated
  using (public.fortius_inmuebles_puede_ver_bandeja(creado_por, responsable_id));
-- Solo se anota lo que uno mismo subió; el asesor se lo asigna a sí mismo, el director a cualquiera.
create policy bandeja_insert on public.fortius_inmuebles_bandeja for insert to authenticated
  with check (creado_por = (select auth.uid()) and estado = 'por_confirmar' and public.fortius_inmuebles_is_staff()
              and (public.fortius_inmuebles_is_admin() or responsable_id is null or responsable_id = public.fortius_inmuebles_mi_asesor_id()));
create policy bandeja_update on public.fortius_inmuebles_bandeja for update to authenticated
  using (public.fortius_inmuebles_puede_ver_bandeja(creado_por, responsable_id))
  with check (public.fortius_inmuebles_puede_ver_bandeja(creado_por, responsable_id));

-- Reglas que no dependen de quién mira: versión, datos del archivo que no cambian, quién lo resolvió y quién reasigna.
create function public.fortius_inmuebles_guardar_bandeja() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.version := 1;
    new.created_at := now();
    new.updated_at := now();
    new.vence_el := now() + interval '30 days';
    new.resuelto_el := null; new.resuelto_por := null;
    return new;
  end if;
  if new.version is distinct from old.version then
    raise sqlstate 'PT409' using message = 'Alguien más cambió este archivo de la Bandeja. Vuelve a abrirla.';
  end if;
  if new.creado_por is distinct from old.creado_por or new.staging_path is distinct from old.staging_path
     or new.nombre is distinct from old.nombre or new.tipo is distinct from old.tipo or new.bytes is distinct from old.bytes
     or new.created_at is distinct from old.created_at or new.vence_el is distinct from old.vence_el then
    raise sqlstate 'PT403' using message = 'Esos datos del archivo no se cambian';
  end if;
  if new.responsable_id is distinct from old.responsable_id and auth.uid() is not null and not public.fortius_inmuebles_is_admin() then
    raise sqlstate 'PT403' using message = 'Solo dirección reasigna un archivo de la Bandeja';
  end if;
  if old.estado = 'descartado' and new.estado <> 'descartado' then
    raise sqlstate 'PT409' using message = 'Este archivo ya se descartó';
  end if;
  -- Deshacer un guardado lo regresa a «por confirmar» (el destino se limpia en la misma escritura).
  if new.estado <> old.estado then
    if new.estado = 'por_confirmar' then new.resuelto_el := null; new.resuelto_por := null;
    else new.resuelto_el := now(); new.resuelto_por := auth.uid(); end if;
  else
    new.resuelto_el := old.resuelto_el; new.resuelto_por := old.resuelto_por;
  end if;
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_guardar_bandeja() from public, anon, authenticated, service_role;
create trigger fortius_00_guardar_bandeja before insert or update on public.fortius_inmuebles_bandeja
  for each row execute function public.fortius_inmuebles_guardar_bandeja();

notify pgrst, 'reload schema';
commit;
