-- Panel por asuntos · bloque 1: folios y piezas comunes (docs/operacion/modelo-de-datos-panel.md, secciones 3 y 4.13).
-- Autorizado por el titular el 16/11/2026. Aditivo: el panel provisional y el sitio público siguen igual.
--  · Libro de folios: los folios EXP- y FORTIUS- no se repiten ni se reutilizan, aunque se borre lo que los usó.
--    Lo comparten el panel provisional (expedientes, propiedades) y el panel nuevo (asuntos, inmuebles).
--  · Piezas comunes de las tablas nuevas: registros que solo se agregan, versión con conflicto 409 y siguiente folio.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(781023);

-- Registros que solo se agregan (folios, historial).
create function public.fortius_inmuebles_solo_agregar() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise sqlstate 'PT403' using message = 'Este registro no se cambia ni se borra';
end; $$;

-- Versión: quien guarda manda la versión que vio; si otra persona guardó antes, 409. Después sube sola.
create function public.fortius_inmuebles_panel_version() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.version is distinct from old.version then
    raise sqlstate 'PT409' using message = 'Alguien más cambió esto; vuelve a cargar';
  end if;
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end; $$;

-- Libro de folios.
create table public.fortius_inmuebles_folios (
  serie text not null check (serie in ('EXP', 'FORTIUS', 'REC')),
  anio integer not null default 0,            -- 0 = serie sin año
  numero bigint not null check (numero > 0),
  folio text not null unique,
  tabla text,                                 -- informativo: dónde se usó
  entidad_id text,                            -- informativo; sobrevive a la entidad
  emitido_por uuid,
  emitido_el timestamptz not null default clock_timestamp(),
  primary key (serie, anio, numero)
);
alter table public.fortius_inmuebles_folios enable row level security;
revoke all on public.fortius_inmuebles_folios from anon, authenticated;
grant select on public.fortius_inmuebles_folios to authenticated;   -- nadie lo escribe desde la app
grant all on public.fortius_inmuebles_folios to service_role;
create policy fortius_inmuebles_folios_read on public.fortius_inmuebles_folios
  for select to authenticated using ((select public.fortius_inmuebles_is_admin()));
create trigger fortius_solo_agregar before update or delete on public.fortius_inmuebles_folios
  for each row execute function public.fortius_inmuebles_solo_agregar();

-- Lo que ya existe queda reservado: asuntos del provisional (también los borrados) e inmuebles (vivos y en su historial).
insert into public.fortius_inmuebles_folios (serie, numero, folio, tabla, entidad_id)
  select 'EXP', substring(upper(btrim(folio)) from 5)::bigint, upper(btrim(folio)), 'expedientes', id::text
    from public.fortius_inmuebles_expedientes
   where upper(btrim(folio)) ~ '^EXP-[0-9]{1,15}$'
  on conflict do nothing;
insert into public.fortius_inmuebles_folios (serie, numero, folio, tabla, entidad_id)
  select distinct on (code) 'FORTIUS', substring(code from 9)::bigint, code, 'propiedades', id
    from (
      select upper(btrim(data->>'codigo')) as code, id from public.fortius_inmuebles_records where collection = 'propiedades'
      union all
      select upper(btrim(snapshot->>'codigo')), record_id from public.fortius_inmuebles_record_history where collection = 'propiedades'
    ) c
   where code ~ '^FORTIUS-[0-9]{1,15}$'
  on conflict do nothing;

-- Provisional · asunto: mismo nombre y mismo disparador; ahora también mira el libro y anota el folio nuevo.
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
    insert into public.fortius_inmuebles_folios (serie, numero, folio, tabla, entidad_id, emitido_por)
    values ('EXP', substring(f from 5)::bigint, f, 'expedientes', new.id::text, auth.uid())
    on conflict do nothing;
  end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_assign_expediente_folio() from public, anon, authenticated, service_role;

-- Provisional · inmueble: el siguiente código también mira el libro.
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

-- Provisional · cada código de inmueble que se guarda queda reservado.
create function public.fortius_inmuebles_reservar_codigo_inmueble() returns trigger
language plpgsql security definer set search_path = '' as $$
declare code text := upper(btrim(new.data->>'codigo'));
begin
  if new.collection = 'propiedades' and code ~ '^FORTIUS-[0-9]{1,15}$' then
    insert into public.fortius_inmuebles_folios (serie, numero, folio, tabla, entidad_id, emitido_por)
    values ('FORTIUS', substring(code from 9)::bigint, code, 'propiedades', new.id, auth.uid())
    on conflict do nothing;
  end if;
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_reservar_codigo_inmueble() from public, anon, authenticated, service_role;
create trigger fortius_zz_reservar_codigo_inmueble after insert or update of data on public.fortius_inmuebles_records
  for each row execute function public.fortius_inmuebles_reservar_codigo_inmueble();

-- Panel nuevo · folio de una fila nueva (asuntos: EXP; inmuebles: FORTIUS). Siempre lo pone la base y no cambia.
-- Uso: before insert or update of folio ... execute function fortius_inmuebles_panel_folio('EXP').
create function public.fortius_inmuebles_panel_folio() returns trigger
language plpgsql security definer set search_path = '' as $$
declare serie text := tg_argv[0]; n bigint; s text;
begin
  if tg_op = 'UPDATE' then
    if new.folio is distinct from old.folio then
      raise sqlstate 'PT409' using message = 'El folio no cambia';
    end if;
    return new;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(781023);
  if serie = 'EXP' then
    select greatest(
      coalesce((select max(numero) from public.fortius_inmuebles_folios where serie = 'EXP' and anio = 0), 0),
      coalesce((select max(substring(upper(btrim(folio)) from 5)::numeric)
                  from public.fortius_inmuebles_expedientes where upper(btrim(folio)) ~ '^EXP-[0-9]+$'), 0)) + 1 into n;
    s := n::text;
    new.folio := 'EXP-' || lpad(s, greatest(6, length(s)), '0');
  elsif serie = 'FORTIUS' then
    new.folio := public.fortius_inmuebles_next_property_code();
    n := substring(new.folio from 9)::bigint;
  else
    raise exception 'Serie de folio desconocida: %', serie;
  end if;
  insert into public.fortius_inmuebles_folios (serie, numero, folio, tabla, entidad_id, emitido_por)
  values (serie, n, new.folio, tg_table_name, new.id::text, auth.uid());
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_panel_folio() from public, anon, authenticated, service_role;

notify pgrst, 'reload schema';
commit;
