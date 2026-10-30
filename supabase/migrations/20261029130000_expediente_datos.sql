-- Datos del expediente (titular, 29/10/2026): los datos del cliente y del inmueble que se
-- confirman una sola vez (nombre, folio real, superficies, escritura…) y de ahí llenan todos los
-- formatos. Cada dato guarda su valor, si está propuesto o confirmado y de qué documento salió.
-- Se lee con acceso al expediente; lo escribe el servidor tras comprobar ese acceso, con versión
-- para no pisar cambios de otra persona.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';

create table public.fortius_inmuebles_expediente_datos (
  expediente_id uuid primary key references public.fortius_inmuebles_expedientes(id) on delete restrict,
  datos jsonb not null default '{}'::jsonb check (jsonb_typeof(datos)='object' and pg_column_size(datos) <= 262144),
  version bigint not null default 1 check (version >= 1),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table public.fortius_inmuebles_expediente_datos enable row level security;
revoke all on public.fortius_inmuebles_expediente_datos from anon, authenticated;
grant select on public.fortius_inmuebles_expediente_datos to authenticated;
grant all on public.fortius_inmuebles_expediente_datos to service_role;
create policy fortius_inmuebles_expediente_datos_read on public.fortius_inmuebles_expediente_datos
  for select to authenticated using (public.fortius_inmuebles_can_access_expediente(expediente_id));

notify pgrst, 'reload schema';
commit;
