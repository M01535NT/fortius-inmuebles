-- Panel nuevo: el folio de asuntos e inmuebles se podía pedir pero no emitir.
-- En panel_01, la función del disparador llamaba «serie» a una variable con el mismo nombre que la columna
-- de fortius_inmuebles_folios; PostgreSQL rechaza esa ambigüedad y ningún asunto ni inmueble se podía crear.
-- Se reemplaza la función con la variable renombrada; hace lo mismo que antes.
begin;

create or replace function public.fortius_inmuebles_panel_folio() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_serie text := tg_argv[0]; n bigint; s text;
begin
  if tg_op = 'UPDATE' then
    if new.folio is distinct from old.folio then
      raise sqlstate 'PT409' using message = 'El folio no cambia';
    end if;
    return new;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(781023);
  if v_serie = 'EXP' then
    select greatest(
      coalesce((select max(f.numero) from public.fortius_inmuebles_folios f where f.serie = 'EXP' and f.anio = 0), 0),
      coalesce((select max(substring(upper(btrim(e.folio)) from 5)::numeric)
                  from public.fortius_inmuebles_expedientes e where upper(btrim(e.folio)) ~ '^EXP-[0-9]+$'), 0)) + 1 into n;
    s := n::text;
    new.folio := 'EXP-' || lpad(s, greatest(6, length(s)), '0');
  elsif v_serie = 'FORTIUS' then
    new.folio := public.fortius_inmuebles_next_property_code();
    n := substring(new.folio from 9)::bigint;
  else
    raise exception 'Serie de folio desconocida: %', v_serie;
  end if;
  insert into public.fortius_inmuebles_folios (serie, numero, folio, tabla, entidad_id, emitido_por)
  values (v_serie, n, new.folio, tg_table_name, new.id::text, auth.uid());
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_panel_folio() from public, anon, authenticated, service_role;

notify pgrst, 'reload schema';
commit;
