-- Publish only approved property facts; preserve existing projection and grants.
begin;
do $migration$
declare original text; definition text;
begin
  select pg_get_functiondef('public.fortius_inmuebles_public_records(text)'::regprocedure) into original;
  -- Insert after the root projection, before its nested price/ficha projection.
  definition := replace(original,
    $old$result := result || jsonb_build_object('precio',$old$,
    $new$if jsonb_typeof(d->'informacionPublica')='object' then
        result := result || jsonb_build_object('informacionPublica',(select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) from jsonb_each(d->'informacionPublica') where key in ('fuenteTerreno','fuenteConstruccion','disponibilidadRevisadaEl','ocupacionEntrega') and jsonb_typeof(value)='string' and length(value #>> '{}')<=500));
      end if;
      result := result || jsonb_build_object('precio',$new$);
  if definition = original then raise exception 'Unexpected property projection; migration not applied'; end if;
  execute definition;
end;
$migration$;
commit;
