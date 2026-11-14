-- Metodología M-04 (decisiones del titular, 14/11/2026). El director pasa una operación a otro
-- asesor, por ejemplo cuando un asesor cambia de operación o se da de baja:
-- 1. Lo revisado se queda aprobado: cambiar el asesor ya no reinicia las revisiones, la firma del
--    contrato, el avalúo ni la publicación. Cambiar el inmueble, el cliente o la ruta sí reinicia todo.
-- 2. Las demás operaciones abiertas del inmueble pasan juntas, junto con el inmueble y el cliente.
--    El acceso del asesor es por cliente: si el cliente tiene otra operación abierta fuera del grupo,
--    se rechaza con sus folios.
-- 3. Para comisiones, «captó» sigue siendo el asesor de antes: flujo.captadoPor guarda al primero.
--    Solo lo escribe la reasignación; el guardián rechaza cualquier otro cambio a esa clave.
-- Las tareas abiertas pasan al asesor nuevo; las terminadas o canceladas conservan a quien las tuvo.
-- Una nota de actividad registra quién reasignó, de quién a quién y el motivo; el registro
-- automático de cambios conserva la versión anterior completa. No reescribe registros existentes.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

create or replace function public.fortius_inmuebles_replace_once(definition text, anchor text, replacement text, expected integer, fn text)
returns text language plpgsql immutable set search_path='' as $$
begin
 if (length(definition)-length(replace(definition,anchor,'')))/length(anchor)<>expected then
  raise exception 'Unexpected process function %', fn;
 end if;
 return replace(definition,anchor,replacement);
end; $$;

do $$
declare definition text; fn text:='public.fortius_inmuebles_guard_guided_operation';
begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_guided_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('M-04' in definition)>0 then return;end if;
 -- «buyer_only» pasa a significar «el lado del propietario no cambió» (asesor y contraparte pueden cambiar).
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$   -- M-03: solo cambió la contraparte (se cayó el comprador).
   buyer_only:=context_changed and new.propiedad_slug is not distinct from old.propiedad_slug and new.cliente_id is not distinct from old.cliente_id
     and new.asesor_id is not distinct from old.asesor_id and new.flujo->>'ruta' is not distinct from old.flujo->>'ruta';$m$,
  $m$   -- M-03 y M-04: el lado del propietario no cambió; solo la contraparte (se cayó el comprador) o el asesor (reasignación).
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
   end if;$m$,1,fn);
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$buyer_only boolean:=false; reset_review boolean;$m$,
  $m$buyer_only boolean:=false; reset_review boolean; buyer_changed boolean:=false;$m$,1,fn);
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$     reset_review:=context_changed and (not buyer_only or k in ($m$,
  $m$     reset_review:=context_changed and (not buyer_only or buyer_changed and k in ($m$,1,fn);
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$'cierre','heredado','visitasPrevias')) then$m$,
  $m$'cierre','heredado','visitasPrevias','captadoPor')) then$m$,1,fn);
 -- Un alta nueva no trae «captó».
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$ if new.flujo is not null then
   if new.operacion not in$m$,
  $m$ if tg_op='INSERT' and new.flujo ? 'captadoPor' then raise sqlstate 'PT403' using message='El asesor que captó solo cambia al reasignar la operación'; end if;
 if new.flujo is not null then
   if new.operacion not in$m$,1,fn);
 execute definition;
end; $$;

do $$
declare definition text; fn text:='public.fortius_inmuebles_log_expediente_operation';
begin
 select pg_get_functiondef('public.fortius_inmuebles_log_expediente_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('M-04' in definition)>0 then return;end if;
 -- Al reasignar, las tareas terminadas conservan a quien las tuvo.
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$   for t in select rec.id,rec.data,rec.version from public.fortius_inmuebles_records rec where rec.collection='tareas' and rec.data->>'expedienteId'=new.id::text for update loop$m$,
  $m$   for t in select rec.id,rec.data,rec.version from public.fortius_inmuebles_records rec where rec.collection='tareas' and rec.data->>'expedienteId'=new.id::text
       /* M-04 */ and (new.propiedad_slug is distinct from old.propiedad_slug or new.cliente_id is distinct from old.cliente_id or rec.data->>'estado' not in ('completada','cancelada')) for update loop$m$,1,fn);
 -- Cambiar el asesor ya no retira la publicación.
 definition:=public.fortius_inmuebles_replace_once(definition,
  $m$   or new.propiedad_slug is distinct from old.propiedad_slug or new.cliente_id is distinct from old.cliente_id or new.asesor_id is distinct from old.asesor_id
$m$,
  $m$   /* M-04 */ or new.propiedad_slug is distinct from old.propiedad_slug or new.cliente_id is distinct from old.cliente_id
$m$,1,fn);
 execute definition;
