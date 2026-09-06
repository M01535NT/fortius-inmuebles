-- Incremental identity migration. Applied migrations 001/002 remain immutable.
-- Run with the migrator role during the coordinated application cutover.
begin;
select pg_advisory_xact_lock(781023);
lock table public.cota_records in access exclusive mode;

-- Fail atomically with a useful diagnosis before touching names or data.
do $$ begin
  if exists(select 1 from public.cota_records where collection='posts'
    and coalesce(data->>'slug','') !~ '^[a-z0-9]+(-[a-z0-9]+)*$') then
    raise exception 'Preflight: invalid legacy post slugs require editorial remediation';
  end if;
  if exists(select data->>'slug' from public.cota_records where collection='posts'
    group by data->>'slug' having count(*)>1) then
    raise exception 'Preflight: duplicate post slugs require editorial remediation';
  end if;
end $$;

do $migration$
declare item record; new_name text;
begin
  -- Relation OIDs, rows, grants, foreign keys and revision history are retained.
  for item in select c.relname from pg_class c where c.relnamespace='public'::regnamespace
    and c.relkind='r' and c.relname like 'cota\_%' escape '\' loop
    execute format('alter table public.%I rename to %I', item.relname, replace(item.relname,'cota_','mnt_'));
  end loop;
  for item in select c.conname,t.relname from pg_constraint c join pg_class t on t.oid=c.conrelid
    where t.relnamespace='public'::regnamespace and c.conname like 'cota\_%' escape '\' loop
    execute format('alter table public.%I rename constraint %I to %I',item.relname,item.conname,replace(item.conname,'cota_','mnt_'));
  end loop;
  for item in select c.relname from pg_class c where c.relnamespace='public'::regnamespace
    and c.relkind='i' and c.relname like 'cota\_%' escape '\' loop
    execute format('alter index public.%I rename to %I',item.relname,replace(item.relname,'cota_','mnt_'));
  end loop;
  for item in select p.oid,p.proname from pg_proc p where p.pronamespace='public'::regnamespace
    and p.proname like 'cota\_%' escape '\' loop
    new_name := replace(item.proname,'cota_','mnt_');
    execute format('alter function %s rename to %I',item.oid::regprocedure,new_name);
    -- Textual PL/pgSQL references must be rewritten explicitly after OID-preserving renames.
    execute replace(replace(pg_get_functiondef(item.oid),'cota_','mnt_'),'cota-','mnt-');
  end loop;
  for item in select schemaname,tablename,policyname from pg_policies
    where schemaname in ('public','storage') and policyname like 'cota\_%' escape '\' loop
    execute format('alter policy %I on %I.%I rename to %I',item.policyname,item.schemaname,item.tablename,replace(item.policyname,'cota_','mnt_'));
  end loop;
  for item in select t.tgname,c.relname from pg_trigger t join pg_class c on c.oid=t.tgrelid
    where c.relnamespace='public'::regnamespace and not t.tgisinternal and t.tgname like 'cota\_%' escape '\' loop
    execute format('alter trigger %I on public.%I rename to %I',item.tgname,item.relname,replace(item.tgname,'cota_','mnt_'));
  end loop;
end;
$migration$;

-- Retained recovery objects must remain excluded from all public projections.
-- This historical bucket exception is intentional and must survive the rename.
create or replace function public.mnt_public_url(u text) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(u ~ '^(https?://[^/[:space:]]+|/[^/])' and u !~ '[[:cntrl:]]'
    and u !~* '((cota|mnt)-(private|staging)|/api/admin/|/storage/v1/object/sign/)',false);
$$;

-- New buckets are provisioned before verified API copies. Never rewrite storage.objects
-- with SQL: its metadata is not the stored object. Old objects remain recovery evidence.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('mnt-staging','mnt-staging',false,20971520,array['image/jpeg','image/png','image/webp','image/gif','application/pdf','video/mp4','video/webm']),
 ('mnt-private','mnt-private',false,20971520,array['image/jpeg','image/png','image/webp','image/gif','application/pdf','video/mp4','video/webm']),
 ('mnt-public','mnt-public',true,20971520,array['image/jpeg','image/png','image/webp','image/gif','application/pdf','video/mp4','video/webm']);
alter policy mnt_storage_read on storage.objects to authenticated
  using (bucket_id in ('mnt-private','mnt-public') and (select public.mnt_is_staff()));

-- A stable public URL belongs to exactly one editorial record, including drafts.
alter table public.mnt_records add constraint mnt_post_slug_format
  check (collection <> 'posts' or coalesce(data->>'slug','') ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
create unique index mnt_post_slug_unique on public.mnt_records ((data->>'slug')) where collection='posts';
create function public.mnt_protect_post_slug() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.collection='posts' and (new.data->>'slug') is distinct from (old.data->>'slug') then
    raise sqlstate 'PT400' using message='El slug publicado es estable; no puede cambiarse';
  end if;
  return new;
end;
$$;
revoke all on function public.mnt_protect_post_slug() from public,anon,authenticated,service_role;
create trigger mnt_post_stable_slug before update on public.mnt_records
  for each row execute function public.mnt_protect_post_slug();

notify pgrst, 'reload schema';
commit;
