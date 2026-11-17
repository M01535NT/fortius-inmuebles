-- FLX-03, parte A (RP-100, titular 14/11/2026; aprobada para construir el 15/11/2026): de frenos a avisos.
-- Ningún requisito detiene avanzar de etapa, archivar, publicar un inmueble, firmar con la
-- cancelación de hipoteca pendiente, autorizar una visita antes de la firma ni cerrar un paso de un
-- trámite. Lo que faltaba queda anotado en el historial del asunto como «Aviso», con quién siguió
-- adelante y cuándo; en un trámite, en su propio historial; en un compartido, en el historial del
-- inmueble. La anotación la escribe la base: la pantalla no puede saltársela.
-- Siguen frenando, porque no son requisitos sino protecciones: los permisos (quién publica un
-- compartido, quién autoriza una visita, reasigna o cambia lo de otro), la integridad (versiones,
-- historial y notas que no se borran, datos inválidos, documentos privados que de verdad se
-- subieron) y la dirección exacta en lo publicado.
-- Se quedan para la parte B: iniciar en otra etapa y cambiar el tipo de un asunto avanzado.
-- No reescribe registros: las operaciones conservan etapa, documentos y formatos.
begin;
set local lock_timeout='2s';
set local statement_timeout='30s';
select pg_advisory_xact_lock(781023);

-- 1. El historial del asunto acepta avisos. Solo los escribe la base (la regla de inserción del
--    equipo sigue permitiendo únicamente notas).
alter table public.fortius_inmuebles_expediente_actividad drop constraint if exists fortius_inmuebles_expediente_actividad_tipo_check;
alter table public.fortius_inmuebles_expediente_actividad add constraint fortius_inmuebles_expediente_actividad_tipo_check
  check (tipo in ('nota','cambio','aviso'));

-- 2. Nombres en palabras para el historial (los mismos de la pantalla).
create or replace function public.fortius_inmuebles_requisito_nombre(k text) returns text
language sql immutable set search_path='' as $$
 select case k
  when 'arrendatario' then 'Arrendatario identificado y capacidad comprobada'
  when 'contrato_renta' then 'Contrato de arrendamiento y condiciones acordadas'
  when 'garantias_renta' then 'Depósito y garantías según acuerdo, o no aplicabilidad justificada'
  when 'inventario_entrega' then 'Inventario, estado físico, llaves y entrega acordados'
  when 'termino_renta' then 'Término del encargo y obligaciones de seguimiento definidos'
  when 'criterios_inversion' then 'Mandato, criterios, horizonte y límites acordados'
  when 'escenarios_inversion' then 'Escenarios, fuentes, supuestos y sensibilidad revisados'
  when 'riesgos_inversion' then 'Diligencia proporcional, limitaciones y riesgos documentados'
  when 'decision_inversion' then 'Decisión informada y capital comprometido autorizados'
  when 'ejecucion_inversion' then 'Ejecución elegida y operación correspondiente vinculada'
  when 'seguimiento_inversion' then 'Seguimiento de escenarios y resultados acordado'
  when 'entrevista' then 'Entrevista y objetivo del propietario'
  when 'titularidad' then 'Identidad, representación y antecedente de propiedad'
  when 'perfil' then 'Perfil, necesidades y participantes del encargo'
  when 'capacidad' then 'Presupuesto, recursos y crédito comprobados'
  when 'privacidad' then 'Aviso de privacidad y controles aplicables'
  when 'factibilidad' then 'Factibilidad documentada y condiciones resueltas'
  when 'valor' then 'Opinión de valor y fuentes'
  when 'precio' then 'Precio y condiciones acordados con el propietario'
  when 'intermediacion' then 'Intermediación formalizada y autorización'
  when 'levantamiento' then 'Levantamiento y material comercial verificados'
  when 'plan' then 'Plan de comercialización aprobado'
  when 'publicacion' then 'Información y publicación autorizadas'
  when 'opciones' then 'Opciones acordes al perfil y disponibilidad'
  when 'comprador' then 'Comprador identificado y capacidad comprobada'
  when 'visitas' then 'Visitas, resultados y elección del inmueble'
  when 'oferta' then 'Oferta y condiciones aceptadas'
  when 'revision_cierre' then 'Revisión actualizada para contratar y cerrar'
  when 'instrumento' then 'Instrumento, anticipos, custodia y devoluciones definidos'
  when 'contraparte' then 'Participantes y contraparte relacionados e identificados'
  when 'identificacion_pld' then 'Expediente de identificación de las partes (LFPIORPI)'
  when 'firma' then 'Firma e instrumento acreditados'
  when 'pago' then 'Condiciones de pago para entrega cumplidas según acuerdo'
  when 'entrega' then 'Entrega material y acta con pendientes asentados'
  when 'registro' then 'Trámite registral y pendientes atendidos'
  when 'honorarios' then 'Honorarios y cobros conforme al contrato'
  when 'archivo' then 'Postventa, pendientes resueltos y operación archivada'
  else k end
$$;
create or replace function public.fortius_inmuebles_etapa_nombre(e text) returns text
language sql immutable set search_path='' as $$
 select case e when 'captacion' then 'Captación' when 'documentacion' then 'Documentación' when 'comercializacion' then 'Comercialización'
  when 'negociacion' then 'Negociación' when 'cierre' then 'Cierre' when 'entrega' then 'Entrega' when 'postventa' then 'Postventa'
  when 'cerrado' then 'Archivo' else e end
$$;

-- 3. Los avisos de un guardado se juntan mientras corren las revisiones y se anotan en una sola
--    línea al terminar. Viven solo dentro de la transacción: si el guardado falla, no queda nada.
create or replace function public.fortius_inmuebles_avisar(exp uuid, texto text) returns void
language plpgsql security definer set search_path='' as $$
declare pend jsonb:=coalesce(nullif(current_setting('fortius.avisos',true),''),'{}')::jsonb; lista jsonb;
begin
 if exp is null or length(btrim(coalesce(texto,'')))=0 then return; end if;
 lista:=coalesce(pend->(exp::text),'[]'::jsonb);
 if lista ? texto then return; end if;
 perform set_config('fortius.avisos',jsonb_set(pend,array[exp::text],lista||to_jsonb(texto))::text,true);
