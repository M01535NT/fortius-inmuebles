-- Trusted upload receipts cannot be created through the generic records RPC.
begin;
select pg_advisory_xact_lock(781023);
create table public.mnt_file_uploads (
  id uuid primary key default gen_random_uuid(),
  bucket text not null check (bucket in ('mnt-private','mnt-public')),
  path text not null,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  record_id text,
  created_at timestamptz not null default now(),
  unique(bucket,path),
  check (path ~ '^[a-f0-9-]+/[a-f0-9-]+\.(jpg|png|webp|gif|pdf|mp4|webm)$'),
  check (split_part(path,'/',1)=uploaded_by::text)
);
alter table public.mnt_file_uploads enable row level security;
revoke all on public.mnt_file_uploads from public,anon,authenticated,service_role;
grant select,insert on public.mnt_file_uploads to service_role;

create function public.mnt_guard_upload_receipt() returns trigger
language plpgsql set search_path='' as $$
begin
  if tg_op='DELETE' or (tg_op='UPDATE' and
    (old.record_id is not null or new.record_id is null or
     (to_jsonb(old)-'record_id') is distinct from (to_jsonb(new)-'record_id'))) then
    raise sqlstate 'PT403' using message='La procedencia de un archivo es inmutable';
  end if;
  return new;
end;
$$;
revoke all on function public.mnt_guard_upload_receipt() from public,anon,authenticated,service_role;
create trigger mnt_guard_upload_receipt before update or delete on public.mnt_file_uploads
for each row execute function public.mnt_guard_upload_receipt();

create or replace function public.mnt_guard_private_record() returns trigger
language plpgsql security definer set search_path='' as $$
declare receipt public.mnt_file_uploads;
begin
  -- Public lead intake has no user JWT; file writes still require server provenance.
  if auth.uid() is not null then
    if tg_op<>'INSERT' and not public.mnt_record_visible(old.collection,old.data) then
      raise sqlstate 'PT403' using message='Registro ajeno';
    end if;
    if tg_op<>'DELETE' and not public.mnt_record_visible(new.collection,new.data) then
      raise sqlstate 'PT403' using message='Registro ajeno';
    end if;
    if tg_op='UPDATE' and not public.mnt_is_admin() and
      ((new.collection in ('clientes','leads') and old.data->>'asesorId' is distinct from new.data->>'asesorId') or
       (new.collection in ('archivos','eventos','tareas','notas') and
        nullif(old.data->>'clienteId','') is distinct from nullif(new.data->>'clienteId',''))) then
      raise sqlstate 'PT403' using message='Solo el administrador reasigna o desvincula';
    end if;
  end if;
  if tg_op<>'DELETE' and new.collection='archivos' then
    if tg_op='UPDATE' and
      (old.data->>'bucket' is distinct from new.data->>'bucket' or
       old.data->>'path' is distinct from new.data->>'path' or
       old.data->>'visibility' is distinct from new.data->>'visibility') then
      raise sqlstate 'PT403' using message='La ruta y privacidad del archivo son inmutables';
    end if;
    if tg_op='INSERT' and coalesce(new.data->>'path','')<>'' then
      select * into receipt from public.mnt_file_uploads
        where bucket=new.data->>'bucket' and path=new.data->>'path' for update;
      -- Keep the deployed administrator upload route compatible during rollout.
      -- Only an active admin can attest an existing Storage object under their
      -- own UUID prefix; editors must use the validated server completion receipt.
      if receipt.id is null and public.mnt_is_admin()
        and split_part(new.data->>'path','/',1)=auth.uid()::text
        and exists(select 1 from storage.objects o where o.bucket_id=new.data->>'bucket' and o.name=new.data->>'path') then
        insert into public.mnt_file_uploads(bucket,path,uploaded_by)
          values(new.data->>'bucket',new.data->>'path',auth.uid()) returning * into receipt;
      end if;
      if receipt.id is null or receipt.record_id is not null or auth.uid() is distinct from receipt.uploaded_by
        or (new.data->>'visibility'='public') is distinct from (receipt.bucket='mnt-public') then
        raise sqlstate 'PT403' using message='Carga no verificada o ya vinculada';
      end if;
      update public.mnt_file_uploads set record_id=new.id where id=receipt.id;
    end if;
  end if;
  return coalesce(new,old);
end;
$$;

create or replace function public.mnt_private_path_visible(p_path text) returns boolean
language sql stable security definer set search_path='' as $$
  select public.mnt_is_staff() and (public.mnt_is_admin() or exists (
    select 1 from public.mnt_file_uploads u join public.mnt_records r
      on r.collection='archivos' and r.id=u.record_id
    where u.bucket='mnt-private' and u.path=p_path
      and r.data->>'bucket'=u.bucket and r.data->>'path'=u.path
      and r.data->>'visibility'='private' and public.mnt_record_visible(r.collection,r.data)
  ));
$$;
-- Receipts retain their bound record ID after metadata deletion. Never recycle.
-- Legacy files without a trusted receipt remain admin-only until reuploaded.
commit;
