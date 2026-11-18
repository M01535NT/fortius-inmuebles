-- Cuando el director cambia quién lleva un asunto, las tareas pendientes de quien lo llevaba
-- pasan a la nueva persona (decisión del titular, 17/11/2026; SPEC.md, sección de Asuntos).
-- Las tareas que tenía otra persona del equipo y las ya hechas o descartadas se quedan como están.
-- Cada tarea movida queda en el Historial por su propio disparador.
-- Solo el director puede cambiar quién lleva un asunto: eso ya lo revisa fortius_inmuebles_guard_asunto.

create or replace function public.fortius_inmuebles_tareas_siguen_al_asunto()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.responsable_id is distinct from old.responsable_id then
    update public.fortius_inmuebles_tareas
       set responsable_id = new.responsable_id
     where asunto_id = new.id
       and responsable_id = old.responsable_id
       and estado = 'pendiente'
       and deleted_at is null;
  end if;
  return null;
end;
$function$;

revoke all on function public.fortius_inmuebles_tareas_siguen_al_asunto() from public, anon, authenticated;

create trigger fortius_zx_tareas_siguen_al_asunto
after update of responsable_id on public.fortius_inmuebles_asuntos
for each row execute function public.fortius_inmuebles_tareas_siguen_al_asunto();
