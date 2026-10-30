-- Lectura con IA de los documentos del cliente (IA-01, titular, 29/10/2026). Cada archivo guarda
-- el estado de su lectura y el tipo de documento que se reconoció; cada lectura queda anotada con
-- quién la pidió, el modelo, los tokens y su costo aproximado, para el tope mensual (IA-02).
-- Lo leído entra como propuesta en los datos del expediente; nada llega a un formato sin que una
-- persona lo confirme. Solo el servidor escribe; se lee con acceso al expediente.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';

alter table public.fortius_inmuebles_expediente_archivos
  add column lectura_estado text not null default 'pendiente' check (lectura_estado in ('pendiente','leyendo','leido','error')),
  add column lectura_error text check (lectura_error is null or length(lectura_error) <= 300),
  add column leido_el timestamptz,
  add column tipo_documento text check (tipo_documento is null or tipo_documento ~ '^[a-z_]{1,40}$');

create table public.fortius_inmuebles_ia_lecturas (
  id uuid primary key default gen_random_uuid(),
  archivo_id uuid not null references public.fortius_inmuebles_expediente_archivos(id) on delete restrict,
  expediente_id uuid not null references public.fortius_inmuebles_expedientes(id) on delete restrict,
  requested_by uuid not null references auth.users(id),
  modelo text not null check (length(modelo) between 1 and 80),
  estado text not null check (estado in ('leido','error')),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  costo_usd numeric(10,4) not null default 0 check (costo_usd >= 0),
  datos_propuestos integer not null default 0 check (datos_propuestos >= 0),
  created_at timestamptz not null default now()
);
create index fortius_inmuebles_ia_lecturas_mes on public.fortius_inmuebles_ia_lecturas(created_at);
create index fortius_inmuebles_ia_lecturas_archivo on public.fortius_inmuebles_ia_lecturas(archivo_id, created_at);
alter table public.fortius_inmuebles_ia_lecturas enable row level security;
revoke all on public.fortius_inmuebles_ia_lecturas from anon, authenticated;
grant select on public.fortius_inmuebles_ia_lecturas to authenticated;
grant all on public.fortius_inmuebles_ia_lecturas to service_role;
create policy fortius_inmuebles_ia_lecturas_read on public.fortius_inmuebles_ia_lecturas
  for select to authenticated using (public.fortius_inmuebles_can_access_expediente(expediente_id));

notify pgrst, 'reload schema';
commit;
