-- PN-02 · Bloque 1: identidad y visibilidad del panel nuevo (AUD-02, AUD-04). Aditivo: no cambia nada del panel viejo.
-- El director (admin) ve todo; el asesor ve los asuntos que lleva (expedientes.asesor_id) o en los que colabora (RP-101).
-- El responsable vive en un solo lugar (expedientes.asesor_id); esta tabla solo guarda colaboradores (AUD-04, I2).
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(781023);

-- A diferencia de current_asesor_id() (solo rol editor), esta también devuelve la ficha del director (decisión 3 de AUD-02).
-- Pide el segundo paso donde existe (misma guarda que 20261113180000: solo hay mfa_ok() si la base tiene auth.mfa_factors).
-- Si una migración futura redefine las funciones de permisos, debe redefinir también esta (AUD-04, menor 12).
do $$
begin
  execute format($f$
    create function public.fortius_inmuebles_mi_asesor_id() returns text
    language sql stable security definer set search_path = '' as $b$
      select a.asesor_id
        from public.fortius_inmuebles_adviser_accounts a
        join public.fortius_inmuebles_staff s on s.user_id = a.user_id
       where a.user_id = auth.uid() and s.active and s.role in ('admin', 'editor') %s;
    $b$;$f$,
    case when to_regprocedure('public.fortius_inmuebles_mfa_ok()') is not null then 'and public.fortius_inmuebles_mfa_ok()' else '' end);
end; $$;
revoke all on function public.fortius_inmuebles_mi_asesor_id() from public, anon;
grant execute on function public.fortius_inmuebles_mi_asesor_id() to authenticated, service_role;

-- Colaboradores de un asunto, con su parte de la comisión. El responsable no va aquí.
create table public.fortius_inmuebles_asunto_miembros (
  asunto_id uuid not null references public.fortius_inmuebles_expedientes (id) on delete restrict,
  asesor_id text not null,
  asesor_collection text not null default 'asesores' check (asesor_collection = 'asesores'),
  porcentaje numeric(5, 2) check (porcentaje between 0 and 100),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  retirado_el timestamptz,
  primary key (asunto_id, asesor_id),
  foreign key (asesor_collection, asesor_id) references public.fortius_inmuebles_records (collection, id) on delete restrict
);
create index on public.fortius_inmuebles_asunto_miembros (asesor_id) where retirado_el is null;
alter table public.fortius_inmuebles_asunto_miembros enable row level security;
revoke all on public.fortius_inmuebles_asunto_miembros from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_asunto_miembros to authenticated;
grant all on public.fortius_inmuebles_asunto_miembros to service_role;

-- ¿Puede la persona en sesión ver este asunto? Director: todo. Asesor: si lo lleva o colabora en él.
-- Es security definer: lee miembros sin pasar por su política (sin recursión).
-- No sustituye a can_access_expediente, que sigue cuidando los documentos del panel viejo.
create function public.fortius_inmuebles_puede_ver_asunto(p_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.fortius_inmuebles_is_admin() or (public.fortius_inmuebles_is_staff() and exists (
    select 1 from public.fortius_inmuebles_expedientes e
     where e.id = p_id and e.deleted_at is null and (
       e.asesor_id = public.fortius_inmuebles_mi_asesor_id()
       or exists (select 1 from public.fortius_inmuebles_asunto_miembros m
                   where m.asunto_id = e.id and m.retirado_el is null
                     and m.asesor_id = public.fortius_inmuebles_mi_asesor_id()))));
$$;
revoke all on function public.fortius_inmuebles_puede_ver_asunto(uuid) from public, anon;
grant execute on function public.fortius_inmuebles_puede_ver_asunto(uuid) to authenticated, service_role;

-- El colaborador ve con quién trabaja (AUD-04, menor 4). Solo el director arma el equipo.
create policy asunto_miembros_read on public.fortius_inmuebles_asunto_miembros for select to authenticated
  using ((select public.fortius_inmuebles_is_admin()) or public.fortius_inmuebles_puede_ver_asunto(asunto_id));
create policy asunto_miembros_insert on public.fortius_inmuebles_asunto_miembros for insert to authenticated
  with check ((select public.fortius_inmuebles_is_admin()) and creado_por = (select auth.uid()));
create policy asunto_miembros_update on public.fortius_inmuebles_asunto_miembros for update to authenticated
  using ((select public.fortius_inmuebles_is_admin())) with check ((select public.fortius_inmuebles_is_admin()));

-- El colaborador también lee el asunto mismo, no solo lo que cuelga de él (AUD-04, I1). Se suma a las políticas
-- de lectura existentes (que siguen igual para el panel viejo); no da permiso de escribir.
create policy fortius_inmuebles_expedientes_colaborador_read on public.fortius_inmuebles_expedientes for select to authenticated
  using (deleted_at is null and exists (
    select 1 from public.fortius_inmuebles_asunto_miembros m
     where m.asunto_id = fortius_inmuebles_expedientes.id and m.retirado_el is null
       and m.asesor_id = (select public.fortius_inmuebles_mi_asesor_id())));

commit;
