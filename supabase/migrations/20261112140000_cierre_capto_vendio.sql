-- Cierre de la operación: quién captó, quién vendió y el inmueble vendido (COR-22, RP-99).
-- Hasta ahora archivar la operación no tocaba el inmueble ni registraba quién captó y quién vendió.
-- 1. La guía acepta «cierre»: el asesor que captó, el que vendió (pueden ser el mismo) y la comisión
--    estimada de Fortius con su fuente (el contrato de intermediación). El servidor comprueba que los
--    asesores existan y anota quién lo registró y cuándo.
-- 2. En la venta y la renta del propietario, archivar la operación pide ese registro.
-- 3. Un inmueble marcado «Vendida» o «Rentada» ya no se retira solo del sitio al pasar la operación a
--    entrega, postventa o archivo: queda visible como vendido hasta que alguien lo retire. Las demás
--    causas de retiro (pausa, problemas, cambios de inmueble o de cliente) siguen igual.
-- 4. Un inmueble vendido o rentado se puede volver a mostrar como tal si su operación ya está en
--    cierre o después; nunca como disponible.
-- No cambia ni borra datos existentes.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

-- Valida el registro del cierre y devuelve el que se guarda, con las marcas que pone el servidor.
create function public.fortius_inmuebles_operation_close(c jsonb,prev jsonb) returns jsonb
language plpgsql stable security definer set search_path='' as $body$
declare content jsonb; stamp text:=to_char(clock_timestamp() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
 if c is null then return null; end if;
 if jsonb_typeof(c)<>'object' or exists(select 1 from jsonb_object_keys(c) x where x not in ('capto','vendio','comisionEstimada','fuente','registradoPor','registradoEl'))
  or jsonb_typeof(c->'capto') is distinct from 'string' or length(c->>'capto') not between 1 and 200
  or jsonb_typeof(c->'vendio') is distinct from 'string' or length(c->>'vendio') not between 1 and 200
  or (c ? 'comisionEstimada' and (jsonb_typeof(c->'comisionEstimada') is distinct from 'number' or (c->>'comisionEstimada')::numeric<0 or (c->>'comisionEstimada')::numeric>=1000000000000))
  or (c ? 'fuente' and (jsonb_typeof(c->'fuente') is distinct from 'string' or length(c->>'fuente')>200)) then
  raise sqlstate 'PT400' using message='Cierre incompleto: indica quién captó y quién vendió';
 end if;
 if not exists(select 1 from public.fortius_inmuebles_records r where r.collection='asesores' and r.id=c->>'capto')
  or not exists(select 1 from public.fortius_inmuebles_records r where r.collection='asesores' and r.id=c->>'vendio') then
  raise sqlstate 'PT400' using message='El asesor que captó o el que vendió no está en el equipo';
 end if;
 content:=c-'registradoPor'-'registradoEl';
 if prev is not null and content=(prev-'registradoPor'-'registradoEl') then
  return content||jsonb_build_object('registradoPor',prev->'registradoPor','registradoEl',prev->'registradoEl');
 end if;
 if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida para registrar el cierre';end if;
 return content||jsonb_build_object('registradoPor',auth.uid()::text,'registradoEl',stamp);
end; $body$;
revoke all on function public.fortius_inmuebles_operation_close(jsonb,jsonb) from public,anon,authenticated,service_role;

do $$ declare definition text; anchor text; begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_guided_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 anchor:='''firmaContrato'',''avaluo'')';
 if position(anchor in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,anchor,'''firmaContrato'',''avaluo'',''cierre'')');
 anchor:='if exists(select 1 from jsonb_object_keys(new.flujo) key';
 if (length(definition)-length(replace(definition,anchor,'')))/length(anchor)<>1 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,anchor,'if new.flujo ? ''cierre'' then
     new.flujo:=jsonb_set(new.flujo,''{cierre}'',public.fortius_inmuebles_operation_close(new.flujo->''cierre'',case when tg_op=''UPDATE'' then old.flujo->''cierre'' end));
   end if;
   '||anchor);
 anchor:='foreach k in array public.fortius_inmuebles_flow_required(new.flujo->>''ruta'',new.etapa) loop';
 if (length(definition)-length(replace(definition,anchor,'')))/length(anchor)<>1 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,anchor,'if new.flujo->>''ruta'' in (''captacion'',''arrendador'') and new.etapa=''cerrado'' and not (new.flujo ? ''cierre'') then
         raise sqlstate ''PT409'' using message=''Registra quién captó y quién vendió antes de archivar'';end if;
       '||anchor);
 execute definition;
end; $$;

-- El inmueble vendido o rentado no se retira solo al avanzar el cierre.
do $$ declare definition text; anchor text; begin
 select pg_get_functiondef('public.fortius_inmuebles_log_expediente_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 anchor:='or new.etapa in (''entrega'',''postventa'',''cerrado'')';
 if (length(definition)-length(replace(definition,anchor,'')))/length(anchor)<>1 then raise exception 'Unexpected process function public.fortius_inmuebles_log_expediente_operation';end if;
 definition:=replace(definition,anchor,'or (new.etapa in (''entrega'',''postventa'',''cerrado'') and not exists(select 1 from public.fortius_inmuebles_records p
      where p.collection=''propiedades'' and p.id=new.propiedad_slug and p.data->>''estado'' in (''vendida'',''rentada'')))');
 execute definition;
end; $$;

-- Mostrar como vendido o rentado un inmueble cuya operación ya cerró.
do $$ declare definition text; anchor text; begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_guided_publication()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 anchor:='and public.fortius_inmuebles_flow_publish_ready(e.id)) then';
 if (length(definition)-length(replace(definition,anchor,'')))/length(anchor)<>1 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_publication';end if;
 definition:=replace(definition,anchor,'and (public.fortius_inmuebles_flow_publish_ready(e.id)
     or (new.data->>''estado'' in (''vendida'',''rentada'') and e.etapa in (''cierre'',''entrega'',''postventa'',''cerrado'')))) then');
 execute definition;
end; $$;

notify pgrst, 'reload schema';
commit;