end; $$;
revoke all on function public.fortius_inmuebles_avisar(uuid,text) from public,anon,authenticated;

create or replace function public.fortius_inmuebles_anotar_avisos() returns trigger
language plpgsql security definer set search_path='' as $$
declare pend jsonb:=coalesce(nullif(current_setting('fortius.avisos',true),''),'{}')::jsonb; lista jsonb; texto text;
begin
 lista:=pend->(new.id::text);
 if lista is null or jsonb_array_length(lista)=0 then return null; end if;
 perform set_config('fortius.avisos',(pend-(new.id::text))::text,true);
 texto:=case when tg_op='UPDATE' and new.etapa is distinct from old.etapa
   then 'Pasó a «'||public.fortius_inmuebles_etapa_nombre(new.etapa)||'» sin: ' else 'Se guardó sin: ' end
   ||(select string_agg(x,'; ') from jsonb_array_elements_text(lista) x);
 -- Sin sesión no hay a quién anotar (procesos del sistema); el cambio de etapa queda en «Cambio».
 if auth.uid() is not null then
  insert into public.fortius_inmuebles_expediente_actividad(expediente_id,tipo,descripcion,created_by,detalle)
  values(new.id,'aviso',left(texto,1000),auth.uid(),jsonb_build_object('faltaba',lista,'etapa',new.etapa));
 end if;
 return null;
end; $$;
revoke all on function public.fortius_inmuebles_anotar_avisos() from public,anon,authenticated;
drop trigger if exists fortius_zz_anotar_avisos on public.fortius_inmuebles_expedientes;
create trigger fortius_zz_anotar_avisos after insert or update on public.fortius_inmuebles_expedientes
  for each row execute function public.fortius_inmuebles_anotar_avisos();

-- 4. Avanzar de etapa: cada freno pasa a aviso. Se conservan la validación de los datos de la guía,
--    los permisos de captación y contraparte, y que una operación nueva empiece en captación.
CREATE OR REPLACE FUNCTION public.fortius_inmuebles_guard_guided_operation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare k text; r jsonb; previous jsonb; stages text[]:=array['captacion','documentacion','comercializacion','negociacion','cierre','entrega','postventa','cerrado'];
 old_stage integer; new_stage integer; context_changed boolean:=false; counterpart uuid; buyer_only boolean:=false; reset_review boolean; buyer_changed boolean:=false; faltan text[]:=array[]::text[];
