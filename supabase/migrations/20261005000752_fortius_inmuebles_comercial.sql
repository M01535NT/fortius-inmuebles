begin;
create table public.mnt_comercial_books (
 id uuid primary key default gen_random_uuid(), nombre text not null check(length(btrim(nombre)) between 1 and 160),
 data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<=1048576), version integer not null default 1 check(version>0),
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.mnt_comercial_revisions (
 book_id uuid not null references public.mnt_comercial_books(id),version integer not null,nombre text not null,data jsonb not null,
 created_by uuid not null references auth.users(id),created_at timestamptz not null default now(), primary key(book_id,version)
);
create table public.mnt_comercial_emissions (
 id uuid primary key,book_id uuid not null,book_version integer not null,snapshot jsonb not null,sha256 text not null check(sha256 ~ '^[0-9a-f]{64}$'),
 path text not null unique,created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),
 foreign key(book_id,book_version) references public.mnt_comercial_revisions(book_id,version),
 check(path=book_id::text||'/'||id::text||'.pdf')
);
alter table public.mnt_comercial_books enable row level security;
alter table public.mnt_comercial_revisions enable row level security;
alter table public.mnt_comercial_emissions enable row level security;
revoke all on public.mnt_comercial_books,public.mnt_comercial_revisions,public.mnt_comercial_emissions from public,anon,authenticated;
grant select,insert,update on public.mnt_comercial_books to authenticated;
grant select on public.mnt_comercial_revisions,public.mnt_comercial_emissions to authenticated;
grant select,insert on public.mnt_comercial_emissions to service_role;
grant select on public.mnt_comercial_books,public.mnt_comercial_revisions to service_role;
create policy comercial_read on public.mnt_comercial_books for select to authenticated using(public.mnt_is_admin());
create policy comercial_create on public.mnt_comercial_books for insert to authenticated with check(public.mnt_is_admin() and created_by=auth.uid() and version=1);
create policy comercial_update on public.mnt_comercial_books for update to authenticated using(public.mnt_is_admin()) with check(public.mnt_is_admin());
create policy comercial_revision_read on public.mnt_comercial_revisions for select to authenticated using(public.mnt_is_admin());
create policy comercial_emission_read on public.mnt_comercial_emissions for select to authenticated using(public.mnt_is_admin());

create function public.mnt_comercial_guard() returns trigger language plpgsql set search_path='' as $$
declare k text; row_data jsonb; prior jsonb; seen text[]; corrected text[]; reference text;
begin
 if TG_OP='UPDATE' then
  if new.id<>old.id or new.created_by<>old.created_by or new.created_at<>old.created_at then raise exception using errcode='PT403',message='Identidad inmutable'; end if;
  if new.version<>old.version+1 then raise exception using errcode='PT409',message='Versión obsoleta'; end if;
 end if;
 foreach k in array array['oportunidades','eventos','documentos'] loop
  if jsonb_typeof(new.data->k) is distinct from 'array' then raise exception using errcode='PT400',message='Registros inválidos';end if;
  if jsonb_array_length(new.data->k)>(case when k='oportunidades' then 1000 else 3000 end) then raise exception using errcode='PT400',message='Límite de registros';end if;
  seen=array[]::text[]; corrected=array[]::text[];
  for row_data in select value from jsonb_array_elements(new.data->k) loop
   if coalesce(row_data->>'id','') !~ '^[[:alnum:]_-]{1,80}$' or row_data->>'id'=any(seen) then raise exception using errcode='PT400',message='ID inválido o repetido';end if;
   reference=coalesce(row_data->>'anterior','');
   if reference<>'' then
    if reference=any(corrected) then raise exception using errcode='PT400',message='El anterior ya tiene una corrección';end if;
    if not(reference=any(seen)) or not exists(select 1 from jsonb_array_elements(new.data->k) p where p->>'id'=reference and p->>'oportunidad'=row_data->>'oportunidad') then raise exception using errcode='PT400',message='Corrección inválida';end if;
    corrected=array_append(corrected,reference);
   end if;
   seen=array_append(seen,row_data->>'id');
  end loop;
  if TG_OP='UPDATE' then
   for prior in select value from jsonb_array_elements(old.data->k) loop
    if k='oportunidades' then
     if not exists(select 1 from jsonb_array_elements(new.data->k) n where n->>'id'=prior->>'id' and n->>'segmento'=prior->>'segmento') then raise exception using errcode='PT403',message='Conservar oportunidad';end if;
    elsif not exists(select 1 from jsonb_array_elements(new.data->k) n where n=prior) then raise exception using errcode='PT403',message='Conservar historial';end if;
   end loop;
  end if;
 end loop;
 for row_data in select value from jsonb_array_elements(new.data->'oportunidades') loop
  reference=coalesce(row_data->'gestion'->>'expediente','');
  if reference<>'' and not exists(select 1 from public.mnt_expedientes e where e.id::text=reference) then raise exception using errcode='PT400',message='Expediente inexistente';end if;
 end loop;
 new.updated_at=now(); return new;
end;$$;
revoke all on function public.mnt_comercial_guard() from public,anon,authenticated;
create trigger comercial_guard before insert or update on public.mnt_comercial_books for each row execute function public.mnt_comercial_guard();
create function public.mnt_comercial_revision() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.mnt_comercial_revisions(book_id,version,nombre,data,created_by) values(new.id,new.version,new.nombre,new.data,coalesce(auth.uid(),new.created_by)); return new;
end;$$;
revoke all on function public.mnt_comercial_revision() from public,anon,authenticated;
create trigger comercial_revision after insert or update on public.mnt_comercial_books for each row execute function public.mnt_comercial_revision();
create function public.mnt_comercial_immutable() returns trigger language plpgsql set search_path='' as $$begin raise exception using errcode='PT403',message='Archivo inmutable';end;$$;
revoke all on function public.mnt_comercial_immutable() from public,anon,authenticated;
create trigger comercial_revisions_immutable before update or delete on public.mnt_comercial_revisions for each row execute function public.mnt_comercial_immutable();
create trigger comercial_emissions_immutable before update or delete on public.mnt_comercial_emissions for each row execute function public.mnt_comercial_immutable();
create function public.mnt_comercial_emission_guard() returns trigger language plpgsql set search_path='' as $$begin
 if not exists(select 1 from public.mnt_comercial_revisions r where r.book_id=new.book_id and r.version=new.book_version and r.data=new.snapshot->'data' and r.nombre=new.snapshot->>'nombre') then raise exception using errcode='PT409',message='Instantánea distinta';end if;
 if not exists(select 1 from public.mnt_staff s where s.user_id=new.created_by and s.active and s.role='admin') then raise exception using errcode='PT403',message='Administrador requerido';end if;
 return new;end;$$;
revoke all on function public.mnt_comercial_emission_guard() from public,anon,authenticated;
create trigger comercial_emission_guard before insert on public.mnt_comercial_emissions for each row execute function public.mnt_comercial_emission_guard();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('mnt-comercial','mnt-comercial',false,20971520,array['application/pdf']) on conflict(id) do nothing;
-- No browser storage policy: authenticated server authorizes metadata, then service client reads verified bytes.
commit;
