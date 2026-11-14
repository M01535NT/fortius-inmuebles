-- Metodología M-01 (decisión del titular, 14/11/2026): terminar el contrato de intermediación retira
-- el inmueble del sitio, salvo que el contrato sea sin exclusiva: entonces sigue publicado.
-- El contrato vigente es el borrador 09 o 21 de la operación modificado más recientemente que tenga
-- una emisión (la misma regla que usa Vencimientos). Sin contrato emitido, o en exclusiva, se retira.
-- No reescribe registros.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

create or replace function public.fortius_inmuebles_contract_non_exclusive(p_expediente uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select coalesce((select d.data->>'modalidad'='no_exclusiva' from public.fortius_inmuebles_formato_drafts d
  where d.expediente_id=p_expediente and d.formato_id in ('09','21')
    and exists(select 1 from public.fortius_inmuebles_formato_emissions m where m.draft_id=d.id)
  order by d.updated_at desc, d.id desc limit 1),false);
$$;
revoke all on function public.fortius_inmuebles_contract_non_exclusive(uuid) from public, anon, authenticated;

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
 if position('contract_non_exclusive' in definition)>0 then return;end if;
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$and new.flujo->'firmaContrato' ? 'terminacion')$m$,
  $m$and new.flujo->'firmaContrato' ? 'terminacion' and not public.fortius_inmuebles_contract_non_exclusive(new.id))$m$,1,fn);
 execute definition;
end; $$;

drop function public.fortius_inmuebles_replace_once(text,text,text,integer,text);

notify pgrst,'reload schema';
commit;
