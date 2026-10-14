-- Contact provenance and initial declarations; historical master data is retained.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_start_intake(uuid,text,jsonb,uuid)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('if normalized<>'''' and not (p_contact->>''telefonoCompartido'')::boolean and exists(select 1 from public.fortius_inmuebles_records x where x.collection in (''leads'',''clientes'') and public.fortius_inmuebles_record_visible(x.collection,x.data) and regexp_replace(x.data->>''telefono'',''[^0-9]'','''',''g'')=normalized)' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_start_intake';end if;
 definition:=replace(definition,'if normalized<>'''' and not (p_contact->>''telefonoCompartido'')::boolean and exists(select 1 from public.fortius_inmuebles_records x where x.collection in (''leads'',''clientes'') and public.fortius_inmuebles_record_visible(x.collection,x.data) and regexp_replace(x.data->>''telefono'',''[^0-9]'','''',''g'')=normalized)','if not (p_contact->>''telefonoCompartido'')::boolean and exists(select 1 from public.fortius_inmuebles_records x where x.collection in (''leads'',''clientes'') and public.fortius_inmuebles_record_visible(x.collection,x.data) and ((normalized<>'''' and regexp_replace(x.data->>''telefono'',''[^0-9]'','''',''g'')=normalized) or (coalesce(p_contact->>''email'','''')<>'''' and lower(btrim(x.data->>''email''))=lower(btrim(p_contact->>''email'')))))');
 if position('case when p_intent=''invertir'' then ''comprar'' else p_intent end' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_start_intake';end if;
 definition:=replace(definition,'case when p_intent=''invertir'' then ''comprar'' else p_intent end','p_intent');
 execute definition;
end; $$;
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_save_intake(uuid,bigint,jsonb,boolean)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('house text;property_id text;' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_save_intake';end if;
 definition:=replace(definition,'house text;property_id text;','declared_profile jsonb; house text;property_id text;');
 if position('if r.estado=''completada'' then' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_save_intake';end if;
 definition:=replace(definition,'if r.estado=''completada'' then','if jsonb_typeof(p_answers)=''object'' and not p_answers ? ''origenContacto'' and r.respuestas ? ''origenContacto'' then p_answers:=p_answers||jsonb_build_object(''origenContacto'',r.respuestas->>''origenContacto'');end if;
 if r.estado=''completada'' then');
 if position('first_admission:=r.expediente_id is null;' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_save_intake';end if;
 definition:=replace(definition,'first_admission:=r.expediente_id is null;','
 if new_conversion then
  select * into source from public.fortius_inmuebles_records where collection=''clientes'' and id=customer for update;
  if coalesce(source.data->''perfil''->>''operacion'',r.intencion)=r.intencion then
   declared_profile:=jsonb_strip_nulls(jsonb_build_object(''operacion'',r.intencion,
    ''plazo'',case when length(p_answers->>''plazo'')<=500 then p_answers->>''plazo'' end,
    ''caracteristicas'',case when r.intencion in (''vender'',''arrendar'') then nullif(p_answers->>''condiciones'','''') end,
    ''requisitos'',case when r.intencion not in (''vender'',''arrendar'') then nullif(p_answers->>''necesidades'','''') end,
    ''moneda'',case when p_answers->>''presupuestoEstado''=''conocido'' then p_answers->>''moneda'' end,
    ''estrategiaInversion'',case when r.intencion=''invertir'' then p_answers->>''estrategia'' end,
    ''horizonteInversion'',case when r.intencion=''invertir'' then p_answers->>''horizonte'' end,
    ''criteriosInversion'',case when r.intencion=''invertir'' then p_answers->>''criterios'' end,
    ''fuenteEntrevista'',''Declaraciones iniciales · entrevista ''||r.id::text||'' · versión ''||(r.version+1)::text||''; se conservan datos preexistentes''));
   if p_answers->>''presupuestoEstado''=''conocido'' and coalesce(source.data->''perfil''->>''moneda'',p_answers->>''moneda'')=p_answers->>''moneda'' then declared_profile:=declared_profile||jsonb_build_object(case when r.intencion in (''vender'',''arrendar'') then ''precioObjetivo'' when r.intencion=''invertir'' then ''capitalDeclarado'' else ''presupuestoDeclarado'' end,(p_answers->>''importe'')::numeric);end if;
   declared_profile:=declared_profile||coalesce(source.data->''perfil'',''{}''::jsonb);
   perform public.fortius_inmuebles_put_record(''clientes'',customer,source.data||jsonb_build_object(''perfil'',declared_profile,''zona'',coalesce(nullif(source.data->>''zona'',''''),left(p_answers->>''zona'',500)),''tipoPropiedad'',coalesce(nullif(source.data->>''tipoPropiedad'',''''),case when p_answers->>''tipoInmueble''<>''por_definir'' then p_answers->>''tipoInmueble'' else '''' end)),source.version);
  end if;
 end if;

 first_admission:=r.expediente_id is null;');
 execute definition;
end; $$;
notify pgrst,'reload schema';
commit;
