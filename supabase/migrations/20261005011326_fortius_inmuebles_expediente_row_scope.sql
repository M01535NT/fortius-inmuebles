-- INSERT ... RETURNING evaluates read RLS within the command snapshot. A STABLE
-- function re-querying the new expediente cannot see that inserted row yet.
-- Authorize the candidate row's scope directly, preserving the same client check.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
alter policy mnt_expedientes_read on public.mnt_expedientes
  using (public.mnt_is_admin() or
    (asesor_id=public.mnt_current_asesor_id() and public.mnt_can_access_client_id(cliente_id)));
alter policy mnt_expedientes_update on public.mnt_expedientes
  using (public.mnt_is_admin() or
    (asesor_id=public.mnt_current_asesor_id() and public.mnt_can_access_client_id(cliente_id)));
commit;
