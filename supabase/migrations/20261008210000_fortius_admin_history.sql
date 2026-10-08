begin;
select pg_advisory_xact_lock(781023);

create table public.fortius_inmuebles_record_history (
  id uuid primary key default gen_random_uuid(),
  collection text not null,
  record_id text not null,
  action text not null check(action in ('INSERT','UPDATE','DELETE')),
  actor_id uuid,
  snapshot jsonb not null,
  version bigint not null,
  changed_fields text[] not null default '{}',
  created_at timestamptz not null default clock_timestamp(),
  restored_at timestamptz
);
create index fortius_record_history_lookup on public.fortius_inmuebles_record_history(collection,record_id,created_at desc);
alter table public.fortius_inmuebles_record_history enable row level security;
revoke all on public.fortius_inmuebles_record_history from public,anon,authenticated;
grant select on public.fortius_inmuebles_record_history to authenticated;
create policy fortius_record_history_admin on public.fortius_inmuebles_record_history for select to authenticated using(public.fortius_inmuebles_is_admin());

create function public.fortius_inmuebles_capture_history() returns trigger
language plpgsql security definer set search_path='' as $$
declare r public.fortius_inmuebles_records; changed text[]:='{}';
begin
  if tg_op='DELETE' then r:=old; else r:=new; end if;
  if tg_op='UPDATE' then
    select coalesce(array_agg(k order by k),'{}') into changed from
      (select jsonb_object_keys(old.data) k union select jsonb_object_keys(new.data) k) keys
      where old.data->k is distinct from new.data->k;
  end if;
  insert into public.fortius_inmuebles_record_history(collection,record_id,action,actor_id,snapshot,version,changed_fields)
    values(r.collection,r.id,tg_op,auth.uid(),r.data,r.version,changed);
  return null;
end;$$;
revoke all on function public.fortius_inmuebles_capture_history() from public,anon,authenticated;
create trigger fortius_capture_record_history after insert or update or delete on public.fortius_inmuebles_records
  for each row execute function public.fortius_inmuebles_capture_history();

create function public.fortius_inmuebles_restore_record(p_history_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare h public.fortius_inmuebles_record_history; d jsonb; result jsonb;
begin
  if not public.fortius_inmuebles_is_admin() then raise sqlstate 'PT403' using message='Solo el administrador restaura registros'; end if;
  perform pg_advisory_xact_lock(781023);
  select * into h from public.fortius_inmuebles_record_history where id=p_history_id for update;
  if not found or h.action<>'DELETE' or h.restored_at is not null then raise sqlstate 'PT409' using message='La eliminación ya no está disponible'; end if;
  if h.collection not in ('propiedades','posts','notas','eventos') then raise sqlstate 'PT400' using message='Esta colección no admite recuperación automática'; end if;
  if exists(select 1 from public.fortius_inmuebles_records where collection=h.collection and id=h.record_id)
    or exists(select 1 from public.fortius_inmuebles_record_history where collection=h.collection and record_id=h.record_id and created_at>h.created_at)
    then raise sqlstate 'PT409' using message='Existe un registro posterior; no se puede reemplazar'; end if;
  d:=h.snapshot;
  if h.collection='propiedades' then d:=jsonb_set(d,'{publicada}','false'); end if;
  if h.collection='posts' then d:=jsonb_set(d,'{estado}','"borrador"'); end if;
  -- Existing RPC keeps validation, references and monotonically increasing revisions.
  result:=public.fortius_inmuebles_put_record(h.collection,h.record_id,d,null);
  update public.fortius_inmuebles_record_history set restored_at=clock_timestamp() where id=h.id;
  return result;
end;$$;
revoke all on function public.fortius_inmuebles_restore_record(uuid) from public,anon;
grant execute on function public.fortius_inmuebles_restore_record(uuid) to authenticated;

create function public.fortius_inmuebles_contact_timestamp() returns trigger
language plpgsql set search_path='' as $$
begin
  if new.collection='leads' then
    if tg_op='INSERT' then new.data:=new.data-'firstContactedAt';
    elsif old.data ? 'firstContactedAt' then new.data:=jsonb_set(new.data,'{firstContactedAt}',old.data->'firstContactedAt');
    elsif new.data ? 'firstContactedAt' then new.data:=jsonb_set(new.data,'{firstContactedAt}',to_jsonb(clock_timestamp())); end if;
  end if;
  return new;
end;$$;
revoke all on function public.fortius_inmuebles_contact_timestamp() from public,anon,authenticated;
create trigger fortius_contact_timestamp before insert or update on public.fortius_inmuebles_records
  for each row execute function public.fortius_inmuebles_contact_timestamp();
commit;