begin
 perform pg_catalog.pg_advisory_xact_lock(781023);
 if tg_op='UPDATE' then
   if new.operacion is distinct from old.operacion and (old.etapa<>'captacion' or new.etapa<>'captacion' or old.flujo is not null or new.flujo is not null) then
     raise sqlstate 'PT409' using message='No cambies el tipo de una operación avanzada; conserva su historial';
   end if;
   context_changed:=new.propiedad_slug is distinct from old.propiedad_slug or new.cliente_id is distinct from old.cliente_id
     or new.asesor_id is distinct from old.asesor_id or (old.flujo is not null and
       (new.flujo->>'ruta' is distinct from old.flujo->>'ruta' or new.flujo->>'contraparteId' is distinct from old.flujo->>'contraparteId'
        or new.flujo->>'contraparteExterna' is distinct from old.flujo->>'contraparteExterna'));
   if old.flujo is not null and new.flujo is null then raise sqlstate 'PT409' using message='La guía no se elimina; registra pausa o descarte'; end if;
   -- M-03 y M-04: el lado del propietario no cambió; solo la contraparte (se cayó el comprador) o el asesor (reasignación).
   buyer_only:=context_changed and new.propiedad_slug is not distinct from old.propiedad_slug and new.cliente_id is not distinct from old.cliente_id
     and new.flujo->>'ruta' is not distinct from old.flujo->>'ruta';
   buyer_changed:=old.flujo is not null and (new.flujo->>'contraparteId' is distinct from old.flujo->>'contraparteId'
     or new.flujo->>'contraparteExterna' is distinct from old.flujo->>'contraparteExterna');
   -- M-04: «captó» lo escribe solo la reasignación; cualquier otro cambio se rechaza. Si un guardado lo omite, se conserva.
   if new.flujo is not null and coalesce(current_setting('fortius.reasignando',true),'')<>'1' then
     if new.flujo ? 'captadoPor' and new.flujo->'captadoPor' is distinct from old.flujo->'captadoPor' then
       raise sqlstate 'PT403' using message='El asesor que captó solo cambia al reasignar la operación';
     end if;
     if old.flujo ? 'captadoPor' then new.flujo:=jsonb_set(new.flujo,'{captadoPor}',old.flujo->'captadoPor'); end if;
   end if;
 end if;
 if tg_op='INSERT' and new.flujo ? 'captadoPor' then raise sqlstate 'PT403' using message='El asesor que captó solo cambia al reasignar la operación'; end if;
 if new.flujo is not null then
   if new.operacion not in ('venta','renta','inversion') or (new.flujo->>'ruta' in ('captacion','compra') and new.operacion<>'venta') or (new.flujo->>'ruta' in ('arrendador','arrendatario') and new.operacion<>'renta') or (new.flujo->>'ruta'='inversion' and new.operacion<>'inversion') or jsonb_typeof(new.flujo)<>'object' or octet_length(new.flujo::text)>200000
     or new.flujo->'version' is distinct from '1'::jsonb or jsonb_typeof(new.flujo->'ruta') is distinct from 'string' or jsonb_typeof(new.flujo->'estado') is distinct from 'string' or new.flujo->>'ruta' is null or new.flujo->>'ruta' not in ('captacion','compra','arrendador','arrendatario','inversion')
     or new.flujo->>'estado' is null or new.flujo->>'estado' not in ('activa','pausada','regularizacion','descartada')
     or jsonb_typeof(new.flujo->'requisitos') is distinct from 'object' then
     raise sqlstate 'PT400' using message='Guía de operación inválida';
   end if;
   if (new.flujo ? 'motivo' and jsonb_typeof(new.flujo->'motivo') is distinct from 'string')
     or (new.flujo ? 'contraparteExterna' and jsonb_typeof(new.flujo->'contraparteExterna') is distinct from 'string')
     or (new.flujo ? 'contraparteId' and jsonb_typeof(new.flujo->'contraparteId') is distinct from 'string') then
     raise sqlstate 'PT400' using message='Tipo de dato de guía inválido'; end if;
   new.flujo:=jsonb_set(new.flujo,'{motivo}',to_jsonb(coalesce(new.flujo->>'motivo','')));
   if length(coalesce(new.flujo->>'motivo',''))>1000 or (new.flujo->>'estado'<>'activa' and length(btrim(coalesce(new.flujo->>'motivo','')))<3) then
     raise sqlstate 'PT400' using message='Registra el motivo de pausa, regularización o descarte'; end if;
   
   if new.flujo ? 'resolucion' then
    r:=new.flujo->'resolucion';
    if jsonb_typeof(r)<>'object' or exists(select 1 from jsonb_object_keys(r) x where x not in ('tipo','fecha','motivo','condiciones','permitidas','siguienteAccion','fechaSiguiente'))
     or coalesce(r->>'tipo','') not in ('aceptada','condicionada','pausada','rechazada','referida','cancelada')
     or jsonb_typeof(r->'motivo') is distinct from 'string' or length(btrim(r->>'motivo')) not between 3 and 1000
     or jsonb_typeof(r->'siguienteAccion') is distinct from 'string' or length(btrim(r->>'siguienteAccion')) not between 1 and 160
     or jsonb_typeof(r->'fecha') is distinct from 'string' or jsonb_typeof(r->'fechaSiguiente') is distinct from 'string'
     or (r->>'fecha') !~ '^\d{4}-\d{2}-\d{2}$' or (r->>'fechaSiguiente') !~ '^\d{4}-\d{2}-\d{2}$'
     then raise sqlstate 'PT400' using message='Resolución y siguiente acción incompletas';end if;
    if to_char((r->>'fecha')::date,'YYYY-MM-DD')<>r->>'fecha' or to_char((r->>'fechaSiguiente')::date,'YYYY-MM-DD')<>r->>'fechaSiguiente' then raise sqlstate 'PT400' using message='Fecha de resolución inválida';end if;
    if r->>'tipo'='condicionada' and (jsonb_typeof(r->'condiciones') is distinct from 'string' or length(btrim(r->>'condiciones')) not between 3 and 1000) then raise sqlstate 'PT400' using message='Documenta las condiciones';end if;
    if r ? 'permitidas' then
     if jsonb_typeof(r->'permitidas')<>'array' or jsonb_array_length(r->'permitidas')>8 then raise sqlstate 'PT400' using message='Actividades permitidas inválidas';end if;
     if exists(select 1 from jsonb_array_elements_text(r->'permitidas') x where x<>all(stages)) then raise sqlstate 'PT400' using message='Actividad desconocida';end if;
    end if;
    if r->>'tipo'='pausada' then new.flujo:=jsonb_set(new.flujo,'{estado}','"pausada"'::jsonb);
    elsif r->>'tipo' in ('rechazada','referida','cancelada') then new.flujo:=jsonb_set(new.flujo,'{estado}','"descartada"'::jsonb);end if;
    if new.flujo->>'estado'<>'activa' and length(btrim(coalesce(new.flujo->>'motivo','')))<3 then new.flujo:=jsonb_set(new.flujo,'{motivo}',r->'motivo');end if;
   end if;

   
   if new.flujo ? 'entregasInforme' and (jsonb_typeof(new.flujo->'entregasInforme')<>'array' or jsonb_array_length(new.flujo->'entregasInforme')>120
     or exists(select 1 from jsonb_array_elements(new.flujo->'entregasInforme') entrega_informe where jsonb_typeof(entrega_informe)<>'object'
       or exists(select 1 from jsonb_object_keys(entrega_informe) campo_entrega where campo_entrega not in ('fecha','canal','responsable','registradoEl'))
       or coalesce(entrega_informe->>'fecha','') !~ '^\d{4}-\d{2}-\d{2}$'
       or coalesce(entrega_informe->>'canal','') not in ('whatsapp','correo','en_persona','telefono','otro')
       or jsonb_typeof(entrega_informe->'responsable') is distinct from 'string' or length(btrim(entrega_informe->>'responsable')) not between 1 and 160)) then
     raise sqlstate 'PT400' using message='Entrega del informe inválida';
   end if;
   
   if new.flujo->>'ruta' in ('compra','arrendatario') and (tg_op='INSERT' or (old.flujo is not null and old.flujo->>'ruta' is distinct from new.flujo->>'ruta')) then
     raise sqlstate 'PT400' using message='Quien busca comprar o rentar se sigue como interesado; no se abre operación';
   end if;
   if new.flujo ? 'contraparteLeadId' and (jsonb_typeof(new.flujo->'contraparteLeadId')<>'string' or length(new.flujo->>'contraparteLeadId') not between 1 and 200
     or new.flujo ? 'contraparteId' or not exists(select 1 from public.fortius_inmuebles_records lead_record where lead_record.collection='leads' and lead_record.id=new.flujo->>'contraparteLeadId'
       /* SEG-B12 */ and (auth.uid() is null or (old.flujo is not null and old.flujo->>'contraparteLeadId' is not distinct from new.flujo->>'contraparteLeadId')
         or public.fortius_inmuebles_record_visible(lead_record.collection,lead_record.data)))) then
     raise sqlstate 'PT400' using message='Interesado de la contraparte inválido';
   end if;
   
   if new.flujo ? 'firmaContrato' or coalesce(case when tg_op='UPDATE' then old.flujo ? 'firmaContrato' end,false) then
     new.flujo:=jsonb_set(new.flujo,'{firmaContrato}',public.fortius_inmuebles_contract_signature(new.flujo->'firmaContrato',case when tg_op='UPDATE' then old.flujo->'firmaContrato' end,new.id,coalesce(context_changed and not buyer_only,false)));
   end if;
   if new.flujo ? 'avaluo' then
     new.flujo:=jsonb_set(new.flujo,'{avaluo}',public.fortius_inmuebles_owner_appraisal(new.flujo->'avaluo',case when tg_op='UPDATE' then old.flujo->'avaluo' end,new.id,coalesce(context_changed and not buyer_only,false)));
   end if;
   if new.flujo ? 'cierre' then
     new.flujo:=jsonb_set(new.flujo,'{cierre}',public.fortius_inmuebles_operation_close(new.flujo->'cierre',case when tg_op='UPDATE' then old.flujo->'cierre' end));
   end if;
   if new.flujo ? 'visitasPrevias' or (tg_op='UPDATE' and old.flujo ? 'visitasPrevias') then
     new.flujo:=case when public.fortius_inmuebles_prior_visits(new.flujo->'visitasPrevias',case when tg_op='UPDATE' then old.flujo->'visitasPrevias' end) is null
       then new.flujo-'visitasPrevias'
       else jsonb_set(new.flujo,'{visitasPrevias}',public.fortius_inmuebles_prior_visits(new.flujo->'visitasPrevias',case when tg_op='UPDATE' then old.flujo->'visitasPrevias' end)) end;
     -- DEC-41 con FLX-03: una visita nueva sin la carta del propietario se autoriza y queda el aviso.
     if exists(select 1 from jsonb_array_elements(coalesce(new.flujo->'visitasPrevias','[]'::jsonb)) v
       where not (v ? 'carta') and not exists(select 1 from jsonb_array_elements(case when tg_op='UPDATE' then coalesce(old.flujo->'visitasPrevias','[]'::jsonb) else '[]'::jsonb end) p
         where p->>'id'=v->>'id' and not (p ? 'carta'))) then
       perform public.fortius_inmuebles_avisar(new.id,'La carta de autorización de visita firmada por el propietario');
     end if;
   end if;
   if exists(select 1 from jsonb_object_keys(new.flujo) key where key not in ('version','ruta','estado','motivo','requisitos','contraparteId','contraparteExterna','resolucion','entregasInforme','contraparteLeadId','firmaContrato','avaluo','cierre','heredado','visitasPrevias','captadoPor')) then
     raise sqlstate 'PT400' using message='Campo de guía desconocido'; end if;
   if new.propiedad_slug is not null and new.flujo->>'ruta' in ('captacion','arrendador') and not exists(
     select 1 from public.fortius_inmuebles_records p where p.collection='propiedades' and p.id=new.propiedad_slug
       and (public.fortius_inmuebles_is_admin() or p.data->>'asesorId'=new.asesor_id)) then
     raise sqlstate 'PT403' using message='La captación debe corresponder al asesor titular del inmueble';
   end if;
   if new.flujo ? 'contraparteId' then
     counterpart:=(new.flujo->>'contraparteId')::uuid;
     new.flujo:=jsonb_set(new.flujo,'{contraparteId}',to_jsonb(counterpart::text));
     if nullif(new.flujo->>'contraparteExterna','') is not null or counterpart=new.id then
       raise sqlstate 'PT400' using message='Referencia de contraparte inválida'; end if;
     if (tg_op='INSERT' or context_changed) and (not public.fortius_inmuebles_can_access_expediente(counterpart)
       or not exists(select 1 from public.fortius_inmuebles_expedientes e where e.id=counterpart and e.operacion=new.operacion
         and e.flujo->>'ruta'<>new.flujo->>'ruta' and e.flujo->>'estado'='activa' and e.propiedad_slug=new.propiedad_slug and e.cliente_id<>new.cliente_id)) then
       raise sqlstate 'PT403' using message='Contraparte incompatible o fuera de tu alcance'; end if;
   end if;
   if length(coalesce(new.flujo->>'contraparteExterna',''))>1000 then raise sqlstate 'PT400' using message='Referencia de contraparte demasiado grande'; end if;
   if tg_op='UPDATE' and old.flujo is not null then
     new.flujo:=jsonb_set(new.flujo,'{requisitos}',coalesce(old.flujo->'requisitos','{}'::jsonb) || (new.flujo->'requisitos'));
   end if;
   for k,r in select key,value from jsonb_each(new.flujo->'requisitos') loop
     if k not in ('arrendatario','contrato_renta','garantias_renta','inventario_entrega','termino_renta','criterios_inversion','escenarios_inversion','riesgos_inversion','decision_inversion','ejecucion_inversion','seguimiento_inversion','entrevista','titularidad','perfil','capacidad','privacidad','factibilidad','valor','precio','intermediacion','levantamiento','plan','publicacion','opciones','comprador','visitas','oferta','revision_cierre','instrumento','contraparte','firma','pago','entrega','registro','honorarios','archivo','identificacion_pld')
       or jsonb_typeof(r)<>'object' or jsonb_typeof(r->'estado') is distinct from 'string' or (r ? 'vigenteHasta' and jsonb_typeof(r->'vigenteHasta') is distinct from 'string') or r->>'estado' is null or r->>'estado' not in ('pendiente','recibido','revisado','observado','no_aplica')
       or jsonb_typeof(r->'soporte') is distinct from 'string' or length(r->>'soporte')>1000
       or exists(select 1 from jsonb_object_keys(r) key where key not in ('estado','soporte','vigenteHasta','registradoPor','registradoEl','evidencia','bloquea','excepcion')) then
       raise sqlstate 'PT400' using message='Revisión de requisito inválida'; end if;
     
     if r ? 'evidencia' then
      if jsonb_typeof(r->'evidencia')<>'object' or exists(select 1 from jsonb_object_keys(r->'evidencia') x where x not in ('tipo','referencia','version','fecha','responsable','resultado','limites')) then raise sqlstate 'PT400' using message='Referencia de evidencia inválida';end if;
     end if;
     if r ? 'bloquea' then
      if jsonb_typeof(r->'bloquea')<>'array' or jsonb_array_length(r->'bloquea')>8 then raise sqlstate 'PT400' using message='Alcance de observación inválido';end if;
      if exists(select 1 from jsonb_array_elements_text(r->'bloquea') x where x<>all(stages)) then raise sqlstate 'PT400' using message='Actividad bloqueada desconocida';end if;
     end if;
     if r->>'estado'='revisado' and not reset_review and (tg_op='INSERT' or (r-'registradoPor'-'registradoEl') is distinct from ((old.flujo->'requisitos'->k)-'registradoPor'-'registradoEl')) then
      if not public.fortius_inmuebles_evidence_ok(r->'evidencia') then raise sqlstate 'PT400' using message='Registra evidencia existente/versionada o externa con fecha, responsable y resultado';end if;
      if r->'evidencia'->>'tipo'<>'externa' and public.fortius_inmuebles_evidence_expediente(r->'evidencia') is distinct from new.id then raise sqlstate 'PT403' using message='La evidencia no corresponde al expediente';end if;
     end if;

     if r->>'estado' in ('revisado','observado','no_aplica') and length(btrim(r->>'soporte'))<3 then
       raise sqlstate 'PT400' using message='La revisión necesita soporte o justificación'; end if;
     if r->>'estado'='no_aplica' and k not in ('registro','honorarios','garantias_renta') then raise sqlstate 'PT400' using message='Este requisito no admite no aplicabilidad'; end if;
     if r ? 'vigenteHasta' then
       if (r->>'vigenteHasta') !~ '^\d{4}-\d{2}-\d{2}$' then raise sqlstate 'PT400' using message='Vigencia inválida'; end if;
       perform (r->>'vigenteHasta')::date;
     elsif k in ('factibilidad','revision_cierre') and r->>'estado'='revisado' then
       raise sqlstate 'PT400' using message='Declara la vigencia de la revisión competente';
     end if;
     previous:=case when tg_op='UPDATE' then old.flujo->'requisitos'->k else null end;
     reset_review:=context_changed and (not buyer_only or buyer_changed and k in ('comprador','arrendatario','visitas','oferta','revision_cierre','instrumento','contraparte',
       'contrato_renta','garantias_renta','firma','pago','entrega','inventario_entrega','registro','termino_renta','honorarios','archivo'));
     if reset_review then
       -- Preserve the evidence, but a review of the old context cannot authorize the new one.
       if r->>'estado' in ('revisado','no_aplica') then r:=jsonb_set(r,'{estado}','"recibido"'::jsonb); end if;
       r:=r-'excepcion';
     end if;
     if reset_review or (r - 'registradoPor' - 'registradoEl') is distinct from (previous - 'registradoPor' - 'registradoEl') then
       if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida para registrar revisión'; end if;
       r:=(r - 'registradoPor' - 'registradoEl') || jsonb_build_object('registradoPor',auth.uid(),'registradoEl',clock_timestamp());
     else r:=previous; end if;
     new.flujo:=jsonb_set(new.flujo,array['requisitos',k],r);
   end loop;
 end if;
 if new.operacion in ('venta','renta','inversion') then
   if tg_op='INSERT' and new.etapa<>'captacion' then raise sqlstate 'PT409' using message='La operación inicia en captación o perfil'; end if;
   if tg_op='UPDATE' and new.etapa is distinct from old.etapa then
     -- FLX-03 (RP-100): nada de esto detiene el paso; lo que falta queda anotado en el historial del asunto.
     old_stage:=array_position(stages,old.etapa);new_stage:=array_position(stages,new.etapa);
     if new.flujo is null then
       perform public.fortius_inmuebles_avisar(new.id,'La guía del asunto');
     else
       if new.flujo->>'estado'<>'activa' then
         perform public.fortius_inmuebles_avisar(new.id,'Reactivar el asunto (estaba '||case new.flujo->>'estado' when 'pausada' then 'en pausa' when 'regularizacion' then 'en regularización' else 'descartado' end||')');
       end if;
       if context_changed then perform public.fortius_inmuebles_avisar(new.id,'Guardar primero el cambio de inmueble, cliente o contraparte'); end if;
       if new_stage>old_stage+1 then perform public.fortius_inmuebles_avisar(new.id,'Las etapas intermedias'); end if;
       if new_stage<old_stage then
         if length(btrim(coalesce(new.flujo->>'motivo','')))<3 then perform public.fortius_inmuebles_avisar(new.id,'El motivo del regreso'); end if;
       else
         if public.fortius_inmuebles_observation_blocks(new.flujo,new.etapa) then perform public.fortius_inmuebles_avisar(new.id,'Resolver las observaciones abiertas'); end if;
         if not public.fortius_inmuebles_resolution_allows(new.flujo,new.etapa) then perform public.fortius_inmuebles_avisar(new.id,'Una decisión del encargo que autorice esta etapa'); end if;
         if new.flujo->>'ruta' in ('captacion','arrendador') and new_stage>=3 and not public.fortius_inmuebles_signature_ok(new.flujo) then
           perform public.fortius_inmuebles_avisar(new.id,'La firma del contrato revisada por el director'); end if;
         if new.flujo->>'ruta' in ('captacion','arrendador') and new.etapa='cerrado' and not (new.flujo ? 'cierre') then
           perform public.fortius_inmuebles_avisar(new.id,'Quién captó y quién vendió'); end if;
         -- Los requisitos van en un solo aviso: con más de tres se nombran los primeros y se cuentan los demás.
         foreach k in array coalesce(public.fortius_inmuebles_flow_required(new.flujo->>'ruta',new.etapa),array[]::text[]) loop
           if not public.fortius_inmuebles_flow_review_ok(new.flujo,k) then faltan:=faltan||public.fortius_inmuebles_requisito_nombre(k); end if;
         end loop;
         if cardinality(faltan)>0 then
           perform public.fortius_inmuebles_avisar(new.id,case when cardinality(faltan)<=3 then array_to_string(faltan,'; ')
             else array_to_string(faltan[1:3],'; ')||' y '||(cardinality(faltan)-3)||' requisitos más' end);
         end if;
         if new.flujo->>'ruta'<>'inversion' and new_stage>=4 and new.propiedad_slug is null then perform public.fortius_inmuebles_avisar(new.id,'El inmueble ligado'); end if;
         if new.flujo->>'ruta'<>'inversion' and new_stage>=5 and counterpart is not null and not exists(select 1 from public.fortius_inmuebles_expedientes e
            where e.id=counterpart and e.deleted_at is null and e.operacion=new.operacion and e.propiedad_slug=new.propiedad_slug
            and e.flujo->>'estado'='activa' and e.flujo->>'ruta'<>new.flujo->>'ruta' and e.cliente_id<>new.cliente_id) then
           perform public.fortius_inmuebles_avisar(new.id,'Revisar la operación de la contraparte'); end if;
         if new.flujo->>'ruta'<>'inversion' and new_stage>=5 and counterpart is null and not (new.flujo ? 'contraparteLeadId') and length(btrim(coalesce(new.flujo->>'contraparteExterna','')))<3 then
           perform public.fortius_inmuebles_avisar(new.id,'La contraparte identificada'); end if;
         if new.etapa='cerrado' then
           if exists(select 1 from public.fortius_inmuebles_records t where t.collection='tareas' and t.data->>'expedienteId'=new.id::text and t.data->>'estado' not in ('completada','cancelada')) then
             perform public.fortius_inmuebles_avisar(new.id,'Resolver o descartar las tareas pendientes'); end if;
         elsif not exists(select 1 from public.fortius_inmuebles_records t where t.collection='tareas' and t.data->>'expedienteId'=new.id::text
           and t.data->>'estado' in ('pendiente','en-curso','en-espera') and t.data->>'asesorId'=new.asesor_id
           and nullif(t.data->>'vence','') is not null) then
           perform public.fortius_inmuebles_avisar(new.id,'Una próxima tarea con fecha y responsable'); end if;
       end if;
     end if;
   end if;
 end if;
 return new;
