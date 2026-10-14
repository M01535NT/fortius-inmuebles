-- Guided residential sale operations. Existing rows retain their stage and documents.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
alter table public.fortius_inmuebles_expedientes add column flujo jsonb;
alter table public.fortius_inmuebles_expediente_actividad add column detalle jsonb;
alter table public.fortius_inmuebles_expedientes drop constraint fortius_inmuebles_expedientes_etapa_check;
alter table public.fortius_inmuebles_expedientes add constraint fortius_inmuebles_expedientes_etapa_check
 check(etapa in ('captacion','documentacion','comercializacion','negociacion','cierre','entrega','postventa','cerrado'));

create function public.fortius_inmuebles_flow_required(route text, stage text) returns text[]
language plpgsql immutable set search_path='' as $$
declare n integer; keys text[];
begin
 n:=array_position(array['captacion','documentacion','comercializacion','negociacion','cierre','entrega','postventa','cerrado'],stage);
 keys:=case when route='captacion' then array['entrevista','titularidad'] else array['perfil','capacidad','privacidad'] end;
 if n<=1 then return array[]::text[]; end if;
 if n>=3 then keys:=keys || case when route='captacion' then array['factibilidad','valor','precio','intermediacion','levantamiento','plan','publicacion'] else array['opciones'] end; end if;
 if n>=4 then keys:=keys || case when route='captacion' then array['comprador'] else array['visitas'] end; end if;
 if n>=5 then keys:=keys || array['oferta','revision_cierre','instrumento','contraparte']; end if;
 if n>=6 then keys:=keys || array['firma','pago']; end if;
 if n>=7 then keys:=keys || array['entrega']; end if;
 if n>=8 then keys:=keys || array['registro','honorarios','archivo']; end if;
 return keys;
end;
$$;
revoke all on function public.fortius_inmuebles_flow_required(text,text) from public,anon,authenticated,service_role;

create function public.fortius_inmuebles_flow_review_ok(flow jsonb, key text) returns boolean
language sql stable set search_path='' as $$
 select coalesce((flow->'requisitos'->key->>'estado'='revisado'
   or (key in ('registro','honorarios') and flow->'requisitos'->key->>'estado'='no_aplica'))
 and length(btrim(flow->'requisitos'->key->>'soporte'))>=3
 and (key not in ('factibilidad','revision_cierre') or
   (flow->'requisitos'->key->>'vigenteHasta')::date >= (now() at time zone 'America/Tijuana')::date),false);
$$;
revoke all on function public.fortius_inmuebles_flow_review_ok(jsonb,text) from public,anon,authenticated,service_role;

create function public.fortius_inmuebles_flow_publish_ready(exp_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.fortius_inmuebles_expedientes e
 where e.id=exp_id and e.deleted_at is null and e.operacion='venta'
 and e.flujo->>'ruta'='captacion' and e.flujo->>'estado'='activa'
 and e.etapa in ('comercializacion','negociacion','cierre')
 and not exists(select 1 from unnest(public.fortius_inmuebles_flow_required('captacion','comercializacion')) k
   where not public.fortius_inmuebles_flow_review_ok(e.flujo,k))
 and not exists(select 1 from jsonb_each(e.flujo->'requisitos') r where r.value->>'estado'='observado'));
$$;
revoke all on function public.fortius_inmuebles_flow_publish_ready(uuid) from public,anon,authenticated,service_role;

