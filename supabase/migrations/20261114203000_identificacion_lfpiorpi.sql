-- Metodología M-05 (decisión del titular, 14/11/2026): en la compraventa, el expediente de
-- identificación de la LFPIORPI (art. 18: identificar a los clientes y conservar sus documentos)
-- se exige antes de pasar a la firma, en las rutas del propietario (captacion) y del comprador
-- (compra). Es un requisito protegido: no admite excepción ni «no aplica». Cada operación identifica
-- a su propio cliente (art. 18 fr. I: los clientes con quienes se realiza la actividad): en la
-- captación, al propietario; en la compra, al comprador. Por eso cambiar la contraparte no lo
-- reinicia; cambiar el cliente sí, como todo. La renta no lo exige: la fr. V del art. 17 cubre la
-- intermediación de compraventa. No reescribe registros: las operaciones que ya están en cierre o después no
-- retroceden; el requisito se exige al volver a entrar a cierre.
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
declare definition text; fn text:='public.fortius_inmuebles_flow_required';
begin
 select pg_get_functiondef('public.fortius_inmuebles_flow_required(text,text)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('identificacion_pld' in definition)>0 then return;end if;
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$else array['oferta','revision_cierre','instrumento','contraparte'] end;end if;$m$,
  $m$else array['oferta','revision_cierre','instrumento','contraparte','identificacion_pld'] end;end if;$m$,1,fn);
 execute definition;
end; $$;

do $$
declare definition text; fn text:='public.fortius_inmuebles_flow_review_ok';
begin
 select pg_get_functiondef('public.fortius_inmuebles_flow_review_ok(jsonb,text)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('identificacion_pld' in definition)>0 then return;end if;
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$key not in ('titularidad','factibilidad','valor','revision_cierre','firma','pago')$m$,
  $m$key not in ('titularidad','factibilidad','valor','revision_cierre','firma','pago','identificacion_pld')$m$,1,fn);
 execute definition;
end; $$;

do $$
declare definition text; fn text:='public.fortius_inmuebles_guard_guided_operation';
begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_guided_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('identificacion_pld' in definition)>0 then return;end if;
 -- La clave nueva es válida.
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$'revision_cierre','instrumento','contraparte','firma','pago','entrega','registro','honorarios','archivo')$m$,
  $m$'revision_cierre','instrumento','contraparte','firma','pago','entrega','registro','honorarios','archivo','identificacion_pld')$m$,1,fn);
 execute definition;
end; $$;

do $$
declare definition text; fn text:='public.fortius_inmuebles_guard_director_reviews';
begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_director_reviews()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('identificacion_pld' in definition)>0 then return;end if;
 -- Protegido: no admite excepción del director.
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$if k in ('titularidad','factibilidad','valor','revision_cierre','firma','pago') then$m$,
  $m$if k in ('titularidad','factibilidad','valor','revision_cierre','firma','pago','identificacion_pld') then$m$,1,fn);
 execute definition;
end; $$;

drop function public.fortius_inmuebles_replace_once(text,text,text,integer,text);

notify pgrst,'reload schema';
commit;