exception when invalid_datetime_format or datetime_field_overflow or invalid_text_representation then
 raise sqlstate 'PT400' using message='Fecha o referencia de guía inválida';
end;
$function$;

-- 5. Salir de captación sin la entrevista, el levantamiento o los documentos de la lista: aviso.
create or replace function public.fortius_inmuebles_guard_initial_gate() returns trigger
language plpgsql security definer set search_path='' as $function$
declare route text; steps jsonb; d record; emitted boolean;
begin
  if new.operacion not in ('venta','renta') or coalesce(new.flujo->'heredado','null'::jsonb) not in ('null'::jsonb,'false'::jsonb) then return new; end if;
  if coalesce(old.etapa,'captacion')<>'captacion' or coalesce(new.etapa,'captacion')='captacion' then return new; end if;
  route := coalesce(new.flujo->>'ruta', case when new.operacion='renta' then 'arrendador' else 'captacion' end);
  if route not in ('captacion','arrendador') then return new; end if;

  select r.data->'pasos' into steps from public.fortius_inmuebles_records r where r.collection='tareas' and r.id='checklist-'||new.id::text;
  if jsonb_typeof(steps) is distinct from 'array'
    or not exists(select 1 from jsonb_array_elements(steps) p where jsonb_typeof(p)='object')
    or exists(select 1 from jsonb_array_elements(steps) p where jsonb_typeof(p)='object'
      and coalesce(p->>'hecho','false')<>'true' and btrim(coalesce(p->>'noAplica',''))='') then
    perform public.fortius_inmuebles_avisar(new.id,'Los documentos de la lista');
  end if;

  for d in select x.prefix, x.label from (values ('02','La entrevista inicial (02) con su PDF'),('04','El levantamiento (04) con su PDF')) as x(prefix,label) loop
    emitted:=null;
    select exists(select 1 from public.fortius_inmuebles_formato_emissions em where em.draft_id=f.id and em.draft_version=f.version) into emitted
    from public.fortius_inmuebles_formato_drafts f
    where f.expediente_id=new.id and (case when d.prefix='02' then f.formato_id='02' else f.formato_id like '04%' end)
    order by f.updated_at desc limit 1;
    if not coalesce(emitted,false) then perform public.fortius_inmuebles_avisar(new.id,d.label::text); end if;
  end loop;
  return new;
