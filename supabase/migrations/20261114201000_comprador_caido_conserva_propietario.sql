-- Metodología M-03 (decisión del titular, 14/11/2026). Si se cae el comprador y se cambia o quita la
-- contraparte, solo se rehace lo que depende de él: comprador o arrendatario, visitas, oferta,
-- revisión para cerrar, instrumento, contraparte, contrato de renta, garantías, firma, pago,
-- entrega, inventario, registro, término, honorarios y archivo. Lo del propietario (entrevista,
-- titularidad, factibilidad, valor, precio, intermediación, levantamiento, plan y publicación),
-- la firma del contrato de intermediación, el avalúo y la publicación se conservan.
-- Un cambio de inmueble, cliente, asesor o ruta sigue reiniciando todo, como antes.
-- Retirar una revisión solo retira la publicación si esa revisión es de las que la autorizan.
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
declare definition text; fn text:='public.fortius_inmuebles_guard_guided_operation';
begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_guided_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('M-03' in definition)>0 then return;end if;
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$context_changed boolean:=false; counterpart uuid;$m$,
  $m$context_changed boolean:=false; counterpart uuid; buyer_only boolean:=false; reset_review boolean;$m$,1,fn);
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$   if old.flujo is not null and new.flujo is null then raise sqlstate 'PT409' using message='La guía no se elimina; registra pausa o descarte'; end if;$m$,
  $m$   if old.flujo is not null and new.flujo is null then raise sqlstate 'PT409' using message='La guía no se elimina; registra pausa o descarte'; end if;
   -- M-03: solo cambió la contraparte (se cayó el comprador).
   buyer_only:=context_changed and new.propiedad_slug is not distinct from old.propiedad_slug and new.cliente_id is not distinct from old.cliente_id
     and new.asesor_id is not distinct from old.asesor_id and new.flujo->>'ruta' is not distinct from old.flujo->>'ruta';$m$,1,fn);
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$new.id,coalesce(context_changed,false)))$m$,
  $m$new.id,coalesce(context_changed and not buyer_only,false)))$m$,2,fn);
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$     previous:=case when tg_op='UPDATE' then old.flujo->'requisitos'->k else null end;
     if context_changed then$m$,
  $m$     previous:=case when tg_op='UPDATE' then old.flujo->'requisitos'->k else null end;
     reset_review:=context_changed and (not buyer_only or k in ('comprador','arrendatario','visitas','oferta','revision_cierre','instrumento','contraparte',
       'contrato_renta','garantias_renta','firma','pago','entrega','inventario_entrega','registro','termino_renta','honorarios','archivo'));
     if reset_review then$m$,1,fn);
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$     if context_changed or (r - 'registradoPor' - 'registradoEl') is distinct from (previous - 'registradoPor' - 'registradoEl') then$m$,
  $m$     if reset_review or (r - 'registradoPor' - 'registradoEl') is distinct from (previous - 'registradoPor' - 'registradoEl') then$m$,1,fn);
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$if r->>'estado'='revisado' and not context_changed and$m$,
  $m$if r->>'estado'='revisado' and not reset_review and$m$,1,fn);
 execute definition;
end; $$;

do $$
declare definition text; fn text:='public.fortius_inmuebles_log_expediente_operation';
begin
 select pg_get_functiondef('public.fortius_inmuebles_log_expediente_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('M-03' in definition)>0 then return;end if;
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$   or (old.flujo is not null and (new.flujo->>'ruta' is distinct from old.flujo->>'ruta'
      or new.flujo->>'contraparteId' is distinct from old.flujo->>'contraparteId' or new.flujo->>'contraparteExterna' is distinct from old.flujo->>'contraparteExterna'))$m$,
  $m$   /* M-03: cambiar la contraparte no retira la publicación */ or (old.flujo is not null and new.flujo->>'ruta' is distinct from old.flujo->>'ruta')$m$,1,fn);
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$or (old.flujo->'requisitos'->x.key->>'estado'='revisado' and x.value->>'estado'<>'revisado'));$m$,
  $m$or (x.key=any(public.fortius_inmuebles_flow_required(new.flujo->>'ruta','comercializacion')) and old.flujo->'requisitos'->x.key->>'estado'='revisado' and x.value->>'estado'<>'revisado'));$m$,1,fn);
 execute definition;
end; $$;

drop function public.fortius_inmuebles_replace_once(text,text,text,integer,text);

notify pgrst,'reload schema';
commit;
