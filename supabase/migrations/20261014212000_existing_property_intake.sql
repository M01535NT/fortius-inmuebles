begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);
-- Reuse is explicit. A matching address never silently identifies a unit.
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_save_intake(uuid,bigint,jsonb,boolean)'::regprocedure) into definition;
 if position('house:=e.propiedad_slug;' in definition)=0 then raise exception 'Unexpected intake property selection';end if;
 definition:=replace(definition,'house:=e.propiedad_slug;', $part$
 house:=e.propiedad_slug;
 if r.intencion in ('vender','arrendar') and nullif(btrim(p_answers->>'propiedadExistente'),'') is not null then
  if r.anterior_id is not null and p_answers->>'propiedadExistente' is distinct from house then raise sqlstate 'PT409' using message='Una corrección no sustituye la identidad del inmueble; cambia el contexto desde la guía';end if;
  select * into source from public.fortius_inmuebles_records where collection='propiedades' and id=p_answers->>'propiedadExistente' for update;
  if not found or not public.fortius_inmuebles_record_visible(source.collection,source.data)
   or (not public.fortius_inmuebles_is_admin() and source.data->>'asesorId' is distinct from r.asesor_id) then raise sqlstate 'PT403' using message='Inmueble existente fuera de tu alcance';end if;
  house:=source.id;
 end if;
 $part$);
 execute definition;
end; $$;
notify pgrst,'reload schema';
commit;
