-- Incremental upgrade of applied001. No content, membership or public projection changes.
begin;

-- Match001's RPC serialization before taking the migration table lock.
select pg_advisory_xact_lock(781023);
lock table public.cota_records in access exclusive mode;

-- Tombstones retain only identity + latest revision, never deleted record data.
-- Deliberately no FK: removing a record must not reset its concurrency identity.
create table public.cota_record_revisions (
  collection text not null,
  id text not null,
  last_version bigint not null check (last_version between 1 and 9007199254740991),
  primary key (collection, id)
);
alter table public.cota_record_revisions enable row level security;
revoke all on public.cota_record_revisions from public, anon, authenticated, service_role;

-- Preserve the exact current versions and valid opening drafts, as well as JSON and dates.
insert into public.cota_record_revisions(collection,id,last_version)
  select collection,id,version from public.cota_records;

-- Run before row locks for every DML path, including privileged BFF INSERTs.
-- This keeps duplicate INSERT's ledger->record locking from racing UPDATE's
-- record->ledger locking. Existing RPCs acquire the same reentrant lock.
create function public.cota_lock_record_writes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(781023);
  return null;
end;
$$;
revoke all on function public.cota_lock_record_writes() from public, anon, authenticated, service_role;
create trigger cota_record_write_lock before insert or update or delete on public.cota_records
  for each statement execute function public.cota_lock_record_writes();

create function public.cota_assign_record_revision() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and (new.collection,new.id) is distinct from (old.collection,old.id) then
    raise sqlstate 'PT400' using message='La identidad del registro no se puede cambiar';
  end if;
  insert into public.cota_record_revisions as revisions(collection,id,last_version)
    values(new.collection,new.id,1)
    on conflict (collection,id) do update set last_version=revisions.last_version+1
      where revisions.last_version < 9007199254740991
    returning last_version into new.version;
  if not found then
    raise sqlstate 'PT409' using message='Se agotó la revisión segura de este registro';
  end if;
  return new;
end;
$$;
revoke all on function public.cota_assign_record_revision() from public, anon, authenticated, service_role;
create trigger cota_record_revision before insert or update on public.cota_records
  for each row execute function public.cota_assign_record_revision();

--001's grants, conditional PUT/DELETE, validation, reference guards and BFF
-- signatures remain unchanged. Unacknowledged/rolled-back writes roll back the
-- ledger too; every committed revision survives future record deletion.
-- Cutoff:001 did not retain history for IDs already absent before this migration.
-- Their historical revisions cannot be reconstructed; see README deployment gate.
commit;
