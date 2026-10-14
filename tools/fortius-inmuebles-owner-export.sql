-- Read-only owner export of all 26 current tables, including private Apps data.
-- Schema version 2 requires the complete Apps inventory. Preserve the raw export.
select jsonb_build_object(
  'format', 'mnt-owner-export-v1',
  'prefix', 'fortius_inmuebles',
  'schema_version', 2,
  'exported_at', now(),
  'tables', jsonb_build_object(
    'fortius_inmuebles_staff', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_staff t),
    'fortius_inmuebles_records', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_records t),
    'fortius_inmuebles_record_revisions', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_record_revisions t),
    'fortius_inmuebles_rate_limits', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_rate_limits t),
    'fortius_inmuebles_adviser_accounts', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_adviser_accounts t),
    'fortius_inmuebles_expedientes', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_expedientes t),
    'fortius_inmuebles_record_references', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_record_references t),
    'fortius_inmuebles_file_uploads', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_file_uploads t),
    'fortius_inmuebles_formato_drafts', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_formato_drafts t),
    'fortius_inmuebles_formato_assets', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_formato_assets t),
    'fortius_inmuebles_formato_emissions', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_formato_emissions t),
    'fortius_inmuebles_signed_copies', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_signed_copies t),
    'fortius_inmuebles_comercial_books', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_comercial_books t),
    'fortius_inmuebles_comercial_revisions', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_comercial_revisions t),
    'fortius_inmuebles_comercial_emissions', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_comercial_emissions t),
    'fortius_inmuebles_lead_conversions', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_lead_conversions t),
    'fortius_inmuebles_record_history', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_record_history t),
    'fortius_inmuebles_expediente_actividad', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_expediente_actividad t),
    'fortius_inmuebles_app_runs', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_app_runs t),
    'fortius_inmuebles_app_run_versions', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_app_run_versions t),
    'fortius_inmuebles_app_files', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_app_files t),
    'fortius_inmuebles_app_shares', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_app_shares t),
    'fortius_inmuebles_integration_jobs', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_integration_jobs t),
    'fortius_inmuebles_integration_artifacts', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_integration_artifacts t),
    'fortius_inmuebles_integration_pages', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_integration_pages t),
    'fortius_inmuebles_signature_events', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fortius_inmuebles_signature_events t)
  )
) as backup;