end; $$;

drop function public.fortius_inmuebles_replace_once(text,text,text,integer,text);

-- La reasignación: solo el director, con motivo, a un asesor activo, todo el inmueble junto.
create or replace function public.fortius_inmuebles_reassign_operation(p_id uuid, p_asesor text, p_motivo text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare e public.fortius_inmuebles_expedientes; ids uuid[]; clients text[]; blocking text; target_name text; op record;
begin
 if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida'; end if;
 if not public.fortius_inmuebles_is_admin() then raise sqlstate 'PT403' using message='Solo el director reasigna operaciones'; end if;
 if length(btrim(coalesce(p_motivo,''))) not between 10 and 1000 then raise sqlstate 'PT400' using message='Escribe el motivo de la reasignación (al menos 10 caracteres)'; end if;
 select r.data->>'nombre' into target_name from public.fortius_inmuebles_records r
  where r.collection='asesores' and r.id=p_asesor and coalesce(r.data->>'activo','true')<>'false';
 if not found then raise sqlstate 'PT400' using message='Elige un asesor activo del equipo'; end if;
 perform pg_catalog.pg_advisory_xact_lock(781023);
 select * into e from public.fortius_inmuebles_expedientes where id=p_id and deleted_at is null for update;
 if not found then raise sqlstate 'PT404' using message='Operación no encontrada'; end if;
 -- La operación y las demás abiertas del mismo inmueble.
 select array_agg(x.id order by x.created_at) into ids from public.fortius_inmuebles_expedientes x
  where x.deleted_at is null and (x.id=e.id or (e.propiedad_slug is not null and x.propiedad_slug=e.propiedad_slug
    and x.etapa<>'cerrado' and coalesce(x.flujo->>'estado','activa')<>'descartada'));
 if not exists(select 1 from public.fortius_inmuebles_expedientes x where x.id=any(ids) and x.asesor_id<>p_asesor) then
  raise sqlstate 'PT400' using message='La operación ya es de ese asesor';
 end if;
 select array_agg(distinct x.cliente_id) into clients from public.fortius_inmuebles_expedientes x where x.id=any(ids);
 -- El acceso es por cliente: no se parte un cliente entre dos asesores.
 select string_agg(x.folio,', ' order by x.folio) into blocking from public.fortius_inmuebles_expedientes x
  where x.deleted_at is null and x.cliente_id=any(clients) and x.id<>all(ids) and x.asesor_id<>p_asesor
    and x.etapa<>'cerrado' and coalesce(x.flujo->>'estado','activa')<>'descartada';
 if blocking is not null then
  raise sqlstate 'PT409' using message='El cliente tiene otras operaciones abiertas ('||blocking||'); reasígnalas primero o juntas';
 end if;
 if e.propiedad_slug is not null then
  update public.fortius_inmuebles_records set data=jsonb_set(data,'{asesorId}',to_jsonb(p_asesor)),version=version+1,updated_at=clock_timestamp()
   where collection='propiedades' and id=e.propiedad_slug and data->>'asesorId' is distinct from p_asesor;
 end if;
 update public.fortius_inmuebles_records set data=jsonb_set(data,'{asesorId}',to_jsonb(p_asesor)),version=version+1,updated_at=clock_timestamp()
  where collection='clientes' and id=any(clients) and data->>'asesorId' is distinct from p_asesor;
 perform set_config('fortius.reasignando','1',true);
 for op in select x.id,x.asesor_id,x.flujo from public.fortius_inmuebles_expedientes x where x.id=any(ids) and x.asesor_id<>p_asesor order by x.created_at loop
  update public.fortius_inmuebles_expedientes set asesor_id=p_asesor,version=version+1,
    flujo=case when flujo is null or flujo ? 'captadoPor' then flujo else jsonb_set(flujo,'{captadoPor}',to_jsonb(op.asesor_id)) end
   where id=op.id;
  insert into public.fortius_inmuebles_expediente_actividad(expediente_id,tipo,descripcion,created_by)
   values(op.id,'nota',left('Reasignada por el director de '||coalesce((select r.data->>'nombre' from public.fortius_inmuebles_records r where r.collection='asesores' and r.id=op.asesor_id),op.asesor_id)
     ||' a '||coalesce(target_name,p_asesor)||'. Motivo: '||btrim(p_motivo),1000),auth.uid());
 end loop;
 perform set_config('fortius.reasignando','',true);
 return jsonb_build_object('movidas',to_jsonb(ids));
end; $$;
revoke all on function public.fortius_inmuebles_reassign_operation(uuid,text,text) from public, anon;
grant execute on function public.fortius_inmuebles_reassign_operation(uuid,text,text) to authenticated, service_role;

notify pgrst,'reload schema';
commit;
