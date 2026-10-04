-- Expedientes privados de Fortius. Apply after 008; never expose through public projections.
begin;
select pg_advisory_xact_lock(781023);

create table public.mnt_adviser_accounts (
  user_id uuid primary key references public.mnt_staff(user_id) on delete cascade,
  asesor_id text not null unique,
  created_at timestamptz not null default now()
);
-- The generic record table has a composite key; fix the collection.
alter table public.mnt_adviser_accounts add column asesor_collection text not null default 'asesores' check (asesor_collection='asesores');
alter table public.mnt_adviser_accounts add constraint mnt_adviser_account_reference
  foreign key (asesor_collection,asesor_id) references public.mnt_records(collection,id) on delete restrict;
alter table public.mnt_adviser_accounts enable row level security;
revoke all on public.mnt_adviser_accounts from anon,authenticated;
grant select,insert,update,delete on public.mnt_adviser_accounts to authenticated;
grant all on public.mnt_adviser_accounts to service_role;

create function public.mnt_is_admin() returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.mnt_staff where user_id=auth.uid() and active and role='admin');
$$;
create function public.mnt_current_asesor_id() returns text
language sql stable security definer set search_path='' as $$
  select a.asesor_id from public.mnt_adviser_accounts a
    join public.mnt_staff s on s.user_id=a.user_id
    where a.user_id=auth.uid() and s.active and s.role='editor';
$$;
revoke all on function public.mnt_is_admin(),public.mnt_current_asesor_id() from public,anon;
grant execute on function public.mnt_is_admin(),public.mnt_current_asesor_id() to authenticated,service_role;
create policy mnt_adviser_accounts_read on public.mnt_adviser_accounts for select to authenticated
  using (public.mnt_is_admin() or user_id=auth.uid());
create policy mnt_adviser_accounts_insert on public.mnt_adviser_accounts for insert to authenticated
  with check (public.mnt_is_admin());
create policy mnt_adviser_accounts_update on public.mnt_adviser_accounts for update to authenticated
  using (public.mnt_is_admin()) with check (public.mnt_is_admin());
create policy mnt_adviser_accounts_delete on public.mnt_adviser_accounts for delete to authenticated
  using (public.mnt_is_admin());

create function public.mnt_can_access_client_id(p_client_id text) returns boolean
language sql stable security definer set search_path='' as $$
  select public.mnt_is_admin() or exists (
    select 1 from public.mnt_records r where r.collection='clientes' and r.id=p_client_id
      and r.data->>'asesorId'=public.mnt_current_asesor_id());
$$;
create function public.mnt_record_visible(c text,d jsonb) returns boolean
language plpgsql stable security definer set search_path='' as $$
begin
  if not public.mnt_is_staff() then return false; end if;
  if public.mnt_is_admin() then return true; end if;
  if c in ('clientes','leads') then
    return coalesce(d->>'asesorId','')<>'' and d->>'asesorId'=public.mnt_current_asesor_id();
  end if;
  if c='archivos' then
    if d->>'visibility'='public' then return true; end if;
    return coalesce(d->>'clienteId','')<>'' and public.mnt_can_access_client_id(d->>'clienteId');
  end if;
  if c in ('eventos','tareas','notas') and coalesce(d->>'clienteId','')<>'' then
    return public.mnt_can_access_client_id(d->>'clienteId');
  end if;
  return true;
end;
$$;
revoke all on function public.mnt_can_access_client_id(text),public.mnt_record_visible(text,jsonb) from public,anon;
grant execute on function public.mnt_can_access_client_id(text),public.mnt_record_visible(text,jsonb) to authenticated,service_role;
drop policy mnt_records_staff_read on public.mnt_records;
create policy mnt_records_scoped_read on public.mnt_records for select to authenticated
  using (public.mnt_record_visible(collection,data));

create function public.mnt_guard_private_record() returns trigger
language plpgsql security definer set search_path='' as $$
declare previous_visible boolean; next_visible boolean;
begin
  -- Server-side public lead intake runs with service_role and no user token.
  if auth.uid() is null then return coalesce(new,old); end if;
  if tg_op<>'INSERT' and old.collection in ('clientes','leads','archivos') then
    previous_visible := public.mnt_record_visible(old.collection,old.data);
    if not previous_visible then raise sqlstate 'PT403' using message='Registro ajeno'; end if;
  end if;
  if tg_op<>'DELETE' and new.collection in ('clientes','leads','archivos') then
    next_visible := public.mnt_record_visible(new.collection,new.data);
    if not next_visible then raise sqlstate 'PT403' using message='Registro ajeno'; end if;
    if tg_op='UPDATE' and old.data->>'asesorId' is distinct from new.data->>'asesorId'
      and not public.mnt_is_admin() then raise sqlstate 'PT403' using message='Solo el administrador reasigna'; end if;
  end if;
  return coalesce(new,old);
