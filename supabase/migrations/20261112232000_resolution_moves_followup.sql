begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

-- DEC-42 (titular, 12/11/2026): el siguiente paso de una operación es una sola tarea con fecha.
-- Antes, cada cambio de la decisión del encargo creaba otra tarea de seguimiento y la anterior
-- quedaba abierta. Ahora, si la operación ya tiene abierta una tarea de seguimiento de su decisión,
-- se mueve (título, fecha y motivo); si no, se crea como antes. Nunca se cancelan otras tareas.
create or replace function public.fortius_inmuebles_schedule_resolution() returns trigger
language plpgsql security definer set search_path='' as $$
declare decision jsonb; task_id text; task_data jsonb; prefix text; current_task public.fortius_inmuebles_records;
begin
 decision:=new.flujo->'resolucion';
 if decision is null or decision is not distinct from old.flujo->'resolucion' or new.etapa='cerrado' then return new;end if;
 if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida';end if;
 if exists(select 1 from public.fortius_inmuebles_records t where t.collection='tareas' and t.data->>'expedienteId'=new.id::text
   and t.data->>'estado' not in ('completada','cancelada') and t.data->>'titulo'=decision->>'siguienteAccion' and t.data->>'vence'=decision->>'fechaSiguiente') then return new;end if;
 prefix:='res'||replace(new.id::text,'-','')||'-';
 select t.* into current_task from public.fortius_inmuebles_records t
  where t.collection='tareas' and left(t.id,length(prefix))=prefix and t.data->>'expedienteId'=new.id::text
    and t.data->>'estado' not in ('completada','cancelada')
  order by t.updated_at desc limit 1;
 if found then
  task_data:=current_task.data || jsonb_build_object('titulo',decision->>'siguienteAccion','vence',decision->>'fechaSiguiente',
    'descripcion','Seguimiento de decisión: '||(decision->>'tipo')||E'\n'||(decision->>'motivo'));
  perform public.fortius_inmuebles_put_record('tareas',current_task.id,task_data,current_task.version);
  return new;
 end if;
 task_id:=prefix||new.version::text;
 task_data:=jsonb_build_object('id',task_id,'titulo',decision->>'siguienteAccion','descripcion','Seguimiento de decisión: '||(decision->>'tipo')||E'\n'||(decision->>'motivo'),'categoria','documentacion','estado','pendiente','prioridad','normal','pasos','[]'::jsonb,'asesorId',new.asesor_id,'clienteId',new.cliente_id,'expedienteId',new.id,'propiedadSlug',coalesce(new.propiedad_slug,''),'vence',decision->>'fechaSiguiente');
 perform public.fortius_inmuebles_put_record('tareas',task_id,task_data,null);
 return new;
end; $$;
revoke all on function public.fortius_inmuebles_schedule_resolution() from public,anon,authenticated,service_role;
notify pgrst,'reload schema';
commit;