create function public.fortius_inmuebles_guard_guided_operation() returns trigger
language plpgsql security definer set search_path='' as $$
declare k text; r jsonb; previous jsonb; stages text[]:=array['captacion','documentacion','comercializacion','negociacion','cierre','entrega','postventa','cerrado'];
 old_stage integer; new_stage integer; context_changed boolean:=false; counterpart uuid;
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
 end if;
 if new.flujo is not null then
   if new.operacion<>'venta' or jsonb_typeof(new.flujo)<>'object' or octet_length(new.flujo::text)>40000
     or new.flujo->'version' is distinct from '1'::jsonb or jsonb_typeof(new.flujo->'ruta') is distinct from 'string' or jsonb_typeof(new.flujo->'estado') is distinct from 'string' or new.flujo->>'ruta' is null or new.flujo->>'ruta' not in ('captacion','compra')
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
   if exists(select 1 from jsonb_object_keys(new.flujo) key where key not in ('version','ruta','estado','motivo','requisitos','contraparteId','contraparteExterna')) then
     raise sqlstate 'PT400' using message='Campo de guía desconocido'; end if;
   if new.propiedad_slug is not null and new.flujo->>'ruta'='captacion' and not exists(
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
       or not exists(select 1 from public.fortius_inmuebles_expedientes e where e.id=counterpart and e.operacion='venta'
         and e.flujo->>'ruta'<>new.flujo->>'ruta' and e.flujo->>'estado'='activa' and e.propiedad_slug=new.propiedad_slug and e.cliente_id<>new.cliente_id)) then
       raise sqlstate 'PT403' using message='Contraparte incompatible o fuera de tu alcance'; end if;
   end if;
   if length(coalesce(new.flujo->>'contraparteExterna',''))>1000 then raise sqlstate 'PT400' using message='Referencia de contraparte demasiado grande'; end if;
   if tg_op='UPDATE' and old.flujo is not null then
     new.flujo:=jsonb_set(new.flujo,'{requisitos}',coalesce(old.flujo->'requisitos','{}'::jsonb) || (new.flujo->'requisitos'));
   end if;
   for k,r in select key,value from jsonb_each(new.flujo->'requisitos') loop
     if k not in ('entrevista','titularidad','perfil','capacidad','privacidad','factibilidad','valor','precio','intermediacion','levantamiento','plan','publicacion','opciones','comprador','visitas','oferta','revision_cierre','instrumento','contraparte','firma','pago','entrega','registro','honorarios','archivo')
       or jsonb_typeof(r)<>'object' or jsonb_typeof(r->'estado') is distinct from 'string' or (r ? 'vigenteHasta' and jsonb_typeof(r->'vigenteHasta') is distinct from 'string') or r->>'estado' is null or r->>'estado' not in ('pendiente','recibido','revisado','observado','no_aplica')
       or jsonb_typeof(r->'soporte') is distinct from 'string' or length(r->>'soporte')>1000
       or exists(select 1 from jsonb_object_keys(r) key where key not in ('estado','soporte','vigenteHasta','registradoPor','registradoEl')) then
       raise sqlstate 'PT400' using message='Revisión de requisito inválida'; end if;
     if r->>'estado' in ('revisado','observado','no_aplica') and length(btrim(r->>'soporte'))<3 then
       raise sqlstate 'PT400' using message='La revisión necesita soporte o justificación'; end if;
     if r->>'estado'='no_aplica' and k not in ('registro','honorarios') then raise sqlstate 'PT400' using message='Este requisito no admite no aplicabilidad'; end if;
     if r ? 'vigenteHasta' then
       if (r->>'vigenteHasta') !~ '^\d{4}-\d{2}-\d{2}$' then raise sqlstate 'PT400' using message='Vigencia inválida'; end if;
       perform (r->>'vigenteHasta')::date;
     elsif k in ('factibilidad','revision_cierre') and r->>'estado'='revisado' then
       raise sqlstate 'PT400' using message='Declara la vigencia de la revisión competente';
     end if;
     previous:=case when tg_op='UPDATE' then old.flujo->'requisitos'->k else null end;
     if context_changed then
       -- Preserve the evidence, but a review of the old context cannot authorize the new one.
       if r->>'estado' in ('revisado','no_aplica') then r:=jsonb_set(r,'{estado}','"recibido"'::jsonb); end if;
     end if;
     if context_changed or (r - 'registradoPor' - 'registradoEl') is distinct from (previous - 'registradoPor' - 'registradoEl') then
       if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida para registrar revisión'; end if;
       r:=(r - 'registradoPor' - 'registradoEl') || jsonb_build_object('registradoPor',auth.uid(),'registradoEl',clock_timestamp());
     else r:=previous; end if;
     new.flujo:=jsonb_set(new.flujo,array['requisitos',k],r);
   end loop;
 end if;
 if new.operacion='venta' then
   if tg_op='INSERT' and new.etapa<>'captacion' then raise sqlstate 'PT409' using message='La operación inicia en captación o perfil'; end if;
   if tg_op='UPDATE' and new.etapa is distinct from old.etapa then
     if new.flujo is null or new.flujo->>'estado'<>'activa' or context_changed then raise sqlstate 'PT409' using message='Completa la guía activa y conserva el contexto antes de avanzar'; end if;
     old_stage:=array_position(stages,old.etapa);new_stage:=array_position(stages,new.etapa);
     if new_stage>old_stage+1 then raise sqlstate 'PT409' using message='Avanza una etapa a la vez'; end if;
     if new_stage<old_stage then
       if length(btrim(coalesce(new.flujo->>'motivo','')))<3 then raise sqlstate 'PT400' using message='Registra el motivo del retroceso'; end if;
     else
       if exists(select 1 from jsonb_each(new.flujo->'requisitos') x where x.value->>'estado'='observado') then raise sqlstate 'PT409' using message='Resuelve las observaciones abiertas'; end if;
       foreach k in array public.fortius_inmuebles_flow_required(new.flujo->>'ruta',new.etapa) loop
         if not public.fortius_inmuebles_flow_review_ok(new.flujo,k) then raise sqlstate 'PT409' using message='Requisito de avance pendiente: '||k; end if;
       end loop;
       if new_stage>=4 and new.propiedad_slug is null then raise sqlstate 'PT409' using message='Vincula el inmueble antes de negociar'; end if;
       if new_stage>=5 and counterpart is not null and not exists(select 1 from public.fortius_inmuebles_expedientes e
          where e.id=counterpart and e.deleted_at is null and e.operacion='venta' and e.propiedad_slug=new.propiedad_slug
          and e.flujo->>'estado'='activa' and e.flujo->>'ruta'<>new.flujo->>'ruta' and e.cliente_id<>new.cliente_id) then
         raise sqlstate 'PT409' using message='La operación contraparte requiere revisión antes del cierre'; end if;
       if new_stage>=5 and counterpart is null and length(btrim(coalesce(new.flujo->>'contraparteExterna','')))<3 then raise sqlstate 'PT409' using message='Identifica la contraparte interna o externa'; end if;
       if new.etapa='cerrado' then
         if exists(select 1 from public.fortius_inmuebles_records t where t.collection='tareas' and t.data->>'expedienteId'=new.id::text and t.data->>'estado' not in ('completada','cancelada')) then
           raise sqlstate 'PT409' using message='Resuelve o descarta las tareas pendientes antes de archivar'; end if;
       elsif not exists(select 1 from public.fortius_inmuebles_records t where t.collection='tareas' and t.data->>'expedienteId'=new.id::text
         and t.data->>'estado' in ('pendiente','en-curso','en-espera') and t.data->>'asesorId'=new.asesor_id
         and nullif(t.data->>'vence','') is not null) then
         raise sqlstate 'PT409' using message='Agenda una próxima tarea con fecha y responsable'; end if;
     end if;
   end if;
 end if;
 return new;
