-- Recoverable removal; document bytes, IDs and links remain intact.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
alter table public.fortius_inmuebles_expedientes
  add column deleted_at timestamptz,
  add column deleted_by uuid; -- Retain the historical actor even if their Auth account is removed.

-- Keep row-level access to the parent so its owner/admin can restore it.
-- Document authorization requires an active parent, including for administrators.
create or replace function public.fortius_inmuebles_can_access_expediente(p_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from public.fortius_inmuebles_expedientes e
    where e.id=p_id and e.deleted_at is null and
      (public.fortius_inmuebles_is_admin() or
       (e.asesor_id=public.fortius_inmuebles_current_asesor_id()
        and public.fortius_inmuebles_can_access_client_id(e.cliente_id))));
$$;

create function public.fortius_inmuebles_guard_expediente_lifecycle() returns trigger
language plpgsql set search_path='' as $$
begin
  if tg_op='INSERT' then
    if new.deleted_at is not null or new.deleted_by is not null then
      raise sqlstate 'PT400' using message='El expediente debe crearse activo';
    end if;
  elsif old.deleted_at is not null and new.deleted_at is not null then
    raise sqlstate 'PT409' using message='Restaura el expediente antes de modificarlo';
  elsif old.deleted_at is null and new.deleted_at is not null then
    if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida'; end if;
    new.deleted_at:=clock_timestamp();
    new.deleted_by:=auth.uid();
  else
    new.deleted_by:=null;
  end if;
  return new;
end;
$$;
revoke all on function public.fortius_inmuebles_guard_expediente_lifecycle() from public,anon,authenticated;
create trigger fortius_inmuebles_guard_expediente_lifecycle
before insert or update on public.fortius_inmuebles_expedientes
for each row execute function public.fortius_inmuebles_guard_expediente_lifecycle();

-- Serialize document writes with removal, including server-side PDF uploads.
create function public.fortius_inmuebles_guard_active_document() returns trigger
language plpgsql set search_path='' as $$
declare parent_id uuid; removed_at timestamptz;
begin
  if tg_table_name='fortius_inmuebles_formato_drafts' then
    parent_id:=new.expediente_id;
  elsif tg_table_name in ('fortius_inmuebles_formato_emissions','fortius_inmuebles_formato_assets') then
    select expediente_id into parent_id from public.fortius_inmuebles_formato_drafts where id=new.draft_id;
  elsif tg_table_name='fortius_inmuebles_signed_copies' then
    select d.expediente_id into parent_id from public.fortius_inmuebles_formato_emissions e
      join public.fortius_inmuebles_formato_drafts d on d.id=e.draft_id where e.id=new.emission_id;
  end if;
  select deleted_at into removed_at from public.fortius_inmuebles_expedientes where id=parent_id for share;
  if not found or removed_at is not null then
    raise sqlstate 'PT409' using message='El expediente no está activo';
  end if;
  return new;
end;
$$;
revoke all on function public.fortius_inmuebles_guard_active_document() from public,anon,authenticated;
create trigger fortius_inmuebles_guard_active_document before insert or update on public.fortius_inmuebles_formato_drafts
for each row execute function public.fortius_inmuebles_guard_active_document();
create trigger fortius_inmuebles_guard_active_document before insert or update on public.fortius_inmuebles_formato_emissions
for each row execute function public.fortius_inmuebles_guard_active_document();
create trigger fortius_inmuebles_guard_active_document before insert or update on public.fortius_inmuebles_formato_assets
for each row execute function public.fortius_inmuebles_guard_active_document();
create trigger fortius_inmuebles_guard_active_document before insert or update on public.fortius_inmuebles_signed_copies
for each row execute function public.fortius_inmuebles_guard_active_document();
notify pgrst,'reload schema';
commit;
