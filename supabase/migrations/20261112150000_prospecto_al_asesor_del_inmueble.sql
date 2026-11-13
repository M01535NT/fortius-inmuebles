-- COR-21: un prospecto que llega por el sitio con un inmueble de interés queda asignado al asesor
-- de ese inmueble (si está activo), y así lo ve en Hoy y en Contactos. Sin inmueble, o con un
-- inmueble sin asesor activo, sigue sin asesor y le toca al director. Solo cambia la captura
-- pública; no toca tablas, permisos ni prospectos ya guardados.
begin;
select pg_advisory_xact_lock(781023);

do $$
declare definition text; anchor text := $m$perform public.fortius_inmuebles_validate_record('leads',lead_id,d);$m$;
begin
 select pg_get_functiondef('public.fortius_inmuebles_capture_lead(jsonb,text)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 -- Ya aplicada: no se repite el reemplazo.
 if position($m$jsonb_build_object('asesorId',a.id)$m$ in definition)>0 then return;end if;
 if position(anchor in definition)=0
  or position($m$public.fortius_inmuebles_pick(p_data,array['nombre','telefono','email','origen','propiedadSlug','zona','tipoPropiedad','mensaje'])$m$ in definition)=0
 then raise exception 'Unexpected lead capture function public.fortius_inmuebles_capture_lead';end if;
 definition:=replace(definition,anchor,
  $m$d:=d || coalesce((select jsonb_build_object('asesorId',a.id) from public.fortius_inmuebles_records p
    join public.fortius_inmuebles_records a on a.collection='asesores' and a.id=p.data->>'asesorId' and a.data->>'activo'='true'
    where p.collection='propiedades' and p.id=d->>'propiedadSlug' and coalesce(d->>'propiedadSlug','')<>''),'{}'::jsonb);
  $m$||anchor);
 execute definition;
end; $$;
notify pgrst,'reload schema';
commit;
