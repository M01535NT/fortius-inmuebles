-- Trámites sin frenos (DEC-61, decisión del titular del 16/11/2026: nada frena el trabajo, solo avisa).
-- Hasta ahora la base rechazaba cerrar un paso del trámite con pendientes sin marcar («Faltan pendientes
-- de …») o sin su documento en los pasos que lo piden («Sube el documento de … antes de cerrar el paso»).
-- Desde aquí el paso se cierra igual y lo que faltó queda escrito en el historial del trámite:
-- «Se cerró el paso «Carta de finiquito» con pendientes sin hacer y sin su documento». El panel ya lo
-- avisa al cerrar (src/lib/panel/datos/tramites.ts, avisoAlCerrar).
--
-- Solo cambia ese bloque de fortius_inmuebles_guard_tramite (20261114211000_tramites), cortado por anclas
-- sobre la función viva; si ya se aplicó, no hace nada. Se conserva intacto lo que no es freno de proceso:
-- RLS y quién ve qué, lo que solo hace el director (reasignar, desligar, borrar, firmar sin la cancelación),
-- la validación de datos, el control de versión 409, el sello de notas e historial, que la prueba de un
-- paso cerrado no se quite mientras sea la única, que los comprobantes vivan en el archivo privado, que un
-- trámite cancelado no avance y que los pasos se cierren o reabran de uno en uno.
-- El freno de la firma por la hipoteca ya lo quitó 20261116100000_sin_frenos_de_proceso.
-- No reescribe registros.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

do $$
declare definition text;
 anchor text := $m$  if exists(select 1 from jsonb_array_elements(p->'pendientes') x where x->'hecho'<>'true'::jsonb) then
   raise sqlstate 'PT400' using message='Faltan pendientes de «'||nombre||'»'; end if;
  if p->>'clave' in ('liquidado','carta','certificado') and not exists(select 1 from public.fortius_inmuebles_records a
    where a.collection='archivos' and a.data->>'tramiteId'=new.id and a.data->>'pasoClave'=p->>'clave') then
   raise sqlstate 'PT400' using message='Sube el documento de «'||nombre||'» antes de cerrar el paso'; end if;
  pasos:=jsonb_set(pasos,array[antes::text],p||jsonb_build_object('cerradoEl',stamp,'cerradoPor',actor::text));
  eventos:=eventos||('Se cerró el paso «'||nombre||'»');$m$;
 replacement text := $m$  -- SIN-FRENOS (DEC-61): lo que falta no frena; queda dicho en el historial.
  texto:='';
  if exists(select 1 from jsonb_array_elements(p->'pendientes') x where x->'hecho'<>'true'::jsonb) then
   texto:=' con pendientes sin hacer'; end if;
  if p->>'clave' in ('liquidado','carta','certificado') and not exists(select 1 from public.fortius_inmuebles_records a
    where a.collection='archivos' and a.data->>'tramiteId'=new.id and a.data->>'pasoClave'=p->>'clave') then
   texto:=texto||case when texto='' then ' sin su documento' else ' y sin su documento' end; end if;
  pasos:=jsonb_set(pasos,array[antes::text],p||jsonb_build_object('cerradoEl',stamp,'cerradoPor',actor::text));
  eventos:=eventos||('Se cerró el paso «'||nombre||'»'||texto);$m$;
begin
 select replace(pg_get_functiondef('public.fortius_inmuebles_guard_tramite()'::regprocedure),chr(13),'') into definition;
 -- Ya aplicada: no se repite.
 if position('SIN-FRENOS' in definition)>0 then return; end if;
 -- FLX-03 (20261115200000) ya dejó de frenar el cierre del paso y lo anota como aviso: se conserva esa versión.
 if position('Faltan pendientes de' in definition)=0 then return; end if;
 if (length(definition)-length(replace(definition,anchor,'')))/length(anchor)<>1 then
  raise exception 'Unexpected process function public.fortius_inmuebles_guard_tramite';
 end if;
 execute replace(definition,anchor,replacement);
end; $$;

-- Los permisos de la función no cambian con create or replace; se repiten por claridad.
revoke execute on function public.fortius_inmuebles_guard_tramite() from public, anon, authenticated;

notify pgrst,'reload schema';
commit;
