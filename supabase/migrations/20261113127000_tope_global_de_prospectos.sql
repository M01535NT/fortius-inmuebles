-- SEG-B4 (auditoría del 13/11/2026): la captura pública admite 5 solicitudes por minuto y 20 por hora
-- por visitante, más un tope global de 200 por hora. Con unas diez direcciones se agotaba el tope
-- global y el formulario dejaba de recibir prospectos reales durante una hora. El tope global sube a
-- 1000 por hora: sigue frenando una inundación, pero exige cincuenta veces más direcciones para
-- bloquear la recepción. Los topes por visitante no cambian.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

do $$
declare definition text;
  anchor text := $m$when k='global:hour' then 200$m$;
begin
 select pg_get_functiondef('public.fortius_inmuebles_capture_lead(jsonb,text)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 -- Ya aplicada: no se repite el reemplazo.
 if position($m$when k='global:hour' then 1000$m$ in definition)>0 then return;end if;
 if position(anchor in definition)=0 then raise exception 'Unexpected lead capture function public.fortius_inmuebles_capture_lead';end if;
 definition:=replace(definition,anchor,$m$when k='global:hour' then 1000$m$);
 execute definition;
end; $$;
notify pgrst,'reload schema';
commit;
