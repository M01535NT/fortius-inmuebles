-- CAP-05 / COR-14: la llamada del propietario registra si mencionó un problema con el inmueble
-- («problema») y si debe un crédito o hipoteca («creditoInmueble»). Solo amplía las respuestas
-- aceptadas por la validación de la entrevista; no cambia tablas, permisos ni datos guardados.
begin;
select pg_advisory_xact_lock(781023);

do $$
declare definition text;
begin
 select pg_get_functiondef('public.fortius_inmuebles_validate_interview(text,jsonb,boolean)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 -- Ya aplicada: no se repite el reemplazo.
 if position($m$'propiedadExistente','problema','creditoInmueble'$m$ in definition)>0 then return;end if;
 if position($m$'origenContacto','propiedadExistente'$m$ in definition)=0
  or position($m$if is_owner and a->>'alertas'='declaradas' and coalesce(btrim(a->>'detalleAlertas'),'')='' then return false;end if;$m$ in definition)=0
 then raise exception 'Unexpected interview validation function public.fortius_inmuebles_validate_interview';end if;
 definition:=replace(definition,$m$'origenContacto','propiedadExistente'$m$,$m$'origenContacto','propiedadExistente','problema','creditoInmueble'$m$);
 definition:=replace(definition,
  $m$if is_owner and a->>'alertas'='declaradas' and coalesce(btrim(a->>'detalleAlertas'),'')='' then return false;end if;$m$,
  $m$if is_owner and a->>'alertas'='declaradas' and coalesce(btrim(a->>'detalleAlertas'),'')='' then return false;end if;
 if is_owner and (coalesce(a->>'problema','') not in ('','ninguno','ocupado_sin_permiso','herencia','adeudos','juicio','otro') or coalesce(a->>'creditoInmueble','') not in ('','no','infonavit','fovissste','banco','otro','no_sabe')) then return false;end if;
 if is_owner and coalesce(a->>'problema','ninguno') not in ('','ninguno') and coalesce(btrim(a->>'detalleAlertas'),'')='' then return false;end if;$m$);
 execute definition;
end; $$;
notify pgrst,'reload schema';
commit;
