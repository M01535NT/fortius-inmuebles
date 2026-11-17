-- Hora opcional de la tarea (boceto «Inicio», Posponer: «Esta tarde · 17:00»; DECISIONES «Patrones de interacción»).
-- SIN APLICAR: se aplica al integrar.
-- Las tareas del panel viven en la colección «tareas» de fortius_inmuebles_records (jsonb). Hasta ahora solo guardaban
-- el día (`vence`). Desde aquí pueden llevar además `hora` ("HH:MM", de 00:00 a 23:59), siempre con su día.
-- Sin hora la tarea sigue siendo de todo el día, como antes: nada cambia para las que ya existen.
-- Solo agrega una regla; no reescribe funciones ni registros. Se puede volver a correr.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(781023);

alter table public.fortius_inmuebles_records drop constraint if exists fortius_inmuebles_records_hora_de_tarea;
alter table public.fortius_inmuebles_records add constraint fortius_inmuebles_records_hora_de_tarea check (
  collection <> 'tareas'
  or not (data ? 'hora')
  or data->>'hora' = ''
  or (
    jsonb_typeof(data->'hora') = 'string'
    and data->>'hora' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    and coalesce(data->>'vence', '') <> ''
  )
) not valid;
-- Ninguna tarea guardada tiene hora todavía: la validación no encuentra nada que corregir.
alter table public.fortius_inmuebles_records validate constraint fortius_inmuebles_records_hora_de_tarea;

comment on constraint fortius_inmuebles_records_hora_de_tarea on public.fortius_inmuebles_records is
  'Tareas: la hora opcional es HH:MM y solo va con su día (vence).';

commit;
