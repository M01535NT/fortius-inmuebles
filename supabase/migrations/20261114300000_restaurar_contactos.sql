-- Prospectos y clientes eliminados se pueden restaurar desde Eliminados (13/11/2026, aprobado por el titular).
-- La base ya guarda la copia de cada registro eliminado (fortius_inmuebles_record_history); aquí solo se
-- amplía la lista de colecciones que el director puede restaurar. El resto de la función no cambia.
-- Al restaurar un prospecto se conserva la hora de su primera atención (si no, volvería como «sin atender»):
-- solo la función de restaurar marca la transacción para que el disparador no la toque.
begin;
select pg_advisory_xact_lock(781023);

create or replace function public.fortius_inmuebles_contact_timestamp() returns trigger
language plpgsql set search_path='' as $$
begin
  if coalesce(current_setting('fortius.restaurando', true), '') = 'on' then return new; end if;
  if new.collection='leads' then
    if tg_op='INSERT' then new.data:=new.data-'firstContactedAt';
    elsif old.data ? 'firstContactedAt' then new.data:=jsonb_set(new.data,'{firstContactedAt}',old.data->'firstContactedAt');
    elsif new.data ? 'firstContactedAt' then new.data:=jsonb_set(new.data,'{firstContactedAt}',to_jsonb(clock_timestamp())); end if;
  end if;
  return new;
end;$$;

create or replace function public.fortius_inmuebles_restore_record(p_history_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare h public.fortius_inmuebles_record_history; d jsonb; result jsonb;
begin
  if not public.fortius_inmuebles_is_admin() then raise sqlstate 'PT403' using message='Solo el administrador restaura registros'; end if;
  perform pg_advisory_xact_lock(781023);
  select * into h from public.fortius_inmuebles_record_history where id=p_history_id for update;
  if not found or h.action<>'DELETE' or h.restored_at is not null then raise sqlstate 'PT409' using message='La eliminación ya no está disponible'; end if;
  if h.collection not in ('propiedades','posts','notas','eventos','leads','clientes') then raise sqlstate 'PT400' using message='Esta colección no admite recuperación automática'; end if;
  if exists(select 1 from public.fortius_inmuebles_records where collection=h.collection and id=h.record_id)
    or exists(select 1 from public.fortius_inmuebles_record_history where collection=h.collection and record_id=h.record_id and created_at>h.created_at)
    then raise sqlstate 'PT409' using message='Existe un registro posterior; no se puede reemplazar'; end if;
  d:=h.snapshot;
  if h.collection='propiedades' then d:=jsonb_set(d,'{publicada}','false'); end if;
  if h.collection='posts' then d:=jsonb_set(d,'{estado}','"borrador"'); end if;
  -- Existing RPC keeps validation, references and monotonically increasing revisions.
  perform set_config('fortius.restaurando', 'on', true);
  result:=public.fortius_inmuebles_put_record(h.collection,h.record_id,d,null);
  perform set_config('fortius.restaurando', 'off', true);
  update public.fortius_inmuebles_record_history set restored_at=clock_timestamp() where id=h.id;
  return result;
end;$$;

commit;
