-- Prepared intake interview. Declarations admit evaluation; they do not establish title or solvency.
begin;
select pg_advisory_xact_lock(781023);
create table public.fortius_inmuebles_interviews (
 id uuid primary key,
 intencion text not null check(intencion in ('vender','arrendar','comprar','rentar','invertir')),
 asesor_id text not null,
 asesor_collection text not null default 'asesores' check(asesor_collection='asesores'),
 lead_id text,
 lead_collection text not null default 'leads' check(lead_collection='leads'),
 cliente_id text,
 cliente_collection text not null default 'clientes' check(cliente_collection='clientes'),
 expediente_id uuid references public.fortius_inmuebles_expedientes(id) on delete restrict,
 propiedad_slug text,
 propiedad_collection text not null default 'propiedades' check(propiedad_collection='propiedades'),
 anterior_id uuid references public.fortius_inmuebles_interviews(id) on delete restrict,
 contacto jsonb not null check(jsonb_typeof(contacto)='object' and octet_length(contacto::text)<=2048),
 solicitud jsonb not null check(jsonb_typeof(solicitud)='object' and octet_length(solicitud::text)<=4096),
 respuestas jsonb not null default '{}'::jsonb check(jsonb_typeof(respuestas)='object' and octet_length(respuestas::text)<=64000),
 estado text not null default 'borrador' check(estado in ('borrador','completada','cancelada')),
 version bigint not null default 1 check(version>0),
 completion_version bigint,
 completed_by uuid references auth.users(id),
 completed_at timestamptz,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key (asesor_collection,asesor_id) references public.fortius_inmuebles_records(collection,id) on delete restrict,
 foreign key (propiedad_collection,propiedad_slug) references public.fortius_inmuebles_records(collection,id) on delete restrict,
 foreign key (lead_collection,lead_id) references public.fortius_inmuebles_records(collection,id) on delete restrict,
 foreign key (cliente_collection,cliente_id) references public.fortius_inmuebles_records(collection,id) on delete restrict,
 check(lead_id is not null or cliente_id is not null),
 check(estado<>'completada' or (cliente_id is not null and expediente_id is not null and completed_by is not null and completed_at is not null and completion_version is not null))
);
create index fortius_interviews_exp on public.fortius_inmuebles_interviews(expediente_id,completed_at desc);
create index fortius_interviews_lead on public.fortius_inmuebles_interviews(lead_id);
create unique index fortius_interviews_pending_lead on public.fortius_inmuebles_interviews(lead_id,intencion) where estado='borrador' and expediente_id is null;
create unique index fortius_interviews_pending_client on public.fortius_inmuebles_interviews(cliente_id,intencion) where estado='borrador' and expediente_id is null;
create unique index fortius_interviews_pending_exp on public.fortius_inmuebles_interviews(expediente_id) where estado='borrador';
alter table public.fortius_inmuebles_interviews enable row level security;
revoke all on public.fortius_inmuebles_interviews from public,anon,authenticated,service_role;
grant select on public.fortius_inmuebles_interviews to authenticated;
grant select on public.fortius_inmuebles_interviews to service_role;
create function public.fortius_inmuebles_interview_visible(a text,l text,c text,e uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select public.fortius_inmuebles_is_staff()
 and case when e is not null then exists(select 1 from public.fortius_inmuebles_expedientes x where x.id=e and x.deleted_at is null and public.fortius_inmuebles_can_access_expediente(x.id) and (public.fortius_inmuebles_is_admin() or x.cliente_id=c))
  when c is not null then exists(select 1 from public.fortius_inmuebles_records x where x.collection='clientes' and x.id=c and public.fortius_inmuebles_record_visible(x.collection,x.data))
  else exists(select 1 from public.fortius_inmuebles_records x where x.collection='leads' and x.id=l and public.fortius_inmuebles_record_visible(x.collection,x.data)) end;
$$;
revoke all on function public.fortius_inmuebles_interview_visible(text,text,text,uuid) from public,anon,service_role;
grant execute on function public.fortius_inmuebles_interview_visible(text,text,text,uuid) to authenticated;
create policy fortius_interviews_read on public.fortius_inmuebles_interviews for select to authenticated
 using(public.fortius_inmuebles_interview_visible(asesor_id,lead_id,cliente_id,expediente_id));
create function public.fortius_inmuebles_guard_interview() returns trigger
language plpgsql set search_path='' as $$
begin
 if tg_op='DELETE' or old.estado<>'borrador' then raise sqlstate 'PT409' using message='La entrevista conservada es inmutable'; end if;
 if new.version<>old.version+1 or new.id<>old.id or new.intencion<>old.intencion or new.asesor_id<>old.asesor_id
  or new.lead_id is distinct from old.lead_id or new.contacto is distinct from old.contacto or new.solicitud is distinct from old.solicitud
  or new.anterior_id is distinct from old.anterior_id or new.created_by<>old.created_by or new.created_at<>old.created_at
  or (old.cliente_id is not null and new.cliente_id is distinct from old.cliente_id)
  or (old.expediente_id is not null and new.expediente_id is distinct from old.expediente_id)
 then raise sqlstate 'PT409' using message='La identidad de la entrevista no cambia'; end if;
 new.updated_at:=clock_timestamp();return new;
end;
$$;
revoke all on function public.fortius_inmuebles_guard_interview() from public,anon,authenticated,service_role;
create trigger fortius_guard_interview before update or delete on public.fortius_inmuebles_interviews for each row execute function public.fortius_inmuebles_guard_interview();
create function public.fortius_inmuebles_start_intake(p_id uuid,p_intent text,p_contact jsonb,p_expediente_id uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.fortius_inmuebles_interviews; source public.fortius_inmuebles_records; e public.fortius_inmuebles_expedientes;
 request_data jsonb; adviser text; lead text; customer text; prior uuid; data jsonb; normalized text; k text;
begin
 if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida'; end if;
 if not public.fortius_inmuebles_is_staff() then raise sqlstate 'PT403' using message='Membresía requerida'; end if;
 if p_id is null or p_intent is null or p_intent not in ('vender','arrendar','comprar','rentar','invertir') or jsonb_typeof(p_contact) is distinct from 'object' or octet_length(p_contact::text)>4096 then raise sqlstate 'PT400' using message='Ingreso inválido'; end if;
 perform pg_catalog.pg_advisory_xact_lock(781023);
 request_data:=jsonb_build_object('intencion',p_intent,'contacto',p_contact,'expedienteId',p_expediente_id);
 select * into r from public.fortius_inmuebles_interviews where id=p_id;
 if found then
  if not public.fortius_inmuebles_interview_visible(r.asesor_id,r.lead_id,r.cliente_id,r.expediente_id) then raise sqlstate 'PT403' using message='Entrevista ajena'; end if;
  if r.solicitud is distinct from request_data then raise sqlstate 'PT409' using message='Solicitud reutilizada con otro contenido'; end if;
  return to_jsonb(r)-'solicitud';
 end if;
 if p_contact->>'tipo'='nuevo' then
  if p_expediente_id is not null or not p_contact ?& array['nombre','telefono','email','asesorId','telefonoCompartido']
   or exists(select 1 from jsonb_object_keys(p_contact) x where x not in ('tipo','nombre','telefono','email','asesorId','telefonoCompartido'))
   or jsonb_typeof(p_contact->'telefonoCompartido') is distinct from 'boolean'
   or exists(select 1 from jsonb_each(p_contact) x where x.key<>'telefonoCompartido' and jsonb_typeof(x.value)<>'string')
   or length(btrim(p_contact->>'nombre')) not between 1 and 160 or length(p_contact->>'telefono')>40
   or length(p_contact->>'email')>254 or (p_contact->>'email'<>'' and p_contact->>'email' !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
  then raise sqlstate 'PT400' using message='Contacto inválido'; end if;
  adviser:=p_contact->>'asesorId';normalized:=regexp_replace(p_contact->>'telefono','[^0-9]','','g');
  if length(normalized)<7 then raise sqlstate 'PT400' using message='Teléfono inválido'; end if;
  if not public.fortius_inmuebles_is_admin() and adviser is distinct from public.fortius_inmuebles_current_asesor_id() then raise sqlstate 'PT403' using message='Responsable ajeno'; end if;
  if not (p_contact->>'telefonoCompartido')::boolean and exists(select 1 from public.fortius_inmuebles_records x where x.collection in ('leads','clientes') and public.fortius_inmuebles_record_visible(x.collection,x.data) and regexp_replace(x.data->>'telefono','[^0-9]','','g')=normalized) then raise sqlstate 'PT409' using message='Revisa el contacto coincidente'; end if;
  lead:=p_id::text;
  data:=jsonb_build_object('id',lead,'nombre',btrim(p_contact->>'nombre'),'telefono',p_contact->>'telefono','email',p_contact->>'email','asesorId',adviser,'origen','manual','estado','nuevo','creadoEl',clock_timestamp(),'notas','[]'::jsonb,'perfil',jsonb_build_object('operacion',case when p_intent='invertir' then 'comprar' else p_intent end,'intencion',p_intent));
  perform public.fortius_inmuebles_put_record('leads',lead,data,null);
 else
  if coalesce(p_contact->>'tipo','') not in ('lead','cliente') or p_contact->>'id' is null or p_contact->>'id' !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$'
   or exists(select 1 from jsonb_object_keys(p_contact) x where x not in ('tipo','id')) then raise sqlstate 'PT400' using message='Contacto inválido'; end if;
  select * into source from public.fortius_inmuebles_records where collection=case when p_contact->>'tipo'='lead' then 'leads' else 'clientes' end and id=p_contact->>'id' for update;
  if not found or not public.fortius_inmuebles_record_visible(source.collection,source.data) then raise sqlstate 'PT403' using message='Contacto ajeno'; end if;
  adviser:=source.data->>'asesorId';data:=source.data;
  if source.collection='leads' then
   lead:=source.id;customer:=nullif(source.data->>'clienteId','');
   if customer is not null then select * into source from public.fortius_inmuebles_records where collection='clientes' and id=customer;data:=source.data; end if;
  else customer:=source.id;end if;
 end if;
 if not exists(select 1 from public.fortius_inmuebles_records x where x.collection='asesores' and x.id=adviser and x.data->>'activo'='true') then raise sqlstate 'PT400' using message='Asigna un responsable activo al contacto'; end if;
 if p_expediente_id is not null then
  select * into e from public.fortius_inmuebles_expedientes where id=p_expediente_id and deleted_at is null for update;
  if not found or not public.fortius_inmuebles_can_access_expediente(e.id) or e.cliente_id is distinct from customer or e.asesor_id is distinct from adviser then raise sqlstate 'PT403' using message='Expediente ajeno'; end if;
  if e.operacion is distinct from (case when p_intent in ('arrendar','rentar') then 'renta' else 'venta' end)
   or (e.flujo is not null and e.flujo->>'ruta' is distinct from (case when p_intent in ('vender','arrendar') then 'captacion' else 'compra' end)) then raise sqlstate 'PT409' using message='Intención incompatible con la operación'; end if;
  select id into prior from public.fortius_inmuebles_interviews where expediente_id=e.id and cliente_id=customer and intencion=p_intent and estado='completada' order by completed_at desc,id desc limit 1;
 end if;
 -- A reassigned contact cannot retain an editable draft from its former responsible adviser.
 update public.fortius_inmuebles_interviews set estado='cancelada',version=version+1 where estado='borrador' and expediente_id is null and asesor_id is distinct from adviser and ((lead is not null and lead_id=lead) or (customer is not null and cliente_id=customer));
 -- Resume an existing pending interview instead of creating a competing editable copy.
 select * into r from public.fortius_inmuebles_interviews where estado='borrador' and ((p_expediente_id is not null and expediente_id=p_expediente_id) or (p_expediente_id is null and expediente_id is null and intencion=p_intent and ((lead is not null and lead_id=lead) or (customer is not null and cliente_id=customer))));
 if found then raise sqlstate 'PT409' using message='Ya existe un borrador; continúa esa entrevista';end if;
 insert into public.fortius_inmuebles_interviews(id,intencion,asesor_id,lead_id,cliente_id,expediente_id,anterior_id,contacto,solicitud,created_by,respuestas)
 values(p_id,p_intent,adviser,lead,customer,p_expediente_id,prior,public.fortius_inmuebles_pick(data,array['nombre','telefono','email']),request_data,auth.uid(),coalesce((select respuestas from public.fortius_inmuebles_interviews where id=prior),jsonb_build_object('fecha',to_char(clock_timestamp() at time zone 'America/Tijuana','YYYY-MM-DD')))) returning * into r;
 return to_jsonb(r)-'solicitud';
end;
$$;
create function public.fortius_inmuebles_validate_interview(i text,a jsonb,complete boolean) returns boolean
language plpgsql immutable set search_path='' as $$
declare k text; required text[]; is_owner boolean:=i in ('vender','arrendar');v text;
begin
 if complete is null or jsonb_typeof(a) is distinct from 'object' or octet_length(a::text)>64000 or exists(select 1 from jsonb_each(a) x where jsonb_typeof(x.value)<>'string' or length(x.value#>>'{}')>2000 or x.key not in ('fecha','objetivo','plazo','zona','tipoInmueble','relacion','ubicacion','ocupacion','documentos','alertas','detalleAlertas','acceso','uso','necesidades','presupuestoEstado','importe','moneda','financiamiento','estrategia','horizonte','criterios','condiciones','privacidad','siguienteAccion','siguienteFecha')) then return false;end if;
 if not complete then return true;end if;
 required:=array['fecha','objetivo','plazo','zona','tipoInmueble','presupuestoEstado','privacidad','siguienteAccion','siguienteFecha'];
 if is_owner then required:=required||array['relacion','ocupacion','documentos','alertas'];else required:=required||array['uso','necesidades'];end if;
 if i in ('comprar','invertir') then required:=required||array['financiamiento'];end if;
 if i='invertir' then required:=required||array['estrategia','horizonte'];end if;
 foreach k in array required loop if coalesce(btrim(a->>k),'')='' then return false;end if;end loop;
 if a->>'tipoInmueble' not in ('casa','departamento','terreno','local','oficina','nave-industrial','por_definir') or a->>'presupuestoEstado' not in ('conocido','por_definir') or a->>'privacidad'<>'presentado' then return false;end if;
 if is_owner and (a->>'relacion' not in ('propietario','copropietario','representante','heredero','otro','por_aclarar') or a->>'ocupacion' not in ('desocupado','propietario','inquilino','otro','por_aclarar') or a->>'alertas' not in ('ninguna_declarada','declaradas','por_aclarar')) then return false;end if;
 if i in ('comprar','invertir') and a->>'financiamiento' not in ('recursos_propios','credito','mixto','por_definir') then return false;end if;
 if i='invertir' and a->>'estrategia' not in ('renta','reventa','mixta','por_definir') then return false;end if;
 if is_owner and a->>'alertas'='declaradas' and coalesce(btrim(a->>'detalleAlertas'),'')='' then return false;end if;
 if a->>'presupuestoEstado'='conocido' and (coalesce(a->>'importe','') !~ '^[0-9]+(\.[0-9]{1,2})?$' or (a->>'importe')::numeric<=0 or (a->>'importe')::numeric>1e13 or coalesce(a->>'moneda','') not in ('MXN','USD')) then return false;end if;
 foreach k in array array['fecha','siguienteFecha'] loop
  v:=a->>k;if v !~ '^\d{4}-\d{2}-\d{2}$' or to_char(v::date,'YYYY-MM-DD')<>v then return false;end if;
 end loop;
 return true;
exception when invalid_datetime_format or datetime_field_overflow or invalid_text_representation or numeric_value_out_of_range then return false;
end;
$$;
revoke all on function public.fortius_inmuebles_validate_interview(text,jsonb,boolean) from public,anon,authenticated,service_role;
-- Admission is distinct from commercial authorization. Keep title/finance gates downstream.
create or replace function public.fortius_inmuebles_flow_required(route text,stage text) returns text[]
language plpgsql immutable set search_path='' as $$
declare n integer;keys text[];
begin
 n:=array_position(array['captacion','documentacion','comercializacion','negociacion','cierre','entrega','postventa','cerrado'],stage);
 if n is null or n<=1 then return array[]::text[];end if;
 keys:=case when route='captacion' then array['entrevista'] else array['perfil','privacidad'] end;
 if n>=3 then keys:=keys||case when route='captacion' then array['titularidad','factibilidad','valor','precio','intermediacion','levantamiento','plan','publicacion'] else array['opciones'] end;end if;
 if n>=4 then keys:=keys||case when route='captacion' then array['comprador'] else array['visitas','capacidad'] end;end if;
 if n>=5 then keys:=keys||array['oferta','revision_cierre','instrumento','contraparte'];end if;
 if n>=6 then keys:=keys||array['firma','pago'];end if;
 if n>=7 then keys:=keys||array['entrega'];end if;
 if n>=8 then keys:=keys||array['registro','honorarios','archivo'];end if;
 return keys;
end;
$$;
create function public.fortius_inmuebles_save_intake(p_id uuid,p_version bigint,p_answers jsonb,p_complete boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.fortius_inmuebles_interviews;source public.fortius_inmuebles_records;customer text;converted jsonb;e public.fortius_inmuebles_expedientes;
 flow jsonb;review jsonb;new_conversion boolean:=false;stamp timestamptz:=clock_timestamp();task_id text;task_data jsonb;first_admission boolean;
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
 if first_admission then
  insert into public.fortius_inmuebles_expedientes(cliente_id,asesor_id,operacion,unidad,flujo)
  values(customer,r.asesor_id,case when r.intencion in ('arrendar','rentar') then 'renta' else 'venta' end,coalesce(p_answers->>'ubicacion',''),
   case when r.intencion in ('arrendar','rentar') then null else jsonb_build_object('version',1,'ruta',case when r.intencion='vender' then 'captacion' else 'compra' end,'estado','activa','motivo','','requisitos','{}'::jsonb) end) returning * into e;
 else
  select * into e from public.fortius_inmuebles_expedientes where id=r.expediente_id and deleted_at is null for update;
  if not found or not public.fortius_inmuebles_can_access_expediente(e.id) or e.cliente_id is distinct from customer or e.asesor_id is distinct from r.asesor_id then raise sqlstate 'PT409' using message='La operación cambió';end if;
  first_admission:=r.anterior_id is null and e.etapa='captacion';
 end if;
 review:=jsonb_build_object('estado','revisado','soporte','Entrevista operativa '||r.id::text||' · versión '||(r.version+1)::text||'. Declaraciones capturadas; documentos y capacidad pendientes de comprobar.','registradoPor',auth.uid(),'registradoEl',stamp);
 if e.operacion='venta' then
  flow:=coalesce(e.flujo,jsonb_build_object('version',1,'ruta',case when r.intencion='vender' then 'captacion' else 'compra' end,'estado','activa','motivo','','requisitos','{}'::jsonb));
  flow:=jsonb_set(flow,array['requisitos',case when r.intencion='vender' then 'entrevista' else 'perfil' end],review);
  if r.intencion<>'vender' then flow:=jsonb_set(flow,'{requisitos,privacidad}',review||jsonb_build_object('soporte','Aviso puesto a disposición durante entrevista '||r.id::text||'. No equivale a consentimiento.'));end if;
 end if;
 -- Freeze the validated snapshot before the advancement trigger inspects it.
 update public.fortius_inmuebles_interviews set respuestas=p_answers,cliente_id=customer,expediente_id=e.id,propiedad_slug=e.propiedad_slug,estado='completada',completion_version=version,version=version+1,completed_by=auth.uid(),completed_at=stamp where id=p_id returning * into r;
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
revoke all on function public.fortius_inmuebles_start_intake(uuid,text,jsonb,uuid),public.fortius_inmuebles_save_intake(uuid,bigint,jsonb,boolean) from public,anon,authenticated,service_role;
grant execute on function public.fortius_inmuebles_start_intake(uuid,text,jsonb,uuid),public.fortius_inmuebles_save_intake(uuid,bigint,jsonb,boolean) to authenticated;

-- Preserve legacy validator and expand only the explicit client role allowlist.
do $$ declare definition text;begin
 select pg_get_functiondef('public.fortius_inmuebles_validate_record(text,text,jsonb)'::regprocedure) into definition;
 if position('(''propietario'',''comprador'',''arrendador'',''arrendatario'',''otro'')' in definition)=0 then raise exception 'Unexpected client role validator';end if;
 execute replace(definition,'(''propietario'',''comprador'',''arrendador'',''arrendatario'',''otro'')','(''propietario'',''comprador'',''arrendador'',''arrendatario'',''inversionista'',''otro'')');
end;$$;
-- New operations cannot substitute a different interview's support or an obsolete revision.
create function public.fortius_inmuebles_guard_interview_evidence() returns trigger
language plpgsql security definer set search_path='' as $$
declare i public.fortius_inmuebles_interviews; key text;support text;
begin
 if new.flujo is null or new.etapa='captacion' then return new;end if;
 key:=case when new.flujo->>'ruta'='captacion' then 'entrevista' else 'perfil' end;
 if new.flujo->'requisitos'->key->>'estado' is distinct from 'revisado' then return new;end if;
 if not exists(select 1 from public.fortius_inmuebles_interviews where expediente_id=new.id and estado='completada') then return new;end if;
 select * into i from public.fortius_inmuebles_interviews where expediente_id=new.id and estado='completada' and cliente_id=new.cliente_id and asesor_id=new.asesor_id and propiedad_slug is not distinct from new.propiedad_slug order by completed_at desc,id desc limit 1;
 if not found or (new.flujo->>'ruta'='captacion') is distinct from (i.intencion='vender') then raise sqlstate 'PT409' using message='Completa una entrevista del contexto actual';end if;
 key:=case when i.intencion='vender' then 'entrevista' else 'perfil' end;
 support:='Entrevista operativa '||i.id::text||' · versión '||i.version::text||'. Declaraciones capturadas; documentos y capacidad pendientes de comprobar.';
 if new.flujo->'requisitos'->key->>'estado'='revisado' and new.flujo->'requisitos'->key->>'soporte' is distinct from support then raise sqlstate 'PT409' using message='El soporte debe corresponder a la entrevista actual';end if;
 return new;
end;$$;
revoke all on function public.fortius_inmuebles_guard_interview_evidence() from public,anon,authenticated,service_role;
create trigger fortius_02_interview_evidence before update on public.fortius_inmuebles_expedientes for each row execute function public.fortius_inmuebles_guard_interview_evidence();

-- Retain abandoned drafts as history when their operation changes contact/responsibility/property.
create function public.fortius_inmuebles_cancel_context_interviews() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.cliente_id is distinct from old.cliente_id or new.asesor_id is distinct from old.asesor_id or new.propiedad_slug is distinct from old.propiedad_slug then
  update public.fortius_inmuebles_interviews set estado='cancelada',version=version+1 where expediente_id=new.id and estado='borrador';
 end if;
 return new;
end;$$;
revoke all on function public.fortius_inmuebles_cancel_context_interviews() from public,anon,authenticated,service_role;
create trigger fortius_cancel_context_interviews after update on public.fortius_inmuebles_expedientes for each row execute function public.fortius_inmuebles_cancel_context_interviews();

create function public.fortius_inmuebles_cancel_contact_interviews() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.collection in ('leads','clientes') and new.data->>'asesorId' is distinct from old.data->>'asesorId' then
  update public.fortius_inmuebles_interviews set estado='cancelada',version=version+1 where estado='borrador' and ((new.collection='leads' and lead_id=new.id) or (new.collection='clientes' and cliente_id=new.id));
 end if;
 return new;
end;$$;
revoke all on function public.fortius_inmuebles_cancel_contact_interviews() from public,anon,authenticated,service_role;
create trigger fortius_cancel_contact_interviews after update of data on public.fortius_inmuebles_records for each row execute function public.fortius_inmuebles_cancel_contact_interviews();
notify pgrst,'reload schema';
commit;
