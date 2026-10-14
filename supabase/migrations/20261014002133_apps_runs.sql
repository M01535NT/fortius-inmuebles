begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
create table public.fortius_inmuebles_app_runs (
 id uuid primary key default gen_random_uuid(), slug text not null check(length(slug) between 1 and 80),
 title text not null check(length(title) between 1 and 160), input jsonb not null default '{}' check(jsonb_typeof(input)='object' and octet_length(input::text)<=2000000),
 result jsonb check(result is null or (jsonb_typeof(result)='object' and octet_length(result::text)<=2000000)),
 context jsonb not null default '{}' check(jsonb_typeof(context)='object'),
 owner_id uuid not null default auth.uid(), expediente_id uuid references public.fortius_inmuebles_expedientes(id) on delete restrict,
 version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create index fortius_apps_owner on public.fortius_inmuebles_app_runs(owner_id,slug,updated_at desc);
create index fortius_apps_expediente on public.fortius_inmuebles_app_runs(expediente_id);
alter table public.fortius_inmuebles_app_runs enable row level security;
revoke all on public.fortius_inmuebles_app_runs from anon,authenticated;
grant select,insert,update on public.fortius_inmuebles_app_runs to authenticated;
grant all on public.fortius_inmuebles_app_runs to service_role;
create policy apps_read on public.fortius_inmuebles_app_runs for select to authenticated using (
 public.fortius_inmuebles_is_staff() and case when expediente_id is not null then public.fortius_inmuebles_can_access_expediente(expediente_id) else owner_id=auth.uid() or public.fortius_inmuebles_is_admin() end
);
create policy apps_create on public.fortius_inmuebles_app_runs for insert to authenticated with check (
 public.fortius_inmuebles_is_staff() and owner_id=auth.uid() and (expediente_id is null or public.fortius_inmuebles_can_access_expediente(expediente_id))
);
create policy apps_update on public.fortius_inmuebles_app_runs for update to authenticated using (
 public.fortius_inmuebles_is_staff() and case when expediente_id is not null then public.fortius_inmuebles_can_access_expediente(expediente_id) else owner_id=auth.uid() or public.fortius_inmuebles_is_admin() end
) with check (public.fortius_inmuebles_is_staff() and case when expediente_id is not null then public.fortius_inmuebles_can_access_expediente(expediente_id) else owner_id=auth.uid() or public.fortius_inmuebles_is_admin() end);
create function public.fortius_inmuebles_guard_app_run() returns trigger language plpgsql set search_path='' as $$
declare e public.fortius_inmuebles_expedientes; begin
 if tg_op='UPDATE' then
  if new.id<>old.id or new.owner_id<>old.owner_id or new.slug<>old.slug or new.context<>old.context or new.expediente_id is distinct from old.expediente_id or new.created_at<>old.created_at then raise sqlstate 'PT400' using message='Identidad del trabajo inmutable'; end if;
  if new.version<>old.version+1 then raise sqlstate 'PT409' using message='Version desactualizada'; end if;
 else
  if new.version<>1 or new.deleted_at is not null then raise sqlstate 'PT400' using message='Version inicial invalida'; end if;
 end if;
 if (new.context->>'expedienteId') is distinct from new.expediente_id::text then raise sqlstate 'PT400' using message='Contexto invalido'; end if;
 if new.expediente_id is not null then
  select * into e from public.fortius_inmuebles_expedientes where id=new.expediente_id for share;
  if not found or e.deleted_at is not null or not public.fortius_inmuebles_can_access_expediente(e.id) then raise sqlstate 'PT403' using message='Expediente no disponible'; end if;
  if (new.context ? 'clienteId' and new.context->>'clienteId' is distinct from e.cliente_id) or (new.context ? 'inmuebleId' and new.context->>'inmuebleId' is distinct from e.propiedad_slug) then raise sqlstate 'PT400' using message='Referencias inconsistentes'; end if;
 end if;
 if new.context ? 'clienteId' and not public.fortius_inmuebles_can_access_client_id(new.context->>'clienteId') then raise sqlstate 'PT403' using message='Cliente no disponible'; end if;
 if new.context ? 'inmuebleId' and not exists(select 1 from public.fortius_inmuebles_records where collection='propiedades' and id=new.context->>'inmuebleId') then raise sqlstate 'PT400' using message='Inmueble no disponible'; end if;
 new.updated_at:=clock_timestamp(); return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_app_run() from public,anon,authenticated;
create trigger apps_run_guard before insert or update on public.fortius_inmuebles_app_runs for each row execute function public.fortius_inmuebles_guard_app_run();
create table public.fortius_inmuebles_app_run_versions (
 run_id uuid not null references public.fortius_inmuebles_app_runs(id) on delete restrict, version integer not null,
 snapshot jsonb not null, actor_id uuid, recorded_at timestamptz not null default now(), primary key(run_id,version)
);
alter table public.fortius_inmuebles_app_run_versions enable row level security;
revoke all on public.fortius_inmuebles_app_run_versions from anon,authenticated;
grant select on public.fortius_inmuebles_app_run_versions to authenticated;
grant all on public.fortius_inmuebles_app_run_versions to service_role;
create policy app_versions_read on public.fortius_inmuebles_app_run_versions for select to authenticated using (exists(select 1 from public.fortius_inmuebles_app_runs r where r.id=run_id and r.deleted_at is null));
create function public.fortius_inmuebles_record_app_version() returns trigger language plpgsql security definer set search_path='' as $$ begin
 insert into public.fortius_inmuebles_app_run_versions(run_id,version,snapshot,actor_id) values(new.id,new.version,to_jsonb(new),auth.uid()); return new;
end; $$;
revoke all on function public.fortius_inmuebles_record_app_version() from public,anon,authenticated;
create trigger app_version_record after insert or update on public.fortius_inmuebles_app_runs for each row execute function public.fortius_inmuebles_record_app_version();
create table public.fortius_inmuebles_app_files (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null default auth.uid(), expediente_id uuid references public.fortius_inmuebles_expedientes(id),
 name text not null check(length(name) between 1 and 160), path text not null unique, mime text not null check(mime in ('application/pdf','image/jpeg','image/png')), size_bytes integer not null check(size_bytes between 1 and 20971520), sha256 text not null, created_at timestamptz not null default now()
);
alter table public.fortius_inmuebles_app_files enable row level security;
revoke all on public.fortius_inmuebles_app_files from anon,authenticated;
grant select on public.fortius_inmuebles_app_files to authenticated;
grant all on public.fortius_inmuebles_app_files to service_role;
create policy app_files_read on public.fortius_inmuebles_app_files for select to authenticated using (public.fortius_inmuebles_is_staff() and case when expediente_id is not null then public.fortius_inmuebles_can_access_expediente(expediente_id) else owner_id=auth.uid() or public.fortius_inmuebles_is_admin() end);
create table public.fortius_inmuebles_app_shares (
 id uuid primary key default gen_random_uuid(), file_id uuid not null references public.fortius_inmuebles_app_files(id), token_hash text not null unique, owner_id uuid not null default auth.uid(), expires_at timestamptz not null, revoked boolean not null default false, created_at timestamptz not null default now()
);
alter table public.fortius_inmuebles_app_shares enable row level security;
revoke all on public.fortius_inmuebles_app_shares from anon,authenticated;
grant select,insert on public.fortius_inmuebles_app_shares to authenticated;
grant update(revoked) on public.fortius_inmuebles_app_shares to authenticated;
grant all on public.fortius_inmuebles_app_shares to service_role;
create policy app_shares_read on public.fortius_inmuebles_app_shares for select to authenticated using (public.fortius_inmuebles_is_staff() and (owner_id=auth.uid() or public.fortius_inmuebles_is_admin()) and exists(select 1 from public.fortius_inmuebles_app_files f where f.id=file_id));
create policy app_shares_add on public.fortius_inmuebles_app_shares for insert to authenticated with check (public.fortius_inmuebles_is_staff() and owner_id=auth.uid() and not revoked and expires_at>now() and expires_at<=now()+interval '7 days' and exists(select 1 from public.fortius_inmuebles_app_files f where f.id=file_id));
create policy app_shares_revoke on public.fortius_inmuebles_app_shares for update to authenticated using (public.fortius_inmuebles_is_staff() and (owner_id=auth.uid() or public.fortius_inmuebles_is_admin())) with check (revoked);
-- A receipt is claimed once, in the same transaction/row lock as generic file binding.
-- App provenance cannot be recycled into an independent scope after reassignment.
create function public.fortius_apps_claim_upload(p_path text,p_expediente uuid default null) returns void
language plpgsql security definer set search_path='' as $$
declare receipt public.fortius_inmuebles_file_uploads; binding text;
begin
 if not public.fortius_inmuebles_is_staff() then raise sqlstate 'PT403' using message='Personal activo requerido'; end if;
 if p_expediente is not null and not public.fortius_inmuebles_can_access_expediente(p_expediente) then raise sqlstate 'PT403' using message='Expediente no disponible'; end if;
 binding:='apps:'||coalesce(p_expediente::text,'independent');
 select * into receipt from public.fortius_inmuebles_file_uploads where bucket='fortius-inmuebles-private' and path=p_path for update;
 if not found or receipt.uploaded_by is distinct from auth.uid() or (receipt.record_id is not null and receipt.record_id<>binding) then raise sqlstate 'PT403' using message='Carga ajena o vinculada a otro contexto'; end if;
 if receipt.record_id is null then update public.fortius_inmuebles_file_uploads set record_id=binding where id=receipt.id; end if;
end; $$;
revoke all on function public.fortius_apps_claim_upload(text,uuid) from public,anon;
grant execute on function public.fortius_apps_claim_upload(text,uuid) to authenticated;
create function public.fortius_apps_upload_visible(p_path text) returns boolean language sql stable security definer set search_path='' as $$
 select public.fortius_inmuebles_is_staff() and exists(select 1 from public.fortius_inmuebles_file_uploads r where r.bucket='fortius-inmuebles-private' and r.path=p_path and r.uploaded_by=auth.uid() and
 case when r.record_id='apps:independent' then true when r.record_id ~ '^apps:[a-f0-9-]{36}$' then public.fortius_inmuebles_can_access_expediente(substring(r.record_id from 6)::uuid) else false end);
$$;
revoke all on function public.fortius_apps_upload_visible(text) from public,anon;
grant execute on function public.fortius_apps_upload_visible(text) to authenticated;
create policy apps_private_upload_read on storage.objects for select to authenticated using(bucket_id='fortius-inmuebles-private' and public.fortius_apps_upload_visible(name));
notify pgrst,'reload schema';
commit;
