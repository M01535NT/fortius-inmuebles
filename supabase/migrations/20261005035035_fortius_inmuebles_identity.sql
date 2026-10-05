-- Incremental identity cutover; prior applied migrations remain historical evidence.
-- Provision the new Storage buckets through the Storage API before applying.
begin;
select pg_advisory_xact_lock(781023);
do $preflight$
begin
  if to_regclass('public.mnt_records') is null then
    raise exception 'Expected source records table is missing';
  end if;
  if exists(select 1 from pg_class where relnamespace='public'::regnamespace and starts_with(relname,'fortius_inmuebles_'))
    or exists(select 1 from pg_proc where pronamespace='public'::regnamespace and starts_with(proname,'fortius_inmuebles_')) then
    raise exception 'Destination identity already exists; reconcile before proceeding';
  end if;
  -- Receipts and registered Storage metadata need a separate verified data migration.
  -- The observed production inventory is empty for both; never silently alter them.
  if to_regclass('public.mnt_file_uploads') is not null then
    if exists(select 1 from public.mnt_file_uploads) then
      raise exception 'Nonempty file receipts require a verified Storage migration';
    end if;
  end if;
  if exists(select 1 from public.mnt_records where collection='archivos' and data->>'bucket' in ('mnt-private','mnt-public')) then
    raise exception 'Registered Storage files require verified metadata migration';
  end if;
  if exists(select 1 from storage.objects where bucket_id ~ '^(mnt|cota)-') then
    raise exception 'Source Storage must be copied and verified before cutover';
  end if;
end;
$preflight$;
lock table public.mnt_records in access exclusive mode;
do $rename$
declare item record; new_name text; definition text;
begin
  for item in select relname from pg_class where relnamespace='public'::regnamespace and relkind='r' and starts_with(relname,'mnt_') loop
    execute format('alter table public.%I rename to %I',item.relname,replace(item.relname,'mnt_','fortius_inmuebles_'));
  end loop;
  for item in select c.conname,t.relname from pg_constraint c join pg_class t on t.oid=c.conrelid where t.relnamespace='public'::regnamespace and starts_with(c.conname,'mnt_') loop
    execute format('alter table public.%I rename constraint %I to %I',item.relname,item.conname,replace(item.conname,'mnt_','fortius_inmuebles_'));
  end loop;
  for item in select relname from pg_class where relnamespace='public'::regnamespace and relkind='i' and starts_with(relname,'mnt_') loop
    execute format('alter index public.%I rename to %I',item.relname,replace(item.relname,'mnt_','fortius_inmuebles_'));
  end loop;
  -- Rename every function first, then rewrite textual references. OIDs and ACLs survive.
  for item in select oid,proname from pg_proc where pronamespace='public'::regnamespace and starts_with(proname,'mnt_') loop
    execute format('alter function %s rename to %I',item.oid::regprocedure,replace(item.proname,'mnt_','fortius_inmuebles_'));
  end loop;
  for item in select oid from pg_proc where pronamespace='public'::regnamespace and starts_with(proname,'fortius_inmuebles_') loop
    definition := replace(replace(pg_get_functiondef(item.oid),'mnt_','fortius_inmuebles_'),'mnt-','fortius-inmuebles-');
    definition := replace(definition,'(cota|mnt)','(cota|mnt|fortius-inmuebles)');
    execute definition;
  end loop;
  for item in select schemaname,tablename,policyname from pg_policies where schemaname='public' and starts_with(policyname,'mnt_') loop
    execute format('alter policy %I on %I.%I rename to %I',item.policyname,item.schemaname,item.tablename,replace(item.policyname,'mnt_','fortius_inmuebles_'));
  end loop;
  for item in select t.tgname,c.relname from pg_trigger t join pg_class c on c.oid=t.tgrelid where c.relnamespace='public'::regnamespace and not t.tgisinternal and starts_with(t.tgname,'mnt_') loop
    execute format('alter trigger %I on public.%I rename to %I',item.tgname,item.relname,replace(item.tgname,'mnt_','fortius_inmuebles_'));
  end loop;
  -- Managed Storage policy ownership is retained. Recreate with exactly the same roles,
  -- command and predicates, changing only function and bucket identities.
  for item in select * from pg_policies where schemaname='storage' and tablename='objects' and starts_with(policyname,'mnt_') loop
    execute format('drop policy %I on storage.objects',item.policyname);
    execute format('create policy %I on storage.objects as %s for %s to %s%s%s',
      replace(item.policyname,'mnt_','fortius_inmuebles_'),item.permissive,item.cmd,
      (select string_agg(quote_ident(r),',') from unnest(item.roles) r),
      case when item.qual is null then '' else ' using ('||replace(replace(item.qual,'mnt_','fortius_inmuebles_'),'mnt-','fortius-inmuebles-')||')' end,
      case when item.with_check is null then '' else ' with check ('||replace(replace(item.with_check,'mnt_','fortius_inmuebles_'),'mnt-','fortius-inmuebles-')||')' end);
  end loop;
  -- No receipt rows exist. Rewrite its bucket constraint to the new identity.
  for item in select c.conname,t.relname,pg_get_constraintdef(c.oid) definition from pg_constraint c join pg_class t on t.oid=c.conrelid
    where t.relnamespace='public'::regnamespace and t.relname='fortius_inmuebles_file_uploads' and c.contype='c' and pg_get_constraintdef(c.oid) like '%mnt-%' loop
    execute format('alter table public.%I drop constraint %I',item.relname,item.conname);
    execute format('alter table public.%I add constraint %I %s',item.relname,item.conname,replace(item.definition,'mnt-','fortius-inmuebles-'));
  end loop;
end;
$rename$;
-- Read-only bridge for the currently serving build. Retire after production verification.
create function public.mnt_public_records(p_collection text) returns table(data jsonb)
language sql stable set search_path='' as $$ select * from public.fortius_inmuebles_public_records(p_collection); $$;
revoke all on function public.mnt_public_records(text) from public,anon,authenticated,service_role;
grant execute on function public.mnt_public_records(text) to anon,authenticated;
notify pgrst,'reload schema';
commit;