exception when invalid_datetime_format or datetime_field_overflow or invalid_text_representation then
 raise sqlstate 'PT400' using message='Fecha o referencia de guía inválida';
end;
$$;
revoke all on function public.fortius_inmuebles_guard_guided_operation() from public,anon,authenticated,service_role;
create trigger fortius_01_guard_guided_operation before insert or update on public.fortius_inmuebles_expedientes
 for each row execute function public.fortius_inmuebles_guard_guided_operation();

create function public.fortius_inmuebles_guard_guided_publication() returns trigger
language plpgsql security definer set search_path='' as $$
declare was_public boolean:=false;
begin
 if new.collection<>'propiedades' or new.data->>'operacion' is distinct from 'venta' or new.data->>'tipo' not in ('casa','departamento') or new.data->>'publicada' is distinct from 'true' then return new; end if;
 if tg_op='UPDATE' then was_public:=old.data->>'publicada'='true' and old.data->>'operacion'='venta' and old.data->>'tipo' in ('casa','departamento'); end if;
 if not coalesce(was_public,false) and not exists(select 1 from public.fortius_inmuebles_expedientes e
   where e.propiedad_slug=new.id and public.fortius_inmuebles_can_access_expediente(e.id)
     and public.fortius_inmuebles_flow_publish_ready(e.id)) then
   raise sqlstate 'PT409' using message='Completa y autoriza la captación vinculada antes de publicar'; end if;
 return new;
end;
$$;
revoke all on function public.fortius_inmuebles_guard_guided_publication() from public,anon,authenticated,service_role;
create trigger fortius_01_guard_guided_publication before insert or update of data on public.fortius_inmuebles_records
 for each row execute function public.fortius_inmuebles_guard_guided_publication();

