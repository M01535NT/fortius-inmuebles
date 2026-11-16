-- PN-02 · Bloque 3: el expediente pasa a ser el «asunto» del panel nuevo (RP-106, RP-108). Solo agrega columnas opcionales:
-- los expedientes del panel viejo quedan con tipo_asunto vacío y siguen funcionando igual.
-- cliente_id sigue siendo obligatorio por ahora (todo asunto tiene una persona principal); hacerlo opcional se decide en PN-04,
-- porque lo usan los permisos de documentos del panel viejo. No se amplía el check de `operacion` (freno de firma y guías).
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(781023);

alter table public.fortius_inmuebles_expedientes
  add column titulo text check (titulo is null or length(btrim(titulo)) between 1 and 160),
  add column tipo_asunto text check (tipo_asunto in ('venta', 'renta', 'busqueda', 'tramite', 'inversion', 'revision', 'otro')),
  add column estado_asunto text not null default 'activo' check (estado_asunto in ('activo', 'en_espera', 'cerrado')),
  add column resultado text check (resultado in ('se_logro', 'no_se_dio')),
  add column continua_de uuid references public.fortius_inmuebles_expedientes (id) on delete restrict,
  add column derivado_de uuid references public.fortius_inmuebles_expedientes (id) on delete restrict,
  add column creado_por uuid default auth.uid() references auth.users (id),
  add constraint fortius_inmuebles_asunto_cerrado_con_resultado check ((estado_asunto = 'cerrado') = (resultado is not null)),
  add constraint fortius_inmuebles_asunto_no_se_continua_a_si check (continua_de is distinct from id and derivado_de is distinct from id);

create index on public.fortius_inmuebles_expedientes (tipo_asunto, estado_asunto) where deleted_at is null;

commit;
