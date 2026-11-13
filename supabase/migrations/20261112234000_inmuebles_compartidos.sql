-- PUB-02 (RP-95, DEC-40, titular 12/11/2026): inmuebles compartidos por otra inmobiliaria.
-- Un inmueble con origen «compartido» no tiene operación de captación: se publica con la
-- inmobiliaria ligada y su autorización escrita adjunta (carta, correo o mensaje guardado como
-- archivo privado), y lo publica el director. El sitio muestra «En colaboración con <inmobiliaria>»
-- y nunca el contacto, el porcentaje ni la autorización.
-- No destructiva: ningún registro se reescribe; se amplían en su lugar la validación, la puerta
-- de publicación y las proyecciones, como en 20261028130000_property_conjunto.sql.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

-- Validación de escritura: forma de «origen» y «aliado».
do $migration$
declare definition text; marker text := 'foreach k in array array[''videoUrl'',''tour360Url''] loop';
begin
  select pg_get_functiondef('public.fortius_inmuebles_validate_record(text,text,jsonb)'::regprocedure) into definition;
  if definition is null or position(marker in definition)=0 then raise exception 'Unexpected property validation function; review before applying'; end if;
  execute replace(definition, marker, $new$if d ? 'origen' and coalesce(d->>'origen','') not in ('propio','compartido') then
      raise sqlstate 'PT400' using message='Origen del inmueble inválido';
    end if;
    if d ? 'aliado' and (jsonb_typeof(d->'aliado')<>'object'
      or exists(select 1 from jsonb_object_keys(d->'aliado') x where x not in ('inmobiliaria','contacto','porcentaje','autorizacion'))
      or jsonb_typeof(d->'aliado'->'inmobiliaria') is distinct from 'string' or length(btrim(d->'aliado'->>'inmobiliaria')) not between 2 and 120
      or (d->'aliado' ? 'contacto' and (jsonb_typeof(d->'aliado'->'contacto')<>'string' or length(d->'aliado'->>'contacto')>200))
      or (d->'aliado' ? 'porcentaje' and (jsonb_typeof(d->'aliado'->'porcentaje')<>'number' or (d->'aliado'->>'porcentaje')::numeric not between 0 and 100))
      or (d->'aliado' ? 'autorizacion' and (jsonb_typeof(d->'aliado'->'autorizacion')<>'object'
        or exists(select 1 from jsonb_object_keys(d->'aliado'->'autorizacion') x where x not in ('path','nombre','fecha','firmante'))
        or jsonb_typeof(d->'aliado'->'autorizacion'->'path') is distinct from 'string' or length(d->'aliado'->'autorizacion'->>'path')>300
        or (d->'aliado'->'autorizacion' ? 'nombre' and (jsonb_typeof(d->'aliado'->'autorizacion'->'nombre')<>'string' or length(d->'aliado'->'autorizacion'->>'nombre')>160))
        or (d->'aliado'->'autorizacion' ? 'fecha' and coalesce(d->'aliado'->'autorizacion'->>'fecha','') !~ '^\d{4}-\d{2}-\d{2}$')
        or (d->'aliado'->'autorizacion' ? 'firmante' and (jsonb_typeof(d->'aliado'->'autorizacion'->'firmante')<>'string' or length(d->'aliado'->'autorizacion'->>'firmante')>160))))) then
      raise sqlstate 'PT400' using message='Datos de la inmobiliaria aliada inválidos';
    end if;
    $new$ || marker);
end;
$migration$;

-- Puerta de publicación: un compartido no pide captación; pide inmobiliaria, autorización y al director.
do $migration$
declare definition text; anchor text := 'if new.collection<>''propiedades'' or new.data->>''publicada'' is distinct from ''true'' then return new; end if;';
begin
  select pg_get_functiondef('public.fortius_inmuebles_guard_guided_publication()'::regprocedure) into definition;
  definition := replace(definition, chr(13), '');
  if (length(definition)-length(replace(definition,anchor,'')))/length(anchor)<>1 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_publication'; end if;
  execute replace(definition, anchor, anchor || $new$
 if new.data->>'origen'='compartido' then
  -- Ya publicado como compartido, sigue publicado al editarse (como los propios).
  if tg_op='UPDATE' and old.data->>'publicada'='true' and old.data->>'origen'='compartido' then return new; end if;
  if not public.fortius_inmuebles_is_admin() then
   raise sqlstate 'PT403' using message='Un inmueble compartido lo publica el director';
  end if;
  if length(btrim(coalesce(new.data->'aliado'->>'inmobiliaria','')))<2
   or coalesce(new.data->'aliado'->'autorizacion'->>'fecha','')=''
   or length(btrim(coalesce(new.data->'aliado'->'autorizacion'->>'firmante','')))<3
   or not exists(select 1 from public.fortius_inmuebles_file_uploads u
     where u.bucket='fortius-inmuebles-private' and u.path=new.data->'aliado'->'autorizacion'->>'path') then
   raise sqlstate 'PT409' using message='Para publicar un inmueble compartido liga la inmobiliaria y adjunta su autorización escrita con fecha y firmante';
  end if;
  return new;
 end if;$new$);
end;
$migration$;

-- Proyección pública: solo el nombre de la inmobiliaria, para «En colaboración con…».
do $migration$
declare original text; definition text; root_marker text := 'if jsonb_typeof(d->''informacionPublica'')=''object'' then';
begin
  select pg_get_functiondef('public.fortius_inmuebles_public_records(text)'::regprocedure) into original;
  if original is null or position(root_marker in original)=0 then raise exception 'Unexpected property projection; migration not applied'; end if;
  definition := replace(original, root_marker, $new$if d->>'origen'='compartido' and jsonb_typeof(d->'aliado'->'inmobiliaria')='string'
        and length(btrim(d->'aliado'->>'inmobiliaria')) between 2 and 120 then
        result := result || jsonb_build_object('colaboracion',btrim(d->'aliado'->>'inmobiliaria'));
      end if;
      $new$ || root_marker);
  if definition = original then raise exception 'Unexpected property projection; migration not applied'; end if;
  execute definition;
end;
$migration$;

-- Lo que un asesor ve de un compartido ajeno (solo el nombre de la inmobiliaria) lo recorta el
-- servidor del panel junto con lo demás privado (COR-23, projectTeamProperty).

notify pgrst,'reload schema';
commit;
