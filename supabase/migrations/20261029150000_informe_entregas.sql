-- Entrega del informe al propietario (COR-08, RP-88, 29/10/2026): preparado no es entregado.
-- La guía de la operación acepta la lista «entregasInforme», capturada a mano: fecha, canal y
-- responsable de cada entrega. El aviso de informe vencido usa la última entrega cuando existe.
-- Solo amplía los campos permitidos de la guía y valida su forma; no cambia datos existentes.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';

do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_guided_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('''requisitos'',''contraparteId'',''contraparteExterna'',''resolucion'')' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,'''requisitos'',''contraparteId'',''contraparteExterna'',''resolucion'')','''requisitos'',''contraparteId'',''contraparteExterna'',''resolucion'',''entregasInforme'')');
 if position('if exists(select 1 from jsonb_object_keys(new.flujo) key' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,'if exists(select 1 from jsonb_object_keys(new.flujo) key','
   if new.flujo ? ''entregasInforme'' and (jsonb_typeof(new.flujo->''entregasInforme'')<>''array'' or jsonb_array_length(new.flujo->''entregasInforme'')>120
     or exists(select 1 from jsonb_array_elements(new.flujo->''entregasInforme'') entrega_informe where jsonb_typeof(entrega_informe)<>''object''
       or exists(select 1 from jsonb_object_keys(entrega_informe) campo_entrega where campo_entrega not in (''fecha'',''canal'',''responsable'',''registradoEl''))
       or coalesce(entrega_informe->>''fecha'','''') !~ ''^\d{4}-\d{2}-\d{2}$''
       or coalesce(entrega_informe->>''canal'','''') not in (''whatsapp'',''correo'',''en_persona'',''telefono'',''otro'')
       or jsonb_typeof(entrega_informe->''responsable'') is distinct from ''string'' or length(btrim(entrega_informe->>''responsable'')) not between 1 and 160)) then
     raise sqlstate ''PT400'' using message=''Entrega del informe inválida'';
   end if;
   if exists(select 1 from jsonb_object_keys(new.flujo) key');
 execute definition;
end; $$;

notify pgrst, 'reload schema';
commit;
