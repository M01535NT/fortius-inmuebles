-- Decisión del titular (13/11/2026): al mandar a Eliminados un trabajo de Herramientas con código QR,
-- su enlace para compartir deja de abrir. Si después se restaura, hay que generar un enlace nuevo.
-- Ocurre en la misma operación que el cambio a Eliminados. Solo se apaga el enlace que el trabajo tiene
-- guardado (input.shareId) y que pertenece al mismo dueño del trabajo; el JSON del trabajo no puede
-- apagar enlaces ajenos.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

create function public.fortius_inmuebles_revoke_run_share() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if old.deleted_at is null and new.deleted_at is not null
     and coalesce(new.input->>'shareId','') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    update public.fortius_inmuebles_app_shares set revoked=true
      where id=(new.input->>'shareId')::uuid and owner_id=new.owner_id and not revoked;
  end if;
  return new;
end;
$$;
revoke all on function public.fortius_inmuebles_revoke_run_share() from public, anon, authenticated;
create trigger app_run_revoke_share after update of deleted_at on public.fortius_inmuebles_app_runs
  for each row execute function public.fortius_inmuebles_revoke_run_share();

commit;
