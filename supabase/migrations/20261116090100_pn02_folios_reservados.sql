-- PN-02 · Bloque 2: folios reservados (RP-107). Los folios los asigna la base al guardar, son únicos y no se reutilizan:
-- aunque un asunto o un inmueble se borre, su número queda anotado aquí y el siguiente siempre es mayor.
-- Conserva los folios actuales (EXP- y FORTIUS-, migración 20261014031535), el mismo candado y los mismos disparadores.
-- Solo números de 1 a 15 cifras entran al libro (AUD-04, menor 1); lo demás se conserva como está y no cuenta.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(781023);

-- Registros que solo se agregan (folios, historial, notas internas).
create function public.fortius_inmuebles_solo_agregar() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise sqlstate 'PT403' using message = 'Este registro no se cambia ni se borra';
end; $$;

create table public.fortius_inmuebles_folios (
  serie text not null check (serie in ('EXP', 'FORTIUS', 'REC')),
  anio integer not null default 0,            -- 0 = serie sin año; REC usa el año
  numero bigint not null check (numero > 0),
  folio text not null unique,
  entidad_id text,                            -- informativo; sobrevive a la entidad
  emitido_por uuid,
  emitido_el timestamptz not null default clock_timestamp(),
  primary key (serie, anio, numero)
);
alter table public.fortius_inmuebles_folios enable row level security;
revoke all on public.fortius_inmuebles_folios from anon, authenticated;
grant select on public.fortius_inmuebles_folios to authenticated;   -- nadie inserta, cambia ni borra desde la app
grant all on public.fortius_inmuebles_folios to service_role;
-- El libro completo solo lo ve dirección (AUD-04, menor 7).
create policy fortius_inmuebles_folios_read on public.fortius_inmuebles_folios
  for select to authenticated using ((select public.fortius_inmuebles_is_admin()));
create trigger fortius_solo_agregar before update or delete on public.fortius_inmuebles_folios
  for each row execute function public.fortius_inmuebles_solo_agregar();

-- Respaldo de lo que ya existe: asuntos (incluidos los marcados como borrados) e inmuebles (vivos y en el historial).
insert into public.fortius_inmuebles_folios (serie, numero, folio, entidad_id)
  select 'EXP', substring(upper(btrim(folio)) from 5)::bigint, upper(btrim(folio)), id::text
    from public.fortius_inmuebles_expedientes
   where upper(btrim(folio)) ~ '^EXP-[0-9]{1,15}$'
  on conflict do nothing;
insert into public.fortius_inmuebles_folios (serie, numero, folio, entidad_id)
  select distinct on (code) 'FORTIUS', substring(code from 9)::bigint, code, id
    from (
      select upper(btrim(data->>'codigo')) as code, id from public.fortius_inmuebles_records where collection = 'propiedades'
      union all
      select upper(btrim(snapshot->>'codigo')), record_id from public.fortius_inmuebles_record_history where collection = 'propiedades'
    ) c
   where code ~ '^FORTIUS-[0-9]{1,15}$'
  on conflict do nothing;

-- Asunto: mismo nombre y mismo disparador (fortius_00_assign_expediente_folio); ahora también mira los reservados y anota el nuevo.
-- Un folio puesto a mano que ya se usó en otro asunto se rechaza (AUD-04, menor 2).
create or replace function public.fortius_inmuebles_assign_expediente_folio()
returns trigger language plpgsql security definer set search_path = '' as $$
declare n bigint; s text; f text; dueno text;
begin
  perform pg_catalog.pg_advisory_xact_lock(781023);
  if nullif(btrim(new.folio), '') is null then
    select greatest(
      coalesce((select max(numero) from public.fortius_inmuebles_folios where serie = 'EXP' and anio = 0), 0),
      coalesce((select max(substring(upper(btrim(folio)) from 5)::numeric)
                  from public.fortius_inmuebles_expedientes where upper(btrim(folio)) ~ '^EXP-[0-9]+$'), 0)) + 1 into n;
    s := n::text;
    new.folio := 'EXP-' || lpad(s, greatest(6, length(s)), '0');
  end if;
  f := upper(btrim(new.folio));
  if f ~ '^EXP-[0-9]{1,15}$' then
    select entidad_id into dueno from public.fortius_inmuebles_folios where folio = f;
    if found and dueno is distinct from new.id::text then
      raise sqlstate 'PT409' using message = 'Ese folio ya se usó; deja el folio vacío para que se asigne solo';
    end if;
    insert into public.fortius_inmuebles_folios (serie, numero, folio, entidad_id, emitido_por)
    values ('EXP', substring(f from 5)::bigint, f, new.id::text, auth.uid())
    on conflict do nothing;
  end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_assign_expediente_folio() from public, anon, authenticated, service_role;

-- Inmueble: el siguiente código también mira los reservados.
create or replace function public.fortius_inmuebles_next_property_code()
returns text language plpgsql set search_path = '' as $$
declare n numeric; s text;
begin
  perform pg_catalog.pg_advisory_xact_lock(781023);
  select greatest(
    coalesce((select max(numero) from public.fortius_inmuebles_folios where serie = 'FORTIUS' and anio = 0), 0),
    coalesce((select max(substring(code from 9)::numeric)
      from (
        select upper(btrim(data->>'codigo')) as code from public.fortius_inmuebles_records where collection = 'propiedades'
        union all
        select upper(btrim(snapshot->>'codigo')) from public.fortius_inmuebles_record_history where collection = 'propiedades'
      ) codes where code ~ '^FORTIUS-[0-9]+$'), 0)) + 1 into n;
  s := n::text;
  return 'FORTIUS-' || lpad(s, greatest(6, length(s)), '0');
end; $$;
revoke all on function public.fortius_inmuebles_next_property_code() from public, anon, authenticated, service_role;

-- Cada código de inmueble que se guarda queda reservado.
create function public.fortius_inmuebles_reservar_codigo_inmueble() returns trigger
language plpgsql security definer set search_path = '' as $$
declare code text := upper(btrim(new.data->>'codigo'));
begin
  if new.collection = 'propiedades' and code ~ '^FORTIUS-[0-9]{1,15}$' then
    insert into public.fortius_inmuebles_folios (serie, numero, folio, entidad_id, emitido_por)
    values ('FORTIUS', substring(code from 9)::bigint, code, new.id, auth.uid())
    on conflict do nothing;
  end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_reservar_codigo_inmueble() from public, anon, authenticated, service_role;
create trigger fortius_zz_reservar_codigo_inmueble after insert or update of data on public.fortius_inmuebles_records
  for each row execute function public.fortius_inmuebles_reservar_codigo_inmueble();

-- El folio de un asunto no cambia. (Borrar sigue como hoy: el número queda reservado arriba.)
create function public.fortius_inmuebles_folio_inmutable() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.folio is distinct from old.folio then
    raise sqlstate 'PT409' using message = 'El folio no cambia';
  end if;
  return new;
end; $$;
create trigger fortius_00a_folio_inmutable before update of folio on public.fortius_inmuebles_expedientes
  for each row execute function public.fortius_inmuebles_folio_inmutable();

commit;
