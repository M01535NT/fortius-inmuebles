-- Private operational controls for each expediente.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';

alter table public.fortius_inmuebles_expedientes
  add column etapa text not null default 'captacion'
    check (etapa in ('captacion','documentacion','comercializacion','negociacion','cierre','cerrado')),
  add column fecha_objetivo date,
  add column checklist jsonb not null default '{}'::jsonb
    check (jsonb_typeof(checklist)='object' and octet_length(checklist::text)<=2000);

-- The API controls allowed keys and values; the database enforces them for direct writes too.
create function public.fortius_inmuebles_check_expediente_checklist(value jsonb) returns boolean
language sql immutable set search_path='' as $$
  select jsonb_typeof(value)='object'
    and not exists (
      select 1 from jsonb_each_text(value) item
      where item.key not in ('identidad','titulo','gravamenes','predial','servicios','intermediacion','avaluo')
        or item.value not in ('pendiente','recibido','no_aplica')
    );
$$;
alter table public.fortius_inmuebles_expedientes
  add constraint fortius_inmuebles_expediente_checklist_valid
    check (public.fortius_inmuebles_check_expediente_checklist(checklist));

create table public.fortius_inmuebles_expediente_actividad (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.fortius_inmuebles_expedientes(id) on delete restrict,
  tipo text not null check (tipo in ('nota','cambio')),
  descripcion text not null check (length(btrim(descripcion)) between 1 and 1000),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);
create index fortius_inmuebles_expediente_actividad_parent
  on public.fortius_inmuebles_expediente_actividad(expediente_id,created_at desc,id desc);
alter table public.fortius_inmuebles_expediente_actividad enable row level security;
revoke all on public.fortius_inmuebles_expediente_actividad from anon,authenticated;
grant select,insert on public.fortius_inmuebles_expediente_actividad to authenticated;
grant all on public.fortius_inmuebles_expediente_actividad to service_role;
create policy fortius_inmuebles_expediente_actividad_read
  on public.fortius_inmuebles_expediente_actividad for select to authenticated
  using (public.fortius_inmuebles_can_access_expediente(expediente_id));
create policy fortius_inmuebles_expediente_actividad_note
  on public.fortius_inmuebles_expediente_actividad for insert to authenticated
  with check (tipo='nota' and created_by=auth.uid()
    and public.fortius_inmuebles_can_access_expediente(expediente_id));

create function public.fortius_inmuebles_log_expediente_operation() returns trigger
language plpgsql security definer set search_path='' as $$
declare details text;
begin
  if new.etapa is not distinct from old.etapa
    and new.fecha_objetivo is not distinct from old.fecha_objetivo
    and new.checklist is not distinct from old.checklist then return new; end if;
  if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida'; end if;
  details := concat_ws('; ',
    case when new.etapa is distinct from old.etapa then 'Etapa: ' || old.etapa || ' → ' || new.etapa end,
    case when new.fecha_objetivo is distinct from old.fecha_objetivo then
      'Fecha objetivo: ' || coalesce(old.fecha_objetivo::text,'sin fecha') || ' → ' || coalesce(new.fecha_objetivo::text,'sin fecha') end,
    case when new.checklist is distinct from old.checklist then 'Checklist documental actualizado' end);
  insert into public.fortius_inmuebles_expediente_actividad
    (expediente_id,tipo,descripcion,created_by)
    values (new.id,'cambio',details,auth.uid());
  return new;
end;
$$;
revoke all on function public.fortius_inmuebles_log_expediente_operation() from public,anon,authenticated;
create trigger fortius_inmuebles_log_expediente_operation
  after update on public.fortius_inmuebles_expedientes
  for each row execute function public.fortius_inmuebles_log_expediente_operation();

notify pgrst,'reload schema';
commit;