end;
$function$;

-- 6. Renta: saltar etapas, avanzar sin guía o archivar con pendientes se anotan.
create or replace function public.fortius_inmuebles_guard_rent_progress() returns trigger
language plpgsql security definer set search_path='' as $function$
declare stages text[]:=array['captacion','documentacion','comercializacion','negociacion','cierre','entrega','postventa','cerrado'];
begin
 if new.operacion<>'renta' then return new; end if;
 if tg_op='INSERT' then
  if new.etapa<>'captacion' then raise sqlstate 'PT409' using message='El arrendamiento inicia en captación o perfil'; end if;
 elsif new.etapa is distinct from old.etapa then
  if array_position(stages,new.etapa)>array_position(stages,old.etapa)+1 then perform public.fortius_inmuebles_avisar(new.id,'Las etapas intermedias'); end if;
  if new.etapa not in ('captacion','documentacion') and new.flujo is null then perform public.fortius_inmuebles_avisar(new.id,'La guía de arrendamiento'); end if;
  if new.etapa='cerrado' and exists(select 1 from public.fortius_inmuebles_records t where t.collection='tareas' and t.data->>'expedienteId'=new.id::text and t.data->>'estado' not in ('completada','cancelada')) then
   perform public.fortius_inmuebles_avisar(new.id,'Resolver o descartar las tareas pendientes'); end if;
 end if;
 return new;
