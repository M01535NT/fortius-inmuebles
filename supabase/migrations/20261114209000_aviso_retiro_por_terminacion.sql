-- Metodología M-01: el aviso «Retirar del sitio» (20261114208000) se identifica por la operación y
-- la fecha de la terminación. Así, si la operación firma un contrato nuevo y lo vuelve a terminar,
-- sale un aviso nuevo aunque el anterior ya esté hecho o eliminado. No reescribe registros.
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
 if position('M-01b' in definition)>0 then return;end if;
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$'retiro-'||new.id::text$m$,
  $m$/* M-01b */ 'retiro-'||new.id::text||'-'||coalesce(new.flujo->'firmaContrato'->'terminacion'->>'fecha','')$m$,2,fn);
 execute definition;
end; $$;

drop function public.fortius_inmuebles_replace_once(text,text,text,integer,text);

notify pgrst,'reload schema';
commit;
