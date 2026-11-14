-- C-50 (aparte, 13/11/2026). Al iniciar una entrevista con un contacto nuevo, start_intake busca si el
-- teléfono ya es de un prospecto o cliente, pero comparaba los dígitos sin quitar la lada del país:
-- «+52 664 123 4567» no coincidía con «664 123 4567» y se duplicaba el contacto. Ahora los dos lados
-- quitan el 52 cuando quedan 10 dígitos, como ya hace la captura del sitio.
-- Se modifica la función actual por reemplazo de texto, como 20261113127000.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

do $$
declare definition text;
  normalize_anchor text := $m$normalized:=regexp_replace(p_contact->>'telefono','[^0-9]','','g');$m$;
  compare_anchor text := $m$regexp_replace(x.data->>'telefono','[^0-9]','','g')=normalized$m$;
  marker text := $m$-- C-50: sin lada 52$m$;
begin
 select pg_get_functiondef('public.fortius_inmuebles_start_intake(uuid,text,jsonb,uuid)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position(marker in definition)>0 then return;end if;
 if position(normalize_anchor in definition)=0 or position(compare_anchor in definition)=0 then
   raise exception 'Unexpected intake function public.fortius_inmuebles_start_intake';
 end if;
 definition:=replace(definition,normalize_anchor,normalize_anchor||$m$normalized:=regexp_replace(normalized,'^52([0-9]{10})$','\1'); $m$||marker||chr(10));
 definition:=replace(definition,compare_anchor,$m$regexp_replace(regexp_replace(x.data->>'telefono','[^0-9]','','g'),'^52([0-9]{10})$','\1')=normalized$m$);
 execute definition;
end; $$;
notify pgrst,'reload schema';
commit;
