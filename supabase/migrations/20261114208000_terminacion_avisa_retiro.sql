-- Metodología M-01 (decisión del titular, 14/11/2026): terminar el contrato de intermediación no
-- retira el inmueble del sitio por sí solo; avisa que debe retirarse. Al registrar la terminación,
-- si el inmueble está publicado, se crea una tarea urgente para el asesor de la operación:
-- «Retirar del sitio». Retirarlo lo hace una persona; al retirarlo solo se apaga «publicada» y las
-- fotos y datos se conservan (se archiva) por si se vuelve a publicar. El aviso se crea una sola vez
-- por terminación. No reescribe registros existentes.
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
 if position('Retirar del sitio' in definition)>0 then return;end if;
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$invalidate_publication:=/* M-01: solo la terminación */ (public.fortius_inmuebles_signature_ok(old.flujo) and not public.fortius_inmuebles_signature_ok(new.flujo) and new.flujo->'firmaContrato' ? 'terminacion')$m$,
  $m$/* M-01: la terminación avisa que se retire; no retira sola */
   if new.flujo->'firmaContrato' ? 'terminacion' and not coalesce(old.flujo->'firmaContrato' ? 'terminacion',false) and new.propiedad_slug is not null
     and exists(select 1 from public.fortius_inmuebles_records p where p.collection='propiedades' and p.id=new.propiedad_slug and p.data->>'publicada'='true') then
     insert into public.fortius_inmuebles_records(collection,id,data) values('tareas','retiro-'||new.id::text,jsonb_build_object(
       'id','retiro-'||new.id::text,'titulo','Retirar del sitio: terminó el contrato',
       'descripcion','El propietario terminó el contrato de intermediación. Retira el inmueble del sitio; sus fotos y datos se conservan por si se vuelve a publicar.',
       'categoria','comercializacion','estado','pendiente','prioridad','urgente','pasos','[]'::jsonb,
       'asesorId',new.asesor_id,'clienteId',new.cliente_id,'propiedadSlug',new.propiedad_slug,'expedienteId',new.id::text,
       'vence',to_char((clock_timestamp() at time zone 'America/Tijuana')::date,'YYYY-MM-DD'),
       'creadoEl',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')))
     on conflict do nothing;
   end if;
   invalidate_publication:=false$m$,1,fn);
 execute definition;
end; $$;

drop function public.fortius_inmuebles_replace_once(text,text,text,integer,text);

notify pgrst,'reload schema';
commit;