end;
$$;
revoke all on function public.mnt_guard_private_record() from public,anon,authenticated;
create trigger mnt_guard_private_record before insert or update or delete on public.mnt_records
  for each row execute function public.mnt_guard_private_record();

create table public.mnt_expedientes (
  id uuid primary key default gen_random_uuid(),
  cliente_id text not null,
  cliente_collection text not null default 'clientes' check (cliente_collection='clientes'),
  asesor_id text not null,
  asesor_collection text not null default 'asesores' check (asesor_collection='asesores'),
  propiedad_slug text,
  folio text not null unique check (length(btrim(folio)) between 1 and 80),
  operacion text not null default 'venta' check (operacion in ('venta','renta','administracion','otra')),
  unidad text not null default '',
  version bigint not null default 1 check (version>0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (cliente_collection,cliente_id) references public.mnt_records(collection,id) on delete restrict,
  foreign key (asesor_collection,asesor_id) references public.mnt_records(collection,id) on delete restrict
);
create index mnt_expedientes_cliente on public.mnt_expedientes(cliente_id);
create index mnt_expedientes_asesor on public.mnt_expedientes(asesor_id);
alter table public.mnt_expedientes enable row level security;
revoke all on public.mnt_expedientes from anon,authenticated;
grant select,insert,update on public.mnt_expedientes to authenticated;
grant all on public.mnt_expedientes to service_role;

create function public.mnt_can_access_expediente(p_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select public.mnt_is_admin() or exists (
    select 1 from public.mnt_expedientes e where e.id=p_id
      and e.asesor_id=public.mnt_current_asesor_id()
      and public.mnt_can_access_client_id(e.cliente_id));
$$;
revoke all on function public.mnt_can_access_expediente(uuid) from public,anon;
grant execute on function public.mnt_can_access_expediente(uuid) to authenticated,service_role;
create policy mnt_expedientes_read on public.mnt_expedientes for select to authenticated
  using (public.mnt_can_access_expediente(id));
create policy mnt_expedientes_insert on public.mnt_expedientes for insert to authenticated
  with check (public.mnt_is_admin() or
    (asesor_id=public.mnt_current_asesor_id() and public.mnt_can_access_client_id(cliente_id)));
create policy mnt_expedientes_update on public.mnt_expedientes for update to authenticated
  using (public.mnt_can_access_expediente(id))
  with check (public.mnt_is_admin() or
    (asesor_id=public.mnt_current_asesor_id() and public.mnt_can_access_client_id(cliente_id)));

create table public.mnt_formato_drafts (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.mnt_expedientes(id) on delete restrict,
  formato_id text not null check (formato_id in ('01','02','03','04A','04B','04C','04D','04E','04F','04G','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19')),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data)='object' and octet_length(data::text)<=250000),
  version bigint not null default 1 check (version>0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index mnt_formato_drafts_expediente on public.mnt_formato_drafts(expediente_id);
alter table public.mnt_formato_drafts enable row level security;
revoke all on public.mnt_formato_drafts from anon,authenticated;
grant select,insert,update on public.mnt_formato_drafts to authenticated;
grant all on public.mnt_formato_drafts to service_role;
create policy mnt_formato_drafts_read on public.mnt_formato_drafts for select to authenticated
  using (public.mnt_can_access_expediente(expediente_id));
create policy mnt_formato_drafts_insert on public.mnt_formato_drafts for insert to authenticated
  with check (public.mnt_can_access_expediente(expediente_id));
create policy mnt_formato_drafts_update on public.mnt_formato_drafts for update to authenticated
  using (public.mnt_can_access_expediente(expediente_id))
  with check (public.mnt_can_access_expediente(expediente_id));

create function public.mnt_guard_expediente_update() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.version<>old.version+1 then raise sqlstate 'PT409' using message='Versión obsoleta'; end if;
  if (new.cliente_id is distinct from old.cliente_id or new.asesor_id is distinct from old.asesor_id)
    and not public.mnt_is_admin() then raise sqlstate 'PT403' using message='Solo el administrador reasigna'; end if;
  new.updated_at:=clock_timestamp();
  return new;
end;
$$;
create function public.mnt_guard_formato_update() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.version<>old.version+1 then raise sqlstate 'PT409' using message='Versión obsoleta'; end if;
  if new.expediente_id is distinct from old.expediente_id or new.formato_id is distinct from old.formato_id then
    raise sqlstate 'PT403' using message='La identidad del documento no cambia';
  end if;
  new.updated_at:=clock_timestamp();
  return new;
end;
$$;
revoke all on function public.mnt_guard_expediente_update(),public.mnt_guard_formato_update() from public,anon,authenticated;
create trigger mnt_guard_expediente_update before update on public.mnt_expedientes
  for each row execute function public.mnt_guard_expediente_update();
create trigger mnt_guard_formato_update before update on public.mnt_formato_drafts
  for each row execute function public.mnt_guard_formato_update();

create table public.mnt_formato_emissions (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.mnt_formato_drafts(id) on delete restrict,
  draft_version bigint not null default 1 check (draft_version>0),
  snapshot jsonb not null check (jsonb_typeof(snapshot)='object' and octet_length(snapshot::text)<=250000),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  path text not null unique check (path ~ '^[a-f0-9-]+/[a-f0-9-]+\.pdf$'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index mnt_formato_emissions_draft on public.mnt_formato_emissions(draft_id,created_at desc);
alter table public.mnt_formato_emissions enable row level security;
revoke all on public.mnt_formato_emissions from anon,authenticated;
grant select on public.mnt_formato_emissions to authenticated;
grant all on public.mnt_formato_emissions to service_role;
create function public.mnt_can_access_draft(p_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.mnt_formato_drafts d where d.id=p_id
    and public.mnt_can_access_expediente(d.expediente_id));
$$;
revoke all on function public.mnt_can_access_draft(uuid) from public,anon;
grant execute on function public.mnt_can_access_draft(uuid) to authenticated,service_role;
create policy mnt_formato_emissions_read on public.mnt_formato_emissions for select to authenticated
  using (public.mnt_can_access_draft(draft_id));

create function public.mnt_can_access_emission(p_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.mnt_formato_emissions e where e.id=p_id
    and public.mnt_can_access_draft(e.draft_id));
$$;
revoke all on function public.mnt_can_access_emission(uuid) from public,anon;
grant execute on function public.mnt_can_access_emission(uuid) to authenticated,service_role;
create table public.mnt_signed_copies (
  id uuid primary key default gen_random_uuid(),
  emission_id uuid not null references public.mnt_formato_emissions(id) on delete restrict,
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  path text not null unique check (path ~ '^[a-f0-9-]+/[a-f0-9-]+\.pdf$'),
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index mnt_signed_copies_emission on public.mnt_signed_copies(emission_id,created_at desc);
alter table public.mnt_signed_copies enable row level security;
revoke all on public.mnt_signed_copies from anon,authenticated;
grant select on public.mnt_signed_copies to authenticated;
grant all on public.mnt_signed_copies to service_role;
create policy mnt_signed_copies_read on public.mnt_signed_copies for select to authenticated
  using (public.mnt_can_access_emission(emission_id));

create function public.mnt_private_path_visible(p_path text) returns boolean
language sql stable security definer set search_path='' as $$
  select public.mnt_is_admin() or exists (
    select 1 from public.mnt_records r where r.collection='archivos' and r.data->>'path'=p_path
      and public.mnt_record_visible(r.collection,r.data));
$$;
revoke all on function public.mnt_private_path_visible(text) from public,anon;
grant execute on function public.mnt_private_path_visible(text) to authenticated,service_role;
drop policy mnt_storage_read on storage.objects;
create policy mnt_storage_read on storage.objects for select to authenticated
  using ((bucket_id='mnt-public' and public.mnt_is_staff()) or
    (bucket_id='mnt-private' and public.mnt_private_path_visible(name)));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
  ('mnt-expedientes','mnt-expedientes',false,20971520,array['image/jpeg','image/png','image/webp','application/pdf']);

notify pgrst, 'reload schema';
commit;
