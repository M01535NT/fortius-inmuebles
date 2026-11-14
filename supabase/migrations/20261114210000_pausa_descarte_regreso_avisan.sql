-- Metodología M-02 (decisión del titular, 14/11/2026): pausar o descartar la operación, ponerla en
-- regularización, que el director pause o rechace el encargo, o regresarla a una etapa anterior a la
-- publicación ya no retira el inmueble del sitio por sí solo: avisa que debe retirarse, como la
-- terminación del contrato (20261114208000). El aviso es una tarea urgente para el asesor, una por
-- cada cambio, y solo si el inmueble está publicado y ninguna otra captación lo respalda. Retirarlo
-- lo hace una persona y lo archiva: fotos y datos se conservan.
-- Siguen retirándolo solos: cambiar el inmueble, el cliente o la ruta, una observación o una
-- revisión retirada de las que autorizan publicar, y entregar o cerrar sin marcarlo vendido o rentado.
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
 if position('M-02b' in definition)>0 then return;end if;
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$invalidate_publication boolean;$m$,
  $m$invalidate_publication boolean; notice text; notice_id text;$m$,1,fn);
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$   invalidate_publication:=false
   /* M-02 */ or (new.etapa in ('captacion','documentacion') and old.etapa not in ('captacion','documentacion'))
   or (new.flujo ? 'resolucion' and not public.fortius_inmuebles_resolution_allows(new.flujo,'comercializacion')) or new.flujo->>'estado'<>'activa' or (new.etapa in$m$,
  $m$   /* M-02b: pausa, descarte, regularización, encargo pausado o rechazado y regreso avisan que se retire */
   notice:=case
     when new.flujo->>'estado'='descartada' and coalesce(old.flujo->>'estado','activa')<>'descartada' then 'se descartó la operación'
     when new.flujo->>'estado'='regularizacion' and coalesce(old.flujo->>'estado','activa')='activa' then 'la operación quedó en regularización'
     when new.flujo->>'estado'='pausada' and coalesce(old.flujo->>'estado','activa')='activa' then 'se pausó la operación'
     when new.flujo ? 'resolucion' and not public.fortius_inmuebles_resolution_allows(new.flujo,'comercializacion')
       and (old.flujo is null or not (old.flujo ? 'resolucion') or public.fortius_inmuebles_resolution_allows(old.flujo,'comercializacion')) then 'el encargo quedó pausado o rechazado'
     when new.etapa in ('captacion','documentacion') and old.etapa not in ('captacion','documentacion') then 'la operación regresó a antes de publicar'
   end;
   if notice is not null and new.propiedad_slug is not null and new.flujo->>'ruta' in ('captacion','arrendador')
     and exists(select 1 from public.fortius_inmuebles_records p where p.collection='propiedades' and p.id=new.propiedad_slug and p.data->>'publicada'='true')
     and not exists(select 1 from public.fortius_inmuebles_expedientes e where e.id<>new.id and e.propiedad_slug=new.propiedad_slug
       and e.operacion=(select p.data->>'operacion' from public.fortius_inmuebles_records p where p.collection='propiedades' and p.id=new.propiedad_slug)
       and public.fortius_inmuebles_flow_publish_ready(e.id)) then
     notice_id:='retiro-'||new.id::text||'-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSUS');
     insert into public.fortius_inmuebles_records(collection,id,data) values('tareas',notice_id,jsonb_build_object(
       'id',notice_id,'titulo','Retirar del sitio: '||notice,
       'descripcion','Revisa si el inmueble debe seguir anunciado y, si no, retíralo del sitio; sus fotos y datos se conservan por si se vuelve a publicar.',
       'categoria','comercializacion','estado','pendiente','prioridad','urgente','pasos','[]'::jsonb,
       'asesorId',new.asesor_id,'clienteId',new.cliente_id,'propiedadSlug',new.propiedad_slug,'expedienteId',new.id::text,
       'vence',to_char((clock_timestamp() at time zone 'America/Tijuana')::date,'YYYY-MM-DD'),
       'creadoEl',to_char(clock_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')))
     on conflict do nothing;
   end if;
   invalidate_publication:=false
   or (new.etapa in$m$,1,fn);
 execute definition;
end; $$;

drop function public.fortius_inmuebles_replace_once(text,text,text,integer,text);

notify pgrst,'reload schema';
commit;
