-- Camino propio de la renta del propietario (COR-04, MRP-01 aprobada el 26/10/2026, RP-97).
-- Hasta ahora la ruta «arrendador» pedía para publicar lo mismo que una compraventa (factibilidad,
-- plan de comercialización) y, para cerrar, la revisión jurídica para el cierre (06). La renta
-- pide solo lo suyo:
--   documentación → entrevista;
--   publicación   → titularidad, opinión de renta, renta acordada, intermediación, levantamiento y publicación;
--   selección     → arrendatario identificado;
--   cierre        → arrendatario aceptado, garantías y contraparte;
--   entrega       → contrato de arrendamiento, firma y pago (depósito);
--   postventa     → entrega con inventario;
--   archivo       → término del encargo, honorarios y archivo.
-- Las demás rutas no cambian. No cambia ni borra datos: los requisitos ya registrados se conservan.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

create or replace function public.fortius_inmuebles_flow_required(route text,stage text) returns text[]
language plpgsql immutable set search_path='' as $body$
declare n integer:=array_position(array['captacion','documentacion','comercializacion','negociacion','cierre','entrega','postventa','cerrado'],stage)-1; keys text[]; owner boolean:=route='captacion'; rent boolean:=route='arrendatario';
begin
 if n<=0 then return array[]::text[];end if;
 if route='inversion' then
  keys:=array['perfil','privacidad'];
  if n>=2 then keys:=keys||array['criterios_inversion'];end if;
  if n>=3 then keys:=keys||array['riesgos_inversion'];end if;
  if n>=4 then keys:=keys||array['escenarios_inversion','capacidad'];end if;
  if n>=5 then keys:=keys||array['decision_inversion','ejecucion_inversion'];end if;
  if n>=6 then keys:=keys||array['seguimiento_inversion'];end if;
  if n>=7 then keys:=keys||array['honorarios','archivo'];end if;
  return keys;
 end if;
 if route='arrendador' then
  keys:=array['entrevista'];
  if n>=2 then keys:=keys||array['titularidad','valor','precio','intermediacion','levantamiento','publicacion'];end if;
  if n>=3 then keys:=keys||array['arrendatario'];end if;
  if n>=4 then keys:=keys||array['oferta','garantias_renta','contraparte'];end if;
  if n>=5 then keys:=keys||array['contrato_renta','firma','pago'];end if;
  if n>=6 then keys:=keys||array['entrega','inventario_entrega'];end if;
  if n>=7 then keys:=keys||array['termino_renta','honorarios','archivo'];end if;
  return keys;
 end if;
 keys:=case when owner then array['entrevista'] else array['perfil','privacidad'] end;
 if n>=2 then keys:=keys||case when owner then array['titularidad','factibilidad','valor','precio','intermediacion','levantamiento','plan','publicacion'] else array['opciones'] end;end if;
 if n>=3 then keys:=keys||case when owner then array['comprador'] else array['visitas','capacidad'] end;end if;
 if n>=4 then keys:=keys||case when rent then array['oferta','revision_cierre','contrato_renta','contraparte','garantias_renta'] else array['oferta','revision_cierre','instrumento','contraparte'] end;end if;
 if n>=5 then keys:=keys||array['firma','pago'];end if;
 if n>=6 then keys:=keys||case when rent then array['entrega','inventario_entrega'] else array['entrega'] end;end if;
 if n>=7 then keys:=keys||case when rent then array['termino_renta','honorarios','archivo'] else array['registro','honorarios','archivo'] end;end if;
 return keys;
end; $body$;
revoke all on function public.fortius_inmuebles_flow_required(text,text) from public,anon,authenticated,service_role;

notify pgrst, 'reload schema';
commit;
