-- SEG-M5 (auditoría del 13/11/2026): el acceso al panel y la recuperación de contraseña no tenían
-- límite propio. Supabase solo ve la IP del servidor (Vercel), así que su límite no distingue
-- visitantes: unas pruebas de contraseña repartidas pasaban, y agotarlo bloqueaba a todo el equipo.
-- fortius_inmuebles_auth_attempt cuenta intentos por clave (huella de la IP o del correo, nunca el
-- valor) en ventanas de una hora, en la misma tabla que la captura pública, y responde PT429 al
-- pasar el límite. Solo la llama el servidor (service_role).
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

create function public.fortius_inmuebles_auth_attempt(p_key text, p_limit integer) returns integer
language plpgsql security definer set search_path='' as $$
declare n integer; k text;
begin
  if p_key is null or p_key !~ '^(login|recovery):(ip|email):[0-9a-f]{64}$' or p_limit is null or p_limit not between 1 and 1000 then
    raise sqlstate 'PT400' using message='Solicitud inválida';
  end if;
  k := 'auth:'||p_key;
  insert into public.fortius_inmuebles_rate_limits(key,window_start,attempts) values(k,date_trunc('hour',now()),1)
    on conflict(key) do update set attempts=case when fortius_inmuebles_rate_limits.window_start=excluded.window_start then fortius_inmuebles_rate_limits.attempts+1 else 1 end,
      window_start=excluded.window_start
    returning attempts into n;
  if n > p_limit then raise sqlstate 'PT429' using message='Demasiados intentos de acceso; inténtalo más tarde'; end if;
  return n;
end;
$$;
revoke all on function public.fortius_inmuebles_auth_attempt(text,integer) from public, anon, authenticated;
grant execute on function public.fortius_inmuebles_auth_attempt(text,integer) to service_role;

notify pgrst,'reload schema';
commit;
