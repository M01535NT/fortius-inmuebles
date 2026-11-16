-- PN-02 · Bloque 7: registro de personas unidas (duplicados). Aditivo. Ningún folio cambia y la ficha origen no se borra.
-- La acción «Unir» (que reapunta asuntos, pendientes y notas en una transacción) llega con la pantalla de Personas (PN-03).
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(781023);

create table public.fortius_inmuebles_persona_uniones (
  persona_id text primary key,
  unida_en text not null check (unida_en <> persona_id),
  col text not null default 'clientes' check (col = 'clientes'),
  motivo text not null default '' check (length(motivo) <= 500),
  unida_por uuid not null default auth.uid() references auth.users (id),
  unida_el timestamptz not null default clock_timestamp(),
  foreign key (col, persona_id) references public.fortius_inmuebles_records (collection, id) on delete restrict,
  foreign key (col, unida_en) references public.fortius_inmuebles_records (collection, id) on delete restrict
);
alter table public.fortius_inmuebles_persona_uniones enable row level security;
revoke all on public.fortius_inmuebles_persona_uniones from anon, authenticated;
grant select on public.fortius_inmuebles_persona_uniones to authenticated;
grant all on public.fortius_inmuebles_persona_uniones to service_role;
create policy persona_uniones_read on public.fortius_inmuebles_persona_uniones for select to authenticated
  using ((select public.fortius_inmuebles_is_staff()));

-- Sin cadenas: la ficha destino no puede estar unida a otra, y la origen no puede ser destino de nadie.
create function public.fortius_inmuebles_union_sin_cadenas() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from public.fortius_inmuebles_persona_uniones where persona_id = new.unida_en)
     or exists (select 1 from public.fortius_inmuebles_persona_uniones where unida_en = new.persona_id) then
    raise sqlstate 'PT409' using message = 'Esa ficha ya está unida; une con la ficha final';
  end if;
  return new;
end; $$;
create trigger fortius_00_union_sin_cadenas before insert or update on public.fortius_inmuebles_persona_uniones
  for each row execute function public.fortius_inmuebles_union_sin_cadenas();

commit;
