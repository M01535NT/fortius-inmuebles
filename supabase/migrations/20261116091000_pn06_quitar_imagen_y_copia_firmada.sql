-- PN-06 · Formatos: quitar una imagen (04 y 07) o una copia firmada sin borrarla.
-- Eliminación recuperable: la fila, los bytes en Storage y su huella se conservan; el panel deja de listarla
-- y «Deshacer» la restaura. Nada se borra de Storage. Las escrituras las hace el servidor con la llave
-- privilegiada después de comprobar, con la sesión del usuario (RLS), que ve el borrador o el PDF.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';

alter table public.fortius_inmuebles_formato_assets
  add column deleted_at timestamptz,
  add column deleted_by uuid, -- Se conserva aunque la cuenta de Auth se elimine.
  add constraint fortius_inmuebles_formato_assets_deleted_pair check ((deleted_at is null) = (deleted_by is null));

alter table public.fortius_inmuebles_signed_copies
  add column deleted_at timestamptz,
  add column deleted_by uuid,
  add constraint fortius_inmuebles_signed_copies_deleted_pair check ((deleted_at is null) = (deleted_by is null));

-- Una imagen o copia se crea activa; después solo cambian deleted_at y deleted_by.
create function public.fortius_inmuebles_guard_recoverable_file() returns trigger
language plpgsql set search_path='' as $$
begin
  if tg_op='INSERT' then
    if new.deleted_at is not null or new.deleted_by is not null then
      raise sqlstate 'PT400' using message='El archivo debe crearse activo';
    end if;
  elsif (to_jsonb(new) - 'deleted_at' - 'deleted_by') is distinct from (to_jsonb(old) - 'deleted_at' - 'deleted_by') then
    raise sqlstate 'PT409' using message='Ese archivo no se modifica; solo se quita o se restaura';
  elsif old.deleted_at is null and new.deleted_at is not null then
    new.deleted_at:=clock_timestamp();
  end if;
  return new;
end;
$$;
revoke all on function public.fortius_inmuebles_guard_recoverable_file() from public,anon,authenticated;
create trigger fortius_inmuebles_guard_recoverable_file before insert or update on public.fortius_inmuebles_formato_assets
for each row execute function public.fortius_inmuebles_guard_recoverable_file();
create trigger fortius_inmuebles_guard_recoverable_file before insert or update on public.fortius_inmuebles_signed_copies
for each row execute function public.fortius_inmuebles_guard_recoverable_file();

create index fortius_inmuebles_formato_assets_activos on public.fortius_inmuebles_formato_assets(draft_id,created_at) where deleted_at is null;
create index fortius_inmuebles_signed_copies_activas on public.fortius_inmuebles_signed_copies(emission_id,created_at desc) where deleted_at is null;

notify pgrst,'reload schema';
commit;
