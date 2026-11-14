-- Preferencias por usuario en el servidor (UX-02 y UX-05, RP-14 y RP-20). Siguen a la persona en
-- cualquier equipo: lo leído de la bandeja «Para ti» y, con UX-02, densidad, letra, tema,
-- columnas, vistas guardadas, fijados, recientes y secciones de Hoy. Cada quien lee, crea y
-- actualiza solo su fila; nadie la borra (se va con la cuenta). Aditiva: no toca tablas existentes.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';

create table public.fortius_inmuebles_user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 65536),
  version integer not null default 1 check (version >= 1),
  updated_at timestamptz not null default now()
);
alter table public.fortius_inmuebles_user_preferences enable row level security;
revoke all on public.fortius_inmuebles_user_preferences from public, anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_user_preferences to authenticated;
grant all on public.fortius_inmuebles_user_preferences to service_role;
create policy fortius_inmuebles_user_preferences_read on public.fortius_inmuebles_user_preferences
  for select to authenticated using (user_id = (select auth.uid()) and public.fortius_inmuebles_is_staff());
create policy fortius_inmuebles_user_preferences_insert on public.fortius_inmuebles_user_preferences
  for insert to authenticated with check (user_id = (select auth.uid()) and public.fortius_inmuebles_is_staff());
create policy fortius_inmuebles_user_preferences_update on public.fortius_inmuebles_user_preferences
  for update to authenticated using (user_id = (select auth.uid()) and public.fortius_inmuebles_is_staff())
  with check (user_id = (select auth.uid()) and public.fortius_inmuebles_is_staff());

notify pgrst, 'reload schema';
commit;
