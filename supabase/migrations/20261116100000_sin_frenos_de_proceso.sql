-- Sin frenos de proceso (decisión del titular, 16/11/2026: «sin frenos de protección»). El sistema es
-- flexible: nada frena el avance del trabajo, solo avisa. El panel nuevo muestra como avisos del asunto
-- lo que antes se rechazaba aquí (src/lib/panel/datos/asuntos.ts, avisosDelAsunto).
--
-- Qué deja de frenar:
-- 1. La guía de la operación (fortius_inmuebles_guard_guided_operation) ya no rechaza cambios de etapa:
--    se quitan «La operación inicia en captación», «Completa la guía activa…», «Avanza una etapa a la vez»,
--    el motivo obligatorio del retroceso, «Resuelve las observaciones abiertas», «La resolución no autoriza
--    esta actividad», la firma revisada antes de publicar, quién captó y quién vendió antes de archivar,
--    los requisitos de avance por etapa (incluida la identificación LFPIORPI antes de la firma), el inmueble
--    antes de negociar, la contraparte antes del cierre, las tareas pendientes antes de archivar y la próxima
--    tarea agendada. La validación de la guía (tipos, campos, evidencias, firma, avalúo, cierre, visitas) sigue.
-- 2. Se quitan los disparadores del arrendamiento por etapas (fortius_03_guard_rent_progress), del candado
--    de arranque 02/04/checklist (fortius_04_guard_initial_gate), del freno de la firma por la cancelación de
--    hipoteca (fortius_00b_guard_mortgage_signing) y de la entrevista del contexto actual
--    (fortius_02_interview_evidence). Sus funciones se conservan sin uso; la consulta
--    fortius_inmuebles_tramites_que_frenan_firma sigue para el aviso.
-- 3. Publicar un inmueble propio ya no exige la captación autorizada, ni uno compartido la autorización
--    escrita de la inmobiliaria (fortius_inmuebles_guard_guided_publication); el compartido lo sigue
--    publicando solo el director.
--
-- Qué se conserva intacto: RLS, roles y permisos (lo que solo marca o autoriza el director), quién ve qué,
-- validación de datos y tipos, control de versión 409, folio inmutable, eliminación recuperable,
-- «Guardar no es publicar», un inmueble en evaluación no se publica y la dirección exacta no sale al sitio.
-- No reescribe registros.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

do $$
declare definition text; desde integer; hasta integer;
  inicio text := $m$if new.operacion in ('venta','renta','inversion') then$m$;
  fin text := $m$exception when invalid_datetime_format$m$;
begin
 select replace(pg_get_functiondef('public.fortius_inmuebles_guard_guided_operation()'::regprocedure),chr(13),'') into definition;
 -- Ya aplicada: no se repite.
 if position('SIN-FRENOS' in definition)>0 then return; end if;
 desde := position(inicio in definition);
 hasta := position(fin in definition);
 if desde=0 or hasta<=desde or position('Avanza una etapa a la vez' in definition)=0
   or (length(definition)-length(replace(definition,inicio,'')))/length(inicio)<>1 then
  raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';
 end if;
 definition := overlay(definition placing $m$/* SIN-FRENOS (16/11/2026): el cambio de etapa no se frena; el panel avisa lo que falta. */
 return new;
$m$ from desde for hasta-desde);
 execute definition;
end; $$;

drop trigger if exists fortius_03_guard_rent_progress on public.fortius_inmuebles_expedientes;
drop trigger if exists fortius_04_guard_initial_gate on public.fortius_inmuebles_expedientes;
drop trigger if exists fortius_00b_guard_mortgage_signing on public.fortius_inmuebles_expedientes;
drop trigger if exists fortius_02_interview_evidence on public.fortius_inmuebles_expedientes;

create or replace function public.fortius_inmuebles_guard_guided_publication() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.collection<>'propiedades' or new.data->>'publicada' is distinct from 'true' then return new; end if;
 if new.data->>'origen'='compartido' then
  -- Ya publicado como compartido, sigue publicado al editarse (como los propios).
  if tg_op='UPDATE' and old.data->>'publicada'='true' and old.data->>'origen'='compartido' then return new; end if;
  -- Permiso, no freno de proceso: un inmueble compartido lo publica el director.
  if not public.fortius_inmuebles_is_admin() then
   raise sqlstate 'PT403' using message='Un inmueble compartido lo publica el director';
  end if;
 end if;
 -- SIN-FRENOS (16/11/2026): sin captación autorizada ni autorización escrita del aliado también se publica; el panel lo avisa.
 return new;
end; $$;
revoke all on function public.fortius_inmuebles_guard_guided_publication() from public,anon,authenticated,service_role;

notify pgrst,'reload schema';
commit;
