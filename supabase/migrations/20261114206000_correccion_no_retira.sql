-- Metodología M-01 y M-07 (decisión del titular, 14/11/2026): una corrección no retira el inmueble
-- del sitio; la terminación del contrato sí.
-- 1. Corregir la firma del contrato (vuelve a «por revisar») ya no retira la publicación. Solo la
--    retira registrar la terminación.
-- 2. Que una revisión vuelva a «Lo tengo» porque se emitió una versión nueva de su documento
--    (20261114205000) no retira la publicación.
-- Mientras la firma o la revisión esperan, no se puede volver a publicar algo retirado (eso no cambia).
-- No reescribe registros.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

create or replace function public.fortius_inmuebles_replace_once(definition text, anchor text, replacement text, expected integer, fn text)
returns text language plpgsql immutable set search_path='' as $$
begin
 if (length(definition)-length(replace(definition,anchor,'')))/length(anchor)<>expected then
  raise exception 'Unexpected process function %', fn;
 end if;
 return replace(definition,anchor,replacement);
end; $$;

do $$
declare definition text; fn text:='public.fortius_inmuebles_log_expediente_operation';
begin
 select pg_get_functiondef('public.fortius_inmuebles_log_expediente_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('fortius.version_nueva' in definition)>0 then return;end if;
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$/* M-01 */ (public.fortius_inmuebles_signature_ok(old.flujo) and not public.fortius_inmuebles_signature_ok(new.flujo))$m$,
  $m$/* M-01: solo la terminación */ (public.fortius_inmuebles_signature_ok(old.flujo) and not public.fortius_inmuebles_signature_ok(new.flujo) and new.flujo->'firmaContrato' ? 'terminacion')$m$,1,fn);
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$or (x.key=any(public.fortius_inmuebles_flow_required(new.flujo->>'ruta','comercializacion')) and old.flujo->'requisitos'->x.key->>'estado'='revisado'$m$,
  $m$or (coalesce(current_setting('fortius.version_nueva',true),'')<>'1' and x.key=any(public.fortius_inmuebles_flow_required(new.flujo->>'ruta','comercializacion')) and old.flujo->'requisitos'->x.key->>'estado'='revisado'$m$,1,fn);
 execute definition;
end; $$;

drop function public.fortius_inmuebles_replace_once(text,text,text,integer,text);

notify pgrst,'reload schema';
commit;
