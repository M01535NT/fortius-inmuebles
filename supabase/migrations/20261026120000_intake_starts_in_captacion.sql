-- La operación creada al terminar el primer contacto se queda en captación (titular, 26/10/2026).
-- Desde el 16/10/2026 la venta del propietario tiene cuatro etapas dentro de captación
-- (Prospecto, Entrevista inicial, Levantamiento y Checklist de documentos) y salir de captación
-- exige la 02 y el 04 emitidos y el checklist completo. La regla del 14/10/2026 pasaba la operación
-- directo a documentación y se saltaba esas etapas y su candado. No cambia datos existentes.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_save_intake(uuid,bigint,jsonb,boolean)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('etapa=case when first_admission then ''documentacion'' else etapa end' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_save_intake';end if;
 if position('''Entrevista operativa completada; admisión a evaluación''' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_save_intake';end if;
 definition:=replace(definition,'etapa=case when first_admission then ''documentacion'' else etapa end','etapa=etapa');
 definition:=replace(definition,'''Entrevista operativa completada; admisión a evaluación''','''Primer contacto completado; la operación sigue en captación''');
 execute definition;
end; $$;
notify pgrst,'reload schema';
commit;
