begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

-- Decisions produce dated work, but never cancel existing legal/economic tasks.
create function public.fortius_inmuebles_schedule_resolution() returns trigger
language plpgsql security definer set search_path='' as $$
declare decision jsonb; task_id text; task_data jsonb;
begin
 decision:=new.flujo->'resolucion';
 if decision is null or decision is not distinct from old.flujo->'resolucion' or new.etapa='cerrado' then return new;end if;
 if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida';end if;
 if exists(select 1 from public.fortius_inmuebles_records t where t.collection='tareas' and t.data->>'expedienteId'=new.id::text
   and t.data->>'estado' not in ('completada','cancelada') and t.data->>'titulo'=decision->>'siguienteAccion' and t.data->>'vence'=decision->>'fechaSiguiente') then return new;end if;
 task_id:='res'||replace(new.id::text,'-','')||'-'||new.version::text;
 task_data:=jsonb_build_object('id',task_id,'titulo',decision->>'siguienteAccion','descripcion','Seguimiento de decisión: '||(decision->>'tipo')||E'\n'||(decision->>'motivo'),'categoria','documentacion','estado','pendiente','prioridad','normal','pasos','[]'::jsonb,'asesorId',new.asesor_id,'clienteId',new.cliente_id,'expedienteId',new.id,'propiedadSlug',coalesce(new.propiedad_slug,''),'vence',decision->>'fechaSiguiente');
 perform public.fortius_inmuebles_put_record('tareas',task_id,task_data,null);
 return new;
end; $$;
revoke all on function public.fortius_inmuebles_schedule_resolution() from public,anon,authenticated,service_role;
create trigger fortius_schedule_resolution after update on public.fortius_inmuebles_expedientes
 for each row execute function public.fortius_inmuebles_schedule_resolution();
notify pgrst,'reload schema';
commit;
