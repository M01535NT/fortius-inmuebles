-- Metodología M-06 (decisión del titular, 14/11/2026): una renta sin depósito ni garantía la aprueba
-- el director. Marcar «No aplica» en «Depósito y garantías» (garantias_renta) pasa a ser del
-- director; el asesor puede dejarlo en «Lo tengo» o revisarlo con su respaldo. Un guardado que no
-- cambia esa marca la conserva. No reescribe registros: las marcas existentes se quedan.
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
declare definition text; fn text:='public.fortius_inmuebles_guard_director_reviews';
begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_director_reviews()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('M-06' in definition)>0 then return;end if;
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$   and r->>'estado' in ('revisado','no_aplica') then$m$,
  $m$   and r->>'estado' in ('revisado','no_aplica')
   /* M-06 */ or auth.uid() is not null and not public.fortius_inmuebles_is_admin() and k='garantias_renta' and r->>'estado'='no_aplica' then$m$,1,fn);
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$using message='Esta revisión la marca el director; déjala como «Lo tengo»';$m$,
  $m$using message=case when k='garantias_renta' then 'Una renta sin depósito ni garantía la aprueba el director; déjala como «Lo tengo»'
     else 'Esta revisión la marca el director; déjala como «Lo tengo»' end;$m$,1,fn);
 execute definition;
end; $$;

drop function public.fortius_inmuebles_replace_once(text,text,text,integer,text);

notify pgrst,'reload schema';
commit;
