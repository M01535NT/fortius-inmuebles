-- Ficha «Escenario» (titular, 18/10/2026): beneficios, características por
-- grupo, costos recurrentes y categoría de los lugares cercanos.
-- Non-destructive: no record is rewritten. Existing validation rules and the
-- public projection are kept; both functions are extended in place.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

-- Write validation: the new optional fields must be well formed when present.
do $migration$
declare definition text; marker text := 'foreach k in array array[''videoUrl'',''tour360Url''] loop';
begin
  select pg_get_functiondef('public.fortius_inmuebles_validate_record(text,text,jsonb)'::regprocedure) into definition;
  if definition is null or position(marker in definition)=0 then raise exception 'Unexpected property validation function; review before applying'; end if;
  execute replace(definition, marker, $new$if exists(select 1 from jsonb_array_elements(d->'puntosDeInteres') x
        where x ? 'categoria' and coalesce(x->>'categoria','') not in ('playa','escuelas','comercio','salud','restaurantes','transporte','parques','otros')) then
      raise sqlstate 'PT400' using message='Categoría de lugar cercano inválida';
    end if;
    if d ? 'beneficios' then
      if jsonb_typeof(d->'beneficios')<>'array' or jsonb_array_length(d->'beneficios')>4 then raise sqlstate 'PT400' using message='Beneficios inválidos'; end if;
      for v in select x from jsonb_array_elements(d->'beneficios') x loop
        if jsonb_typeof(v)<>'object' or jsonb_typeof(v->'titulo') is distinct from 'string' or length(btrim(v->>'titulo')) not between 1 and 80
          or jsonb_typeof(v->'texto') is distinct from 'string' or length(v->>'texto')>240 then raise sqlstate 'PT400' using message='Beneficio inválido'; end if;
      end loop;
    end if;
    if d ? 'caracteristicas' then
      if jsonb_typeof(d->'caracteristicas')<>'array' or jsonb_array_length(d->'caracteristicas')>5 then raise sqlstate 'PT400' using message='Características inválidas'; end if;
      for v in select x from jsonb_array_elements(d->'caracteristicas') x loop
        if jsonb_typeof(v)<>'object' or coalesce(v->>'grupo','') not in ('interior','exterior','servicios','seguridad','otros')
          or jsonb_typeof(v->'elementos') is distinct from 'array' or jsonb_array_length(v->'elementos')>30
          or exists(select 1 from jsonb_array_elements(v->'elementos') e where jsonb_typeof(e)<>'string' or length(btrim(e #>> '{}')) not between 1 and 120) then
          raise sqlstate 'PT400' using message='Grupo de características inválido';
        end if;
      end loop;
    end if;
    if d ? 'costos' then
      if jsonb_typeof(d->'costos')<>'object' or exists(select 1 from jsonb_each(d->'costos') c
        where c.key in ('predialAnual','mantenimientoMensual') and (jsonb_typeof(c.value)<>'number' or (c.value #>> '{}')::numeric<0)) then
        raise sqlstate 'PT400' using message='Costos inválidos';
      end if;
    end if;
    $new$ || marker);
end;
$migration$;

-- Public projection: publish only well-formed values of the new fields.
do $migration$
declare original text; definition text;
  points_marker text := 'array[''lugar'',''minutos''])';
  root_marker text := 'if jsonb_typeof(d->''informacionPublica'')=''object'' then';
begin
  select pg_get_functiondef('public.fortius_inmuebles_public_records(text)'::regprocedure) into original;
  if original is null or position(points_marker in original)=0 or position(root_marker in original)=0 then
    raise exception 'Unexpected property projection; migration not applied';
  end if;
  definition := replace(original, points_marker, points_marker || $new$ || case when v->>'categoria' in ('playa','escuelas','comercio','salud','restaurantes','transporte','parques','otros') then jsonb_build_object('categoria',v->'categoria') else '{}'::jsonb end$new$);
  definition := replace(definition, root_marker, $new$if jsonb_typeof(d->'beneficios')='array' then
        result := result || jsonb_build_object('beneficios',(select coalesce(jsonb_agg(jsonb_build_object('titulo',btrim(e.v->>'titulo'),'texto',btrim(e.v->>'texto')) order by e.i),'[]'::jsonb)
          from jsonb_array_elements(d->'beneficios') with ordinality e(v,i)
          where e.i<=4 and jsonb_typeof(e.v->'titulo')='string' and length(btrim(e.v->>'titulo')) between 1 and 80 and jsonb_typeof(e.v->'texto')='string' and length(btrim(e.v->>'texto'))<=240));
      end if;
      if jsonb_typeof(d->'caracteristicas')='array' then
        result := result || jsonb_build_object('caracteristicas',(select coalesce(jsonb_agg(jsonb_build_object('grupo',e.v->>'grupo','elementos',
            (select coalesce(jsonb_agg(to_jsonb(btrim(t.x #>> '{}')) order by t.j),'[]'::jsonb) from jsonb_array_elements(e.v->'elementos') with ordinality t(x,j)
              where t.j<=30 and jsonb_typeof(t.x)='string' and length(btrim(t.x #>> '{}')) between 1 and 120)) order by e.i),'[]'::jsonb)
          from jsonb_array_elements(d->'caracteristicas') with ordinality e(v,i)
          where e.i<=5 and e.v->>'grupo' in ('interior','exterior','servicios','seguridad','otros') and jsonb_typeof(e.v->'elementos')='array'));
      end if;
      if jsonb_typeof(d->'costos')='object' then
        result := result || jsonb_build_object('costos',(select coalesce(jsonb_object_agg(c.key,c.value),'{}'::jsonb) from jsonb_each(d->'costos') c
          where c.key in ('predialAnual','mantenimientoMensual') and jsonb_typeof(c.value)='number' and (c.value #>> '{}')::numeric between 0 and 1e13));
      end if;
      $new$ || root_marker);
  if definition = original then raise exception 'Unexpected property projection; migration not applied'; end if;
  execute definition;
end;
$migration$;
commit;
