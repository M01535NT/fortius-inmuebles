-- Read-only, owner SQL export. Coordinate a write freeze through object backup completion.
-- Export the single backup cell as JSON. Contains private information; keep outside public/.
select jsonb_build_object(
  'format','mnt-owner-export-v1','prefix','cota','exported_at',now(),
  'tables',jsonb_build_object(
    'cota_staff',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from public.cota_staff t),
    'cota_records',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from public.cota_records t),
    'cota_record_references',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from public.cota_record_references t),
    'cota_rate_limits',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from public.cota_rate_limits t),
    'cota_record_revisions',(select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from public.cota_record_revisions t)
  )
) as backup;
