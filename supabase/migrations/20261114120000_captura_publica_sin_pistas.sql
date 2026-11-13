-- C-43 (pendientes de la ruta pública, 13/11/2026). Tres ajustes a la captura del sitio:
--  1. Un inmueble que no está publicado no se liga al prospecto: antes, mandar su clave respondía
--     «Referencia inexistente» o lo aceptaba (y asignaba el prospecto a su asesor), lo que revelaba
--     qué inmuebles no publicados existen. Ahora la clave se descarta en silencio.
--  2. El teléfono solo admite dígitos, espacios, +, paréntesis, puntos y guiones (antes pasaba
--     «llamame 1234567»).
--  3. «manual» deja de aceptarse: es la captura del equipo en el panel, que no usa esta función.
-- (El número que devuelve la captura ya no sale al sitio; eso está en la ruta del servidor.)
-- Se modifica la función actual por reemplazo de texto, como 20261113127000.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

do $$
declare definition text;
  phone_anchor text := $m$or length(coalesce(p_data->>'telefono','')) not between 7 and 40$m$;
  origin_anchor text := $m$'checklist','documentos','manual')$m$;
  slug_anchor text := $m$d:=d || coalesce((select jsonb_build_object('asesorId',a.id)$m$;
  marker text := $m$-- C-43: inmueble no publicado$m$;
begin
 select pg_get_functiondef('public.fortius_inmuebles_capture_lead(jsonb,text)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position(marker in definition)>0 then return;end if;
 if position(phone_anchor in definition)=0 or position(origin_anchor in definition)=0 or position(slug_anchor in definition)=0 then
   raise exception 'Unexpected lead capture function public.fortius_inmuebles_capture_lead';
 end if;
 definition:=replace(definition,phone_anchor,phone_anchor||$m$ or coalesce(p_data->>'telefono','') !~ '^[+]?[0-9 ().-]{7,40}$'$m$);
 definition:=replace(definition,origin_anchor,$m$'checklist','documentos')$m$);
 definition:=replace(definition,slug_anchor,marker||$m$
  if coalesce(d->>'propiedadSlug','')<>'' and not exists(select 1 from public.fortius_inmuebles_records p
      where p.collection='propiedades' and p.id=d->>'propiedadSlug' and p.data->'publicada'='true'::jsonb) then
    d:=d-'propiedadSlug';
  end if;
  $m$||slug_anchor);
 execute definition;
end; $$;
notify pgrst,'reload schema';
commit;
