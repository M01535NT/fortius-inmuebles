-- Documentos del cliente (titular, 29/10/2026): un repositorio por expediente, sin categorías,
-- para escrituras, certificados, avalúos, identificaciones y demás. Los archivos viven en el
-- bucket privado fortius-inmuebles-expedientes; esta tabla guarda su registro e integridad.
-- Solo se lee con acceso al expediente; las escrituras pasan por el servidor, que comprueba ese
-- acceso antes de subir, renombrar, enviar a la papelera o restaurar. Nada se borra de golpe.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';

create table public.fortius_inmuebles_expediente_archivos (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.fortius_inmuebles_expedientes(id) on delete restrict,
  titulo text not null check (length(btrim(titulo)) between 1 and 240),
  nombre_original text not null check (length(nombre_original) between 1 and 255),
  mime text not null check (mime in ('application/pdf','image/jpeg','image/png','image/webp')),
  byte_length integer not null check (byte_length between 1 and 20971520),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  path text not null unique check (path ~ '^[a-f0-9-]+/cliente/[a-f0-9-]+\.(pdf|jpg|png|webp)$'),
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid,
  constraint fortius_inmuebles_expediente_archivos_borrado check ((deleted_at is null) = (deleted_by is null))
);
create index fortius_inmuebles_expediente_archivos_expediente on public.fortius_inmuebles_expediente_archivos(expediente_id, created_at);
alter table public.fortius_inmuebles_expediente_archivos enable row level security;
revoke all on public.fortius_inmuebles_expediente_archivos from anon, authenticated;
grant select on public.fortius_inmuebles_expediente_archivos to authenticated;
grant all on public.fortius_inmuebles_expediente_archivos to service_role;
create policy fortius_inmuebles_expediente_archivos_read on public.fortius_inmuebles_expediente_archivos
  for select to authenticated using (public.fortius_inmuebles_can_access_expediente(expediente_id));

notify pgrst, 'reload schema';
commit;