-- Include full context changes in immutable activity, and reconcile dependent tasks transactionally.
create or replace function public.fortius_inmuebles_log_expediente_operation() returns trigger
language plpgsql security definer set search_path='' as $$
declare details text; t record; task_data jsonb; affected_slug text; invalidate_publication boolean;
begin
 if new.etapa is not distinct from old.etapa and new.fecha_objetivo is not distinct from old.fecha_objetivo
   and new.checklist is not distinct from old.checklist and new.flujo is not distinct from old.flujo
   and new.propiedad_slug is not distinct from old.propiedad_slug and new.cliente_id is not distinct from old.cliente_id
   and new.asesor_id is not distinct from old.asesor_id then return new; end if;
 if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida'; end if;
 if new.propiedad_slug is distinct from old.propiedad_slug or new.cliente_id is distinct from old.cliente_id or new.asesor_id is distinct from old.asesor_id then
   for t in select rec.id,rec.data,rec.version from public.fortius_inmuebles_records rec where rec.collection='tareas' and rec.data->>'expedienteId'=new.id::text for update loop
     task_data:=t.data || jsonb_build_object('clienteId',new.cliente_id,'asesorId',new.asesor_id,'propiedadSlug',coalesce(new.propiedad_slug,''));
     perform public.fortius_inmuebles_put_record('tareas',t.id,task_data,t.version);
   end loop;
 end if;
 details:=concat_ws('; ',case when new.etapa is distinct from old.etapa then 'Etapa: '||old.etapa||' → '||new.etapa end,
  case when new.fecha_objetivo is distinct from old.fecha_objetivo then 'Fecha objetivo actualizada' end,
  case when new.checklist is distinct from old.checklist then 'Checklist documental actualizado' end,
  case when new.flujo is distinct from old.flujo then 'Guía y revisiones actualizadas' end,
  case when new.propiedad_slug is distinct from old.propiedad_slug then 'Inmueble vinculado actualizado; tareas reconciliadas' end,
  case when new.cliente_id is distinct from old.cliente_id then 'Cliente actualizado; tareas reconciliadas' end,
  case when new.asesor_id is distinct from old.asesor_id then 'Responsable actualizado; tareas reconciliadas' end);
 insert into public.fortius_inmuebles_expediente_actividad(expediente_id,tipo,descripcion,created_by,detalle)
 values(new.id,'cambio',details,auth.uid(),jsonb_build_object('anterior',to_jsonb(old),'actual',to_jsonb(new)));
 -- An incomplete guide adopted on a historical listing is not an automatic withdrawal.
 -- Explicit suspension, observations, context changes or withdrawn reviews invalidate publication.
 invalidate_publication:=new.flujo->>'estado'<>'activa' or new.etapa in ('entrega','postventa','cerrado')
   or new.propiedad_slug is distinct from old.propiedad_slug or new.cliente_id is distinct from old.cliente_id or new.asesor_id is distinct from old.asesor_id
   or (old.flujo is not null and (new.flujo->>'ruta' is distinct from old.flujo->>'ruta'
      or new.flujo->>'contraparteId' is distinct from old.flujo->>'contraparteId' or new.flujo->>'contraparteExterna' is distinct from old.flujo->>'contraparteExterna'))
   or exists(select 1 from jsonb_each(coalesce(new.flujo->'requisitos','{}'::jsonb)) x
      where x.value->>'estado'='observado' or (old.flujo->'requisitos'->x.key->>'estado'='revisado' and x.value->>'estado'<>'revisado'));
 if invalidate_publication and (new.flujo->>'ruta'='captacion' or old.flujo->>'ruta'='captacion') then
   for affected_slug in select distinct value from unnest(array[new.propiedad_slug,old.propiedad_slug]) value where value is not null loop
     if not exists(select 1 from public.fortius_inmuebles_expedientes e where e.propiedad_slug=affected_slug and public.fortius_inmuebles_flow_publish_ready(e.id)) then
       update public.fortius_inmuebles_records rec set data=jsonb_set(rec.data,'{publicada}','false'::jsonb),version=rec.version+1
         where rec.collection='propiedades' and rec.id=affected_slug and rec.data->>'publicada'='true'
           and (public.fortius_inmuebles_is_admin() or rec.data->>'asesorId' in (new.asesor_id,old.asesor_id));
     end if;
   end loop;
 end if;
 return new;
end;
$$;
-- API mutations take the common lock before acquiring the expediente row lock.
create function public.fortius_inmuebles_update_operation(p_id uuid,p_version bigint,p_stage text,p_date date,p_checklist jsonb,p_flow jsonb default null,p_slug text default null,p_property_specified boolean default false)
returns jsonb language plpgsql set search_path='' as $$
declare r public.fortius_inmuebles_expedientes;
begin
 if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida'; end if;
 if not public.fortius_inmuebles_is_staff() then raise sqlstate 'PT403' using message='Acceso no autorizado'; end if;
 if p_version is null or p_version<=0 or p_property_specified is null then raise sqlstate 'PT400' using message='Versión inválida'; end if;
 perform pg_catalog.pg_advisory_xact_lock(781023);
 update public.fortius_inmuebles_expedientes e set etapa=p_stage,fecha_objetivo=p_date,checklist=p_checklist,
  flujo=coalesce(p_flow,e.flujo),propiedad_slug=case when p_property_specified then p_slug else e.propiedad_slug end,version=e.version+1
  where e.id=p_id and e.version=p_version and e.deleted_at is null returning e.* into r;
 if not found then raise sqlstate 'PT409' using message='El expediente cambió o no está disponible'; end if;
 return to_jsonb(r);
end;
$$;
revoke all on function public.fortius_inmuebles_update_operation(uuid,bigint,text,date,jsonb,jsonb,text,boolean) from public,anon,service_role;
grant execute on function public.fortius_inmuebles_update_operation(uuid,bigint,text,date,jsonb,jsonb,text,boolean) to authenticated;
notify pgrst,'reload schema';
commit;
