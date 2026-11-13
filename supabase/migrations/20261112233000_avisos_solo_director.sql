begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

-- DEC-42 (titular, 12/11/2026): los «Avisos» de Hoy son notas marcadas `aviso` que solo escribe el
-- director. Ocultar el botón no basta: la base rechaza que otro usuario cree, cambie o quite un
-- aviso, o que convierta una nota en aviso (o un aviso en nota). Las demás notas no cambian.
create function public.fortius_inmuebles_guard_announcement() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or public.fortius_inmuebles_is_admin() then return coalesce(new,old);end if;
 if (tg_op<>'INSERT' and old.collection='notas' and coalesce(old.data->>'aviso','false')='true')
  or (tg_op<>'DELETE' and new.collection='notas' and coalesce(new.data->>'aviso','false')='true') then
  raise sqlstate 'PT403' using message='Solo el director escribe avisos';
 end if;
 return coalesce(new,old);
end; $$;
revoke all on function public.fortius_inmuebles_guard_announcement() from public,anon,authenticated,service_role;
create trigger fortius_guard_announcement before insert or update or delete on public.fortius_inmuebles_records
 for each row execute function public.fortius_inmuebles_guard_announcement();
notify pgrst,'reload schema';
commit;
