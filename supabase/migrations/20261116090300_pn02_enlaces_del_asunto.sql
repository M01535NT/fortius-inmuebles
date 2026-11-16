-- PN-02 · Bloque 4: el asunto une personas (con su papel) e inmuebles (RP-106). Aditivo.
-- Papeles: los del boceto más copropietario y apoderado (decisión 5 de AUD-02).
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(781023);

create table public.fortius_inmuebles_asunto_personas (
  asunto_id uuid not null references public.fortius_inmuebles_expedientes (id) on delete restrict,
  persona_id text not null,
  persona_collection text not null default 'clientes' check (persona_collection = 'clientes'),
  papel text not null check (papel in ('vende', 'compra', 'pone_en_renta', 'renta', 'copropietario', 'apoderado', 'aliado', 'notaria', 'banco', 'abogado', 'otro')),
  principal boolean not null default false,
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  retirado_el timestamptz,
  primary key (asunto_id, persona_id, papel),
  foreign key (persona_collection, persona_id) references public.fortius_inmuebles_records (collection, id) on delete restrict
);
create index on public.fortius_inmuebles_asunto_personas (persona_id);
alter table public.fortius_inmuebles_asunto_personas enable row level security;
revoke all on public.fortius_inmuebles_asunto_personas from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_asunto_personas to authenticated;
grant all on public.fortius_inmuebles_asunto_personas to service_role;
create policy asunto_personas_read on public.fortius_inmuebles_asunto_personas for select to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(asunto_id));
-- Para sumar a alguien al asunto hay que ver el asunto y además poder ver a esa persona (AUD-04, I5):
-- así nadie se da acceso a una ficha ajena colgándola de su asunto.
create policy asunto_personas_insert on public.fortius_inmuebles_asunto_personas for insert to authenticated
  with check (creado_por = (select auth.uid()) and public.fortius_inmuebles_puede_ver_asunto(asunto_id)
              and ((select public.fortius_inmuebles_is_admin()) or public.fortius_inmuebles_can_access_client_id(persona_id)));
-- Quitar a alguien es marcar retirado_el; no se borra.
create policy asunto_personas_update on public.fortius_inmuebles_asunto_personas for update to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(asunto_id))
  with check (public.fortius_inmuebles_puede_ver_asunto(asunto_id)
              and ((select public.fortius_inmuebles_is_admin()) or public.fortius_inmuebles_can_access_client_id(persona_id)));

create table public.fortius_inmuebles_asunto_inmuebles (
  asunto_id uuid not null references public.fortius_inmuebles_expedientes (id) on delete restrict,
  inmueble_id text not null,
  inmueble_collection text not null default 'propiedades' check (inmueble_collection = 'propiedades'),
  relacion text not null default 'objeto' check (relacion in ('objeto', 'visto', 'descartado', 'comparable')),
  nota text not null default '' check (length(nota) <= 500),
  creado_por uuid default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  retirado_el timestamptz,
  primary key (asunto_id, inmueble_id),
  foreign key (inmueble_collection, inmueble_id) references public.fortius_inmuebles_records (collection, id) on delete restrict
);
create index on public.fortius_inmuebles_asunto_inmuebles (inmueble_id);
alter table public.fortius_inmuebles_asunto_inmuebles enable row level security;
revoke all on public.fortius_inmuebles_asunto_inmuebles from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_asunto_inmuebles to authenticated;
grant all on public.fortius_inmuebles_asunto_inmuebles to service_role;
-- Los inmuebles los ve todo el equipo; aquí solo se cuida que el asunto sea visible.
create policy asunto_inmuebles_read on public.fortius_inmuebles_asunto_inmuebles for select to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(asunto_id));
create policy asunto_inmuebles_insert on public.fortius_inmuebles_asunto_inmuebles for insert to authenticated
  with check (creado_por = (select auth.uid()) and public.fortius_inmuebles_puede_ver_asunto(asunto_id));
create policy asunto_inmuebles_update on public.fortius_inmuebles_asunto_inmuebles for update to authenticated
  using (public.fortius_inmuebles_puede_ver_asunto(asunto_id)) with check (public.fortius_inmuebles_puede_ver_asunto(asunto_id));

commit;