end; $function$;

-- 7. Firmar la venta con la cancelación de hipoteca sin inscribir (TRA-01): aviso. Si el director
--    ya lo decidió en el trámite, no se repite.
create or replace function public.fortius_inmuebles_guard_mortgage_signing() returns trigger
language plpgsql security definer set search_path='' as $function$
declare stages text[]:=array['captacion','documentacion','comercializacion','negociacion','cierre','entrega','postventa','cerrado'];
 hasta integer; desde integer;
begin
 if new.operacion is distinct from 'venta' or new.etapa is not distinct from old.etapa then return new; end if;
 hasta:=coalesce(array_position(stages,new.etapa),0); desde:=coalesce(array_position(stages,old.etapa),0);
 if hasta<array_position(stages,'cierre') or hasta<=desde then return new; end if;
 if exists(select 1 from public.fortius_inmuebles_records t where t.collection='tramites' and t.data->>'expedienteId'=new.id::text
   and (t.data->>'pasoActual')::int < 6 and jsonb_typeof(t.data->'firmaSinCancelacion') is distinct from 'object') then
  perform public.fortius_inmuebles_avisar(new.id,'La cancelación de hipoteca inscrita en el Registro Público');
 end if;
 return new;
end;
$function$;

-- 8. Publicar un inmueble propio sin la captación lista: se publica y se anota en cada captación
--    ligada. Un compartido lo sigue publicando solo el director y con la inmobiliaria ligada; sin
--    la autorización escrita (archivo, fecha y firmante) se publica y queda en el historial del
--    inmueble, que guarda quién lo publicó, cuándo y sin qué. Un archivo citado sí debe existir.
create or replace function public.fortius_inmuebles_guard_guided_publication() returns trigger
language plpgsql security definer set search_path='' as $function$
declare was_public boolean:=false; e record;
begin
 if new.collection<>'propiedades' or new.data->>'publicada' is distinct from 'true' then return new; end if;
 if new.data->>'origen'='compartido' then
  -- Ya publicado como compartido, sigue publicado al editarse (como los propios).
  if tg_op='UPDATE' and old.data->>'publicada'='true' and old.data->>'origen'='compartido' then return new; end if;
  if not public.fortius_inmuebles_is_admin() then
   raise sqlstate 'PT403' using message='Un inmueble compartido lo publica el director';
  end if;
  if length(btrim(coalesce(new.data->'aliado'->>'inmobiliaria','')))<2 then
   raise sqlstate 'PT409' using message='Para publicar un inmueble compartido liga la inmobiliaria que lo comparte';
  end if;
  if coalesce(new.data->'aliado'->'autorizacion'->>'path','')<>'' and not exists(select 1 from public.fortius_inmuebles_file_uploads u
     where u.bucket='fortius-inmuebles-private' and u.path=new.data->'aliado'->'autorizacion'->>'path') then
   raise sqlstate 'PT409' using message='La autorización adjunta no se encontró; vuelve a subirla';
  end if;
  return new;
 end if;
 if tg_op='UPDATE' then was_public:=old.data->>'publicada'='true' and old.data->>'operacion' is not distinct from new.data->>'operacion'; end if;
 if not coalesce(was_public,false) and auth.uid() is not null and not exists(select 1 from public.fortius_inmuebles_expedientes x
   where x.propiedad_slug=new.id and x.operacion=new.data->>'operacion' and public.fortius_inmuebles_can_access_expediente(x.id)
   and (public.fortius_inmuebles_flow_publish_ready(x.id)
     or (new.data->>'estado' in ('vendida','rentada') and x.etapa in ('cierre','entrega','postventa','cerrado')))) then
   for e in select x.id from public.fortius_inmuebles_expedientes x
     where x.propiedad_slug=new.id and x.operacion=new.data->>'operacion' and x.deleted_at is null and x.flujo->>'ruta' in ('captacion','arrendador') loop
    insert into public.fortius_inmuebles_expediente_actividad(expediente_id,tipo,descripcion,created_by,detalle)
    values(e.id,'aviso','Se publicó el inmueble sin: la captación lista para publicar (comercialización, revisiones y firma del contrato revisada)',auth.uid(),
      jsonb_build_object('faltaba',jsonb_build_array('publicacion'),'inmueble',new.id));
   end loop;
 end if;
 return new;
