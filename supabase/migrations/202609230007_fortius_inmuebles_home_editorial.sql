-- Publish only the approved editorial keys; existing records and grants are preserved.
begin;
do $migration$
declare definition text; original text;
begin
  select pg_get_functiondef('public.mnt_public_records(text)'::regprocedure) into original;
  definition := replace(original,
    $old$result:=public.mnt_pick(d,array['heroTitulo','heroSubtitulo','manifiestoTitulo','manifiestoTexto','seoTitle','seoDescription']);$old$,
    $new$result:=public.mnt_pick(d,array['heroTitulo','heroSubtitulo','manifiestoTitulo','manifiestoTexto','seoTitle','seoDescription']);
      if jsonb_typeof(d->'homeTexts')='object' then
        result := result || jsonb_build_object('homeTexts',public.mnt_pick(d->'homeTexts',array['relatoTexto','relatoApoyo','metodoTitulo','metodoTexto','captacionTexto','preparacionTexto','comercializacionTexto','cierreTexto','entregablesTitulo','entregablesTexto','factibilidadTexto','valorTexto','planTexto','gastosTexto','contratoTexto','reportesTexto','preguntasTitulo','tiempoRespuesta','precioRespuesta','gastosRespuesta','inicioRespuesta','evaluarTitulo','evaluarTexto']));
      end if;$new$);
  if definition = original then raise exception 'Unexpected public content projection; migration not applied'; end if;
  execute definition;
end;
$migration$;
commit;
