-- FLX-01 · Bandeja y documentos sin operación (titular, 14/11/2026; RP-101 y RP-102).
-- Un archivo se guarda sin llenar ningún dato y después se liga a una persona, a un inmueble, a una
-- operación o a nada. Sin ninguna liga está en la Bandeja. Los archivos viven en el bucket privado
-- fortius-inmuebles-expedientes, bajo «bandeja/»; esta tabla guarda su registro y su huella.
--  · Es una tabla nueva: no cambia fortius_inmuebles_expediente_archivos ni ninguna guarda existente.
--  · La ve el director, el asesor que tiene el documento a su cargo y quien ve al cliente ligado.
--  · Solo el servidor escribe, después de comprobar el acceso; nada se borra de golpe (papelera).
--  · Nada de esta tabla llega al sitio público.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';

create table public.fortius_inmuebles_documentos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (length(btrim(titulo)) between 1 and 240),
  nombre_original text not null check (length(nombre_original) between 1 and 255),
  mime text not null check (mime in ('application/pdf','image/jpeg','image/png','image/webp')),
  byte_length integer not null check (byte_length between 1 and 20971520),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  path text not null unique check (path ~ '^bandeja/[a-f0-9-]+\.(pdf|jpg|png|webp)$'),
  tipo_documento text check (tipo_documento is null or tipo_documento ~ '^[a-z_]{1,40}$'),
  asesor_id text,
  asesor_collection text not null default 'asesores' check (asesor_collection='asesores'),
  cliente_id text,
  cliente_collection text not null default 'clientes' check (cliente_collection='clientes'),
  propiedad_slug text check (propiedad_slug is null or length(propiedad_slug) between 1 and 160),
  expediente_id uuid references public.fortius_inmuebles_expedientes(id) on delete restrict,
  archivado_el timestamptz,
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid,
  foreign key (asesor_collection,asesor_id) references public.fortius_inmuebles_records(collection,id) on delete restrict,
  foreign key (cliente_collection,cliente_id) references public.fortius_inmuebles_records(collection,id) on delete restrict,
  constraint fortius_inmuebles_documentos_borrado check ((deleted_at is null) = (deleted_by is null)),
  -- Archivado quiere decir ligado a algo; lo que no tiene liga sigue en la Bandeja.
  constraint fortius_inmuebles_documentos_archivado check (archivado_el is null or cliente_id is not null or propiedad_slug is not null or expediente_id is not null)
);
create index fortius_inmuebles_documentos_bandeja on public.fortius_inmuebles_documentos(asesor_id, created_at) where archivado_el is null and deleted_at is null;
create index fortius_inmuebles_documentos_cliente on public.fortius_inmuebles_documentos(cliente_id) where cliente_id is not null;
create index fortius_inmuebles_documentos_propiedad on public.fortius_inmuebles_documentos(propiedad_slug) where propiedad_slug is not null;
create index fortius_inmuebles_documentos_expediente on public.fortius_inmuebles_documentos(expediente_id) where expediente_id is not null;

alter table public.fortius_inmuebles_documentos enable row level security;
revoke all on public.fortius_inmuebles_documentos from anon, authenticated;
grant select on public.fortius_inmuebles_documentos to authenticated;
grant all on public.fortius_inmuebles_documentos to service_role;
create policy fortius_inmuebles_documentos_read on public.fortius_inmuebles_documentos
  for select to authenticated using (
    public.fortius_inmuebles_is_admin()
    or (asesor_id is not null and asesor_id = public.fortius_inmuebles_current_asesor_id())
    or (cliente_id is not null and public.fortius_inmuebles_can_access_client_id(cliente_id))
    or (expediente_id is not null and public.fortius_inmuebles_can_access_expediente(expediente_id))
  );

notify pgrst, 'reload schema';
commit;
