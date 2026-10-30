-- Una sola lista de tipos de inmueble (titular, 27/10/2026): los siete de sus plantillas, con
-- su levantamiento (04A–04G). Se agrega «plaza» (plaza o conjunto), que se publica como un
-- inmueble más; en la ficha, en el primer contacto y en el inmueble que nace de la captación.
-- «nave-industrial» se rotula «Nave o bodega», como la plantilla. No cambia datos existentes.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_validate_record(text,text,jsonb)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position($m$d->>'tipo' not in ('casa','departamento','terreno','local','oficina','nave-industrial')$m$ in definition)=0 then raise exception 'Unexpected record validation function public.fortius_inmuebles_validate_record';end if;
 definition:=replace(definition,$m$d->>'tipo' not in ('casa','departamento','terreno','local','oficina','nave-industrial')$m$,$m$d->>'tipo' not in ('casa','departamento','terreno','local','oficina','nave-industrial','plaza')$m$);
 execute definition;

 select pg_get_functiondef('public.fortius_inmuebles_validate_interview(text,jsonb,boolean)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position($m$a->>'tipoInmueble' not in ('casa','departamento','terreno','local','oficina','nave-industrial','por_definir')$m$ in definition)=0 then raise exception 'Unexpected interview validation function public.fortius_inmuebles_validate_interview';end if;
 definition:=replace(definition,$m$a->>'tipoInmueble' not in ('casa','departamento','terreno','local','oficina','nave-industrial','por_definir')$m$,$m$a->>'tipoInmueble' not in ('casa','departamento','terreno','local','oficina','nave-industrial','plaza','por_definir')$m$);
 execute definition;

 select pg_get_functiondef('public.fortius_inmuebles_save_intake(uuid,bigint,jsonb,boolean)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position($m$when 'nave-industrial' then 'Nave industrial' else 'Inmueble' end$m$ in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_save_intake';end if;
 definition:=replace(definition,$m$when 'nave-industrial' then 'Nave industrial' else 'Inmueble' end$m$,$m$when 'nave-industrial' then 'Nave o bodega' when 'plaza' then 'Plaza o conjunto' else 'Inmueble' end$m$);
 execute definition;
end; $$;
notify pgrst,'reload schema';
commit;
