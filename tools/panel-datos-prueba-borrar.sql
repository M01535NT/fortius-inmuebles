-- Borra los datos de prueba del panel anterior (regla del titular, 16/11/2026: el panel nuevo arranca con datos nuevos).
-- Los datos de prueba NUEVOS se cargaron el 16/11/2026 a partir de las 07:49 UTC y NO se tocan: aquí solo se borra lo creado antes.
-- Se pega UNA vez en el editor SQL de Supabase. Todo va en una transacción: si algo falla, no se borra nada.
-- Respaldo previo: tmp/datos-prueba-anteriores-2026-11-16T07-45-29-302Z.json (más el respaldo completo del titular).
-- No toca asesores, configuración, contenido, blog (posts), personal ni preferencias.
-- Solo vale mientras la base tenga datos de prueba (autorización del 17/10/2026).
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create temp table corte on commit drop as select timestamptz '2026-11-16 07:49:00+00' as t;
create temp table viejos_exp on commit drop as
  select id from public.fortius_inmuebles_expedientes where created_at < (select t from corte);
create temp table viejos_reg on commit drop as
  select collection, id from public.fortius_inmuebles_records
  where collection in ('clientes','leads','propiedades','tareas','eventos','notas','archivos','tramites')
    and created_at < (select t from corte);

-- Todo lo que cuelga de los expedientes viejos y de los formatos (lo nuevo no tiene nada de esto). De hijos a padres.
delete from public.fortius_inmuebles_signed_copies;
delete from public.fortius_inmuebles_signature_events;
delete from public.fortius_inmuebles_integration_pages;
delete from public.fortius_inmuebles_integration_artifacts;
delete from public.fortius_inmuebles_integration_jobs;
delete from public.fortius_inmuebles_formato_assets;
delete from public.fortius_inmuebles_formato_emissions;
delete from public.fortius_inmuebles_formato_drafts;
delete from public.fortius_inmuebles_app_shares;
delete from public.fortius_inmuebles_app_run_versions;
delete from public.fortius_inmuebles_app_runs;
delete from public.fortius_inmuebles_app_files;
delete from public.fortius_inmuebles_ia_lecturas;
delete from public.fortius_inmuebles_expediente_archivos;
delete from public.fortius_inmuebles_expediente_datos;
delete from public.fortius_inmuebles_expediente_actividad;
-- Las entrevistas se apuntan entre sí (anterior_id): se borran de la más nueva a la más vieja.
do $$
begin
  loop
    delete from public.fortius_inmuebles_interviews i
    where not exists (select 1 from public.fortius_inmuebles_interviews x where x.anterior_id = i.id);
    exit when not found;
  end loop;
end $$;
delete from public.fortius_inmuebles_lead_conversions;
delete from public.fortius_inmuebles_comercial_emissions;
delete from public.fortius_inmuebles_comercial_revisions;
delete from public.fortius_inmuebles_comercial_books;

-- Registros viejos: referencias, tareas (apuntan a expedientes), expedientes y el resto.
delete from public.fortius_inmuebles_record_references rr
where exists (select 1 from viejos_reg v where v.collection = rr.source_collection and v.id = rr.source_id)
   or exists (select 1 from viejos_reg v where v.collection = rr.target_collection and v.id = rr.target_id);
delete from public.fortius_inmuebles_records r using viejos_reg v where r.collection = v.collection and r.id = v.id and r.collection = 'tareas';
-- Una tarea nueva no debe colgar de un expediente viejo; si alguna lo hiciera, la transacción se detiene aquí.
delete from public.fortius_inmuebles_expedientes e using viejos_exp v where e.id = v.id;
delete from public.fortius_inmuebles_records r using viejos_reg v where r.collection = v.collection and r.id = v.id;
delete from public.fortius_inmuebles_record_history h using viejos_reg v where h.collection = v.collection and h.record_id = v.id;
delete from public.fortius_inmuebles_record_revisions x using viejos_reg v where x.collection = v.collection and x.id = v.id;
delete from public.fortius_inmuebles_file_uploads where created_at < (select t from corte);

-- Comprobación: lo viejo en 0 y lo nuevo intacto (6 personas, 4 consultas, 5 inmuebles, 4 tareas, 3 asuntos).
select 'viejos que quedan' que, count(*) from public.fortius_inmuebles_records
  where collection in ('clientes','leads','propiedades','tareas','eventos','notas','archivos','tramites') and created_at < (select t from corte)
union all select 'expedientes viejos', count(*) from public.fortius_inmuebles_expedientes where created_at < (select t from corte)
union all select 'registros nuevos', count(*) from public.fortius_inmuebles_records
  where collection in ('clientes','leads','propiedades','tareas') and created_at >= (select t from corte)
union all select 'asuntos nuevos', count(*) from public.fortius_inmuebles_expedientes where created_at >= (select t from corte);
commit;
