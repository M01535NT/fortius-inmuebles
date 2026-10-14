-- Owner intake creates the private property it is capturing. Linking an existing listing stays optional.
begin;
select pg_advisory_xact_lock(781023);

create or replace function public.fortius_inmuebles_validate_interview(i text,a jsonb,complete boolean) returns boolean
language plpgsql immutable set search_path='' as $$
declare k text; required text[]; is_owner boolean:=i in ('vender','arrendar');v text;
begin
 if complete is null or jsonb_typeof(a) is distinct from 'object' or octet_length(a::text)>64000 or exists(select 1 from jsonb_each(a) x where jsonb_typeof(x.value)<>'string' or length(x.value#>>'{}')>2000 or x.key not in ('fecha','objetivo','plazo','zona','tipoInmueble','relacion','ubicacion','ocupacion','documentos','alertas','detalleAlertas','acceso','uso','necesidades','presupuestoEstado','importe','moneda','financiamiento','estrategia','horizonte','criterios','condiciones','privacidad','siguienteAccion','siguienteFecha','estadoCivil','conyuge','regimen','fechaMatrimonio','lugarMatrimonio')) then return false;end if;
 if not complete then return true;end if;
 required:=array['fecha','objetivo','plazo','zona','tipoInmueble','presupuestoEstado','privacidad','siguienteAccion','siguienteFecha'];
 if is_owner then required:=required||array['relacion','ocupacion','documentos','alertas','estadoCivil'];else required:=required||array['uso','necesidades'];end if;
 if i in ('comprar','invertir') then required:=required||array['financiamiento'];end if;
 if i='invertir' then required:=required||array['estrategia','horizonte'];end if;
 foreach k in array required loop if coalesce(btrim(a->>k),'')='' then return false;end if;end loop;
 if a->>'tipoInmueble' not in ('casa','departamento','terreno','local','oficina','nave-industrial','por_definir') or a->>'presupuestoEstado' not in ('conocido','por_definir') or a->>'privacidad'<>'presentado' then return false;end if;
 if is_owner and a->>'tipoInmueble'='por_definir' then return false;end if;
 if is_owner and (a->>'relacion' not in ('propietario','copropietario','representante','heredero','otro','por_aclarar') or a->>'ocupacion' not in ('desocupado','propietario','inquilino','otro','por_aclarar') or a->>'alertas' not in ('ninguna_declarada','declaradas','por_aclarar') or a->>'estadoCivil' not in ('soltero','casado','divorciado','viudo','otro','por_aclarar')) then return false;end if;
 if is_owner and a->>'estadoCivil'='casado' and (coalesce(btrim(a->>'conyuge'),'')='' or coalesce(a->>'regimen','') not in ('sociedad_conyugal','separacion','no_aplica','por_aclarar')) then return false;end if;
 if i in ('comprar','invertir') and a->>'financiamiento' not in ('recursos_propios','credito','mixto','por_definir') then return false;end if;
 if i='invertir' and a->>'estrategia' not in ('renta','reventa','mixta','por_definir') then return false;end if;
 if is_owner and a->>'alertas'='declaradas' and coalesce(btrim(a->>'detalleAlertas'),'')='' then return false;end if;
 if a->>'presupuestoEstado'='conocido' and (coalesce(a->>'importe','') !~ '^[0-9]+(\.[0-9]{1,2})?$' or (a->>'importe')::numeric<=0 or (a->>'importe')::numeric>1e13 or coalesce(a->>'moneda','') not in ('MXN','USD')) then return false;end if;
 foreach k in array array['fecha','siguienteFecha'] loop
  v:=a->>k;if v !~ '^\d{4}-\d{2}-\d{2}$' or to_char(v::date,'YYYY-MM-DD')<>v then return false;end if;
 end loop;
 if is_owner and coalesce(btrim(a->>'fechaMatrimonio'),'')<>'' then
  v:=a->>'fechaMatrimonio';if v !~ '^\d{4}-\d{2}-\d{2}$' or to_char(v::date,'YYYY-MM-DD')<>v then return false;end if;
 end if;
 return true;
exception when invalid_datetime_format or datetime_field_overflow or invalid_text_representation or numeric_value_out_of_range then return false;
end;
$$;

create or replace function public.fortius_inmuebles_save_intake(p_id uuid,p_version bigint,p_answers jsonb,p_complete boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.fortius_inmuebles_interviews;source public.fortius_inmuebles_records;customer text;converted jsonb;e public.fortius_inmuebles_expedientes;
 flow jsonb;review jsonb;new_conversion boolean:=false;stamp timestamptz:=clock_timestamp();task_id text;task_data jsonb;first_admission boolean;
 house text;property_id text;price jsonb;address text;
begin
 if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida';end if;
 if not public.fortius_inmuebles_is_staff() then raise sqlstate 'PT403' using message='Membresía requerida';end if;
 if p_version is null or p_version not between 1 and 9007199254740991 or p_complete is null then raise sqlstate 'PT400' using message='Versión inválida';end if;
 perform pg_catalog.pg_advisory_xact_lock(781023);
 select * into r from public.fortius_inmuebles_interviews where id=p_id for update;
 if not found or not public.fortius_inmuebles_interview_visible(r.asesor_id,r.lead_id,r.cliente_id,r.expediente_id) then raise sqlstate 'PT403' using message='Entrevista ajena';end if;
 if r.estado='cancelada' then raise sqlstate 'PT409' using message='La captura quedó cancelada por un cambio de contexto; prepara una entrevista actual';end if;
 if r.estado='completada' then
  if not p_complete or p_answers is distinct from r.respuestas or p_version not in (r.version,r.completion_version) then raise sqlstate 'PT409' using message='La entrevista completada se conserva; inicia una corrección';end if;
  return to_jsonb(r)-'solicitud';
 end if;
 if r.version<>p_version then raise sqlstate 'PT409' using message='La entrevista cambió; conserva tu captura y recarga';end if;
 if not public.fortius_inmuebles_validate_interview(r.intencion,p_answers,p_complete) then raise sqlstate 'PT400' using message='Completa las preguntas y próxima acción';end if;
 if r.anterior_id is not null and exists(select 1 from public.fortius_inmuebles_interviews prior where prior.id=r.anterior_id and (p_answers->>'siguienteAccion' is distinct from prior.respuestas->>'siguienteAccion' or p_answers->>'siguienteFecha' is distinct from prior.respuestas->>'siguienteFecha')) then raise sqlstate 'PT400' using message='Reprograma la próxima acción desde Tareas; la entrevista conserva el acuerdo inicial';end if;
 if not p_complete then
  update public.fortius_inmuebles_interviews set respuestas=p_answers,version=version+1 where id=p_id returning * into r;
  return to_jsonb(r)-'solicitud';
 end if;
 if not exists(select 1 from public.fortius_inmuebles_records where collection='asesores' and id=r.asesor_id and data->>'activo'='true') then raise sqlstate 'PT400' using message='Responsable inactivo';end if;
 customer:=r.cliente_id;
 if customer is null then
  select * into source from public.fortius_inmuebles_records where collection='leads' and id=r.lead_id for update;
  if not found or source.data->>'asesorId' is distinct from r.asesor_id then raise sqlstate 'PT409' using message='El contacto cambió de responsable';end if;
  new_conversion:=coalesce(source.data->>'clienteId','')='';
  converted:=public.fortius_inmuebles_convert_lead(source.id,source.version);
  customer:=converted->'cliente'->>'id';
  if new_conversion then
   perform public.fortius_inmuebles_put_record('clientes',customer,converted->'cliente'->'data'||jsonb_build_object('tipo',case r.intencion when 'vender' then 'propietario' when 'arrendar' then 'arrendador' when 'comprar' then 'comprador' when 'rentar' then 'arrendatario' else 'inversionista' end),(converted->'cliente'->>'version')::bigint);
  end if;
 end if;
 if not exists(select 1 from public.fortius_inmuebles_records where collection='clientes' and id=customer and data->>'asesorId'=r.asesor_id and public.fortius_inmuebles_record_visible(collection,data)) then raise sqlstate 'PT409' using message='El contacto cambió de responsable';end if;
 first_admission:=r.expediente_id is null;
 address:=left(btrim(coalesce(p_answers->>'ubicacion','')),500);
 if first_admission then
  insert into public.fortius_inmuebles_expedientes(cliente_id,asesor_id,operacion,unidad,flujo)
  values(customer,r.asesor_id,case when r.intencion in ('arrendar','rentar') then 'renta' else 'venta' end,address,
   case when r.intencion in ('arrendar','rentar') then null else jsonb_build_object('version',1,'ruta',case when r.intencion='vender' then 'captacion' else 'compra' end,'estado','activa','motivo','','requisitos','{}'::jsonb) end) returning * into e;
 else
  select * into e from public.fortius_inmuebles_expedientes where id=r.expediente_id and deleted_at is null for update;
  if not found or not public.fortius_inmuebles_can_access_expediente(e.id) or e.cliente_id is distinct from customer or e.asesor_id is distinct from r.asesor_id then raise sqlstate 'PT409' using message='La operación cambió';end if;
  first_admission:=r.anterior_id is null and e.etapa='captacion';
 end if;
 house:=e.propiedad_slug;
 if r.intencion in ('vender','arrendar') and r.anterior_id is null and house is null then
  property_id:='cap'||replace(r.id::text,'-','');
  price:=case when p_answers->>'presupuestoEstado'='conocido' then jsonb_strip_nulls(jsonb_build_object('modalidad','publico','monto',(p_answers->>'importe')::numeric,'moneda',p_answers->>'moneda','periodo',case when r.intencion='arrendar' then 'mensual' else null end)) else jsonb_build_object('modalidad','consulta') end;
  perform public.fortius_inmuebles_put_record('propiedades',property_id,jsonb_build_object(
   'slug',property_id,'codigo','','titulo',left(btrim((case p_answers->>'tipoInmueble' when 'casa' then 'Casa' when 'departamento' then 'Departamento' when 'terreno' then 'Terreno' when 'local' then 'Local' when 'oficina' then 'Oficina' when 'nave-industrial' then 'Nave industrial' else 'Inmueble' end)||' · '||coalesce(nullif(address,''),nullif(btrim(p_answers->>'zona'),''),'Captación')),160),
   'tipo',p_answers->>'tipoInmueble','operacion',case when r.intencion='arrendar' then 'renta' else 'venta' end,
   'zona',left(coalesce(nullif(btrim(p_answers->>'zona'),''),'Por definir'),500),
   'direccionAproximada',coalesce(nullif(address,''),left(coalesce(nullif(btrim(p_answers->>'zona'),''),'Por definir'),500)),
   'asesorId',r.asesor_id,'estado','disponible','publicadaEl',to_char(stamp at time zone 'America/Tijuana','YYYY-MM-DD'),
   'precio',price,'ficha','{}'::jsonb,'descripcion','[]'::jsonb,'amenidades','[]'::jsonb,'galeria','[]'::jsonb,'puntosDeInteres','[]'::jsonb,
   'demo',false,'destacada',false,'creditoDisponible',false,'publicada',false
  ),null);
  house:=property_id;
 end if;
 review:=jsonb_build_object('estado','revisado','soporte','Entrevista operativa '||r.id::text||' · versión '||(r.version+1)::text||'. Declaraciones capturadas; documentos y capacidad pendientes de comprobar.','registradoPor',auth.uid(),'registradoEl',stamp);
 if e.operacion='venta' then
  flow:=coalesce(e.flujo,jsonb_build_object('version',1,'ruta',case when r.intencion='vender' then 'captacion' else 'compra' end,'estado','activa','motivo','','requisitos','{}'::jsonb));
  flow:=jsonb_set(flow,array['requisitos',case when r.intencion='vender' then 'entrevista' else 'perfil' end],review);
  if r.intencion<>'vender' then flow:=jsonb_set(flow,'{requisitos,privacidad}',review||jsonb_build_object('soporte','Aviso puesto a disposición durante entrevista '||r.id::text||'. No equivale a consentimiento.'));end if;
 end if;
 -- Freeze the validated snapshot before the advancement trigger inspects it.
 update public.fortius_inmuebles_interviews set respuestas=p_answers,cliente_id=customer,expediente_id=e.id,propiedad_slug=house,estado='completada',completion_version=version,version=version+1,completed_by=auth.uid(),completed_at=stamp where id=p_id returning * into r;
 if house is distinct from e.propiedad_slug or (r.intencion in ('vender','arrendar') and address<>'' and e.unidad is distinct from address) then
  update public.fortius_inmuebles_expedientes set propiedad_slug=house,unidad=case when r.intencion in ('vender','arrendar') and address<>'' then address else unidad end,version=version+1 where id=e.id returning * into e;
 end if;
 if r.anterior_id is null then
  task_id:=gen_random_uuid()::text;
  task_data:=jsonb_build_object('id',task_id,'titulo',left(p_answers->>'siguienteAccion',160),'descripcion',(p_answers->>'siguienteAccion')||E'\nEntrevista operativa '||r.id::text,'categoria','documentacion','estado','pendiente','prioridad','normal','pasos','[]'::jsonb,'asesorId',r.asesor_id,'clienteId',customer,'expedienteId',e.id,'propiedadSlug',coalesce(e.propiedad_slug,''),'vence',p_answers->>'siguienteFecha');
  perform public.fortius_inmuebles_put_record('tareas',task_id,task_data,null);
 end if;
 update public.fortius_inmuebles_expedientes set flujo=coalesce(flow,flujo),etapa=case when first_admission then 'documentacion' else etapa end,version=version+1 where id=e.id;
 insert into public.fortius_inmuebles_expediente_actividad(expediente_id,tipo,descripcion,created_by,detalle)
 values(e.id,'cambio',case when r.anterior_id is null then 'Entrevista operativa completada; admisión a evaluación' else 'Corrección de entrevista conservada; operación y tarea previas preservadas' end,auth.uid(),jsonb_build_object('entrevistaId',r.id,'version',r.version,'anteriorId',r.anterior_id,'intencion',r.intencion));
 return to_jsonb(r)-'solicitud';
end;
$$;
notify pgrst,'reload schema';
commit;
