-- AUT-01 (titular, 13/11/2026): verificación en dos pasos para el director.
-- Quien tiene una app de códigos verificada solo cuenta como personal con una sesión «aal2»
-- (contraseña + código). Así una contraseña robada no basta para leer la base por la API,
-- aunque se salte el servidor. Quien no tiene factor sigue igual que hoy.
-- Las funciones de permisos se redefinen con el mismo cuerpo más esa condición. Solo se aplica
-- donde existen auth.jwt() y auth.mfa_factors (Supabase); en el ensayo local no cambia nada.
select pg_advisory_xact_lock(781023);

do $$
begin
  if to_regprocedure('auth.jwt()') is null or to_regclass('auth.mfa_factors') is null then
    raise notice 'Sin auth.jwt() o auth.mfa_factors: no se agrega la verificación en dos pasos';
    return;
  end if;

  create or replace function public.fortius_inmuebles_mfa_ok() returns boolean
    language sql stable security definer set search_path = ''
  as $f$
    select coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified');
  $f$;
  revoke all on function public.fortius_inmuebles_mfa_ok() from public, anon;
  grant execute on function public.fortius_inmuebles_mfa_ok() to authenticated, service_role;

  create or replace function public.fortius_inmuebles_is_staff() returns boolean
    language sql stable security definer set search_path = ''
  as $f$
    select exists(select 1 from public.fortius_inmuebles_staff where user_id = auth.uid() and active and role in ('admin','editor'))
      and public.fortius_inmuebles_mfa_ok();
  $f$;

  create or replace function public.fortius_inmuebles_is_admin() returns boolean
    language sql stable security definer set search_path = ''
  as $f$
    select exists(select 1 from public.fortius_inmuebles_staff where user_id = auth.uid() and active and role = 'admin')
      and public.fortius_inmuebles_mfa_ok();
  $f$;

  create or replace function public.fortius_inmuebles_current_asesor_id() returns text
    language sql stable security definer set search_path = ''
  as $f$
    select a.asesor_id from public.fortius_inmuebles_adviser_accounts a
      join public.fortius_inmuebles_staff s on s.user_id = a.user_id
      where a.user_id = auth.uid() and s.active and s.role = 'editor' and public.fortius_inmuebles_mfa_ok();
  $f$;
end $$;