end; $function$;

-- 8b. Visita antes de la firma (DEC-41): la sigue autorizando solo el director, con el interesado y
--     el motivo. La carta del propietario ya no es obligatoria: sin ella se autoriza y la guía anota
--     el aviso (sección 4). Si se adjunta, el archivo debe haberse subido de verdad.
create or replace function public.fortius_inmuebles_prior_visits(v jsonb,prev jsonb) returns jsonb
language plpgsql stable security definer set search_path='' as $body$
declare item jsonb; before_item jsonb; content jsonb; result jsonb:='[]'::jsonb;
 stamp text:=to_char(clock_timestamp() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
 v:=coalesce(v,'[]'::jsonb); prev:=coalesce(prev,'[]'::jsonb);
 if jsonb_typeof(v)<>'array' or jsonb_array_length(v)>20 then raise sqlstate 'PT400' using message='Visitas antes de la firma inválidas';end if;
 if jsonb_typeof(prev)<>'array' then prev:='[]'::jsonb;end if;
 for item in select x from jsonb_array_elements(v) x loop
  if jsonb_typeof(item)<>'object'
   or exists(select 1 from jsonb_object_keys(item) x where x not in ('id','interesado','leadId','carta','motivo','autorizadoPor','autorizadoEl'))
   or jsonb_typeof(item->'id') is distinct from 'string' or length(item->>'id') not between 1 and 80
   or jsonb_typeof(item->'interesado') is distinct from 'string' or length(btrim(item->>'interesado')) not between 2 and 160
   or (item ? 'leadId' and (jsonb_typeof(item->'leadId')<>'string' or length(item->>'leadId')>160))
   or jsonb_typeof(item->'motivo') is distinct from 'string' or length(btrim(item->>'motivo')) not between 3 and 1000
   or (item ? 'carta' and (jsonb_typeof(item->'carta')<>'object'
     or exists(select 1 from jsonb_object_keys(item->'carta') x where x not in ('path','nombre'))
     or jsonb_typeof(item->'carta'->'path') is distinct from 'string' or length(item->'carta'->>'path') not between 1 and 300
     or (item->'carta' ? 'nombre' and (jsonb_typeof(item->'carta'->'nombre')<>'string' or length(item->'carta'->>'nombre')>160)))) then
   raise sqlstate 'PT400' using message='Para autorizar la visita indica el interesado y el motivo';
  end if;
  if exists(select 1 from jsonb_array_elements(result) r where r->>'id'=item->>'id') then
   raise sqlstate 'PT400' using message='Visitas antes de la firma inválidas';
  end if;
  content:=item-'autorizadoPor'-'autorizadoEl';
  before_item:=null;
  select x into before_item from jsonb_array_elements(prev) x where x->>'id'=item->>'id' limit 1;
  if before_item is not null and content=(before_item-'autorizadoPor'-'autorizadoEl') then
   result:=result||jsonb_build_array(content||jsonb_build_object('autorizadoPor',before_item->'autorizadoPor','autorizadoEl',before_item->'autorizadoEl'));
  else
   if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida para autorizar la visita';end if;
   if not public.fortius_inmuebles_is_admin() then raise sqlstate 'PT403' using message='Solo el director autoriza una visita antes de la firma';end if;
   if item ? 'carta' and not exists(select 1 from public.fortius_inmuebles_file_uploads u where u.bucket='fortius-inmuebles-private' and u.path=item->'carta'->>'path') then
    raise sqlstate 'PT409' using message='La carta adjunta no se encontró; vuelve a subirla';
   end if;
   result:=result||jsonb_build_array(content||jsonb_build_object('autorizadoPor',auth.uid()::text,'autorizadoEl',stamp));
  end if;
 end loop;
 -- Retirar una visita autorizada también es decisión del director.
 if exists(select 1 from jsonb_array_elements(prev) p where not exists(select 1 from jsonb_array_elements(result) r where r->>'id'=p->>'id'))
  and auth.uid() is not null and not public.fortius_inmuebles_is_admin() then
  raise sqlstate 'PT403' using message='Solo el director retira una visita autorizada';
 end if;
 return case when jsonb_array_length(result)=0 then null else result end;
end; $body$;
revoke all on function public.fortius_inmuebles_prior_visits(jsonb,jsonb) from public,anon,authenticated,service_role;

create or replace function public.fortius_inmuebles_replace_once(definition text, anchor text, replacement text, expected integer, fn text)
returns text language plpgsql immutable set search_path='' as $$
begin
 if (length(definition)-length(replace(definition,anchor,'')))/length(anchor)<>expected then
  raise exception 'Unexpected process function %', fn;
 end if;
 return replace(definition,anchor,replacement);
end; $$;

-- 9. Una observación retira la publicación solo cuando es nueva (M-02 la conserva). Antes, una
--    observación que ya estaba lo retiraba en cualquier guardado: con la publicación permitida
--    aunque falte algo, el inmueble se habría bajado solo al guardar cualquier otra cosa.
do $$
declare definition text; fn text:='public.fortius_inmuebles_log_expediente_operation';
begin
 select pg_get_functiondef('public.fortius_inmuebles_log_expediente_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('FLX-03a' in definition)>0 then return; end if;
 definition:=public.fortius_inmuebles_replace_once(definition,
  'where (x.value->>''estado''=''observado'' and (',
  'where (x.value->>''estado''=''observado'' /* FLX-03a */ and old.flujo->''requisitos''->x.key->>''estado'' is distinct from ''observado'' and (',1,fn);
 execute definition;
end $$;

-- 10. Trámites: cerrar un paso con pendientes sin marcar o sin su documento queda en el historial
--     del trámite como aviso. Los pasos se siguen cerrando de uno en uno.
do $$
declare definition text; fn text:='public.fortius_inmuebles_guard_tramite';
begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_tramite()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('FLX-03a' in definition)>0 then return; end if;
 definition:=public.fortius_inmuebles_replace_once(definition,
  'raise sqlstate ''PT400'' using message=''Faltan pendientes de «''||nombre||''»''; end if;',
  '/* FLX-03a */ eventos:=eventos||(''Aviso: se cerró «''||nombre||''» con pendientes sin marcar''); end if;',1,fn);
 definition:=public.fortius_inmuebles_replace_once(definition,
  'raise sqlstate ''PT400'' using message=''Sube el documento de «''||nombre||''» antes de cerrar el paso''; end if;',
  'eventos:=eventos||(''Aviso: se cerró «''||nombre||''» sin su documento''); end if;',1,fn);
 execute definition;
end $$;

drop function public.fortius_inmuebles_replace_once(text,text,text,integer,text);
commit;
