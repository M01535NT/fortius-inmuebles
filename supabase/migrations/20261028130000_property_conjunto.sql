-- Plaza con locales (titular, 27/10/2026): según el caso. Una plaza que se comercializa completa
-- es un inmueble con su operación; un local o una oficina que se vende o renta por separado es su
-- propio inmueble y operación, y guarda en «conjunto» el slug de su plaza. La plaza muestra sus
-- locales en el panel y en el sitio.
-- No destructiva: ningún registro se reescribe; se amplían en su lugar la validación de escritura
-- y la proyección pública, como en 20261018120000_property_escenario_fields.sql.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

-- Validación de escritura: «conjunto», si viene, es un identificador bien formado.
do $migration$
declare definition text; marker text := 'foreach k in array array[''videoUrl'',''tour360Url''] loop';
begin
  select pg_get_functiondef('public.fortius_inmuebles_validate_record(text,text,jsonb)'::regprocedure) into definition;
  if definition is null or position(marker in definition)=0 then raise exception 'Unexpected property validation function; review before applying'; end if;
  execute replace(definition, marker, $new$if d ? 'conjunto' and (jsonb_typeof(d->'conjunto') is distinct from 'string' or d->>'conjunto' !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$' or d->>'tipo'='plaza') then
      raise sqlstate 'PT400' using message='Plaza o conjunto inválido';
    end if;
    $new$ || marker);
end;
$migration$;

-- Proyección pública: el sitio recibe a qué plaza pertenece un local publicado.
do $migration$
declare original text; definition text; root_marker text := 'if jsonb_typeof(d->''informacionPublica'')=''object'' then';
begin
  select pg_get_functiondef('public.fortius_inmuebles_public_records(text)'::regprocedure) into original;
  if original is null or position(root_marker in original)=0 then raise exception 'Unexpected property projection; migration not applied'; end if;
  definition := replace(original, root_marker, $new$if jsonb_typeof(d->'conjunto')='string' and d->>'conjunto' ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$' then
        result := result || jsonb_build_object('conjunto',d->'conjunto');
      end if;
      $new$ || root_marker);
  if definition = original then raise exception 'Unexpected property projection; migration not applied'; end if;
  execute definition;
end;
$migration$;
notify pgrst,'reload schema';
commit;
