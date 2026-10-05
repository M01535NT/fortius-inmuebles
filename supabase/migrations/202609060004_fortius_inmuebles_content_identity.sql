-- Content-only cutover. IDs, references, source backups and storage metadata remain intact.
begin;
select pg_advisory_xact_lock(781023);
lock table public.mnt_records in access exclusive mode;

create function pg_temp.mnt_rebrand_json(value jsonb, field_name text default '') returns jsonb
language plpgsql immutable set search_path = '' as $$
declare result jsonb; entry record; label text;
begin
  -- A public URL slug and record/reference identifiers are not brand copy.
  if field_name in ('id','slug','asesorId','propiedadSlug','leadId','clienteId','user_id') then return value; end if;
  case jsonb_typeof(value)
    when 'object' then
      result := '{}'::jsonb;
      for entry in select key,val from jsonb_each(value) as e(key,val) loop
        result := result || jsonb_build_object(entry.key,pg_temp.mnt_rebrand_json(entry.val,entry.key));
      end loop;
      return result;
    when 'array' then
      select coalesce(jsonb_agg(pg_temp.mnt_rebrand_json(element) order by ordinal),'[]'::jsonb)
        into result from jsonb_array_elements(value) with ordinality as a(element,ordinal);
      return result;
    when 'string' then
      label := value #>> '{}';
      label := replace(label,'cota-eight.vercel.app','mnt-inmuebles.vercel.app');
      label := replace(label,'/descargas/checklist-venta-cota.pdf','/descargas/checklist-venta-mnt.pdf');
      label := regexp_replace(label,'\mCOTA-','MNT-','g');
      label := regexp_replace(label,'\mCOTA_','MNT_','g');
      label := regexp_replace(label,'\mcota-','mnt-','g');
      label := regexp_replace(label,'\mcota_','mnt_','g');
      -- URLs and mailboxes receive only explicit substitutions, never invented domains.
      if label !~ '(^[[:alpha:]][[:alnum:]+.-]*://|^/|^[^[:space:]]+@[^[:space:]]+$)' then
        label := regexp_replace(label,'(?<![/@.])\mCOTA\M(?![.]?[[:alnum:]_@/])','MNT Inmuebles','gi');
      end if;
      return to_jsonb(label);
    else return value;
  end case;
end;
$$;

with prepared as materialized (
  select collection,id,
    case when collection='config' and id='singleton' then
      data ||
      case when data->>'email'='contacto@cota.mx' then '{"email":""}'::jsonb else '{}'::jsonb end ||
      case when data->>'telefono'='+52 664 000 0000' then '{"telefono":""}'::jsonb else '{}'::jsonb end ||
      case when data->>'whatsapp'='https://wa.me/526640000000' then '{"whatsapp":""}'::jsonb else '{}'::jsonb end
    else data end as value
  from public.mnt_records
), transformed as materialized (
  select collection,id,pg_temp.mnt_rebrand_json(value) value from prepared
)
update public.mnt_records as target set data=source.value,updated_at=clock_timestamp()
  from transformed as source
  where (target.collection,target.id)=(source.collection,source.id)
    and target.data is distinct from source.value;

-- Normal revision triggers increment only changed rows and preserve every tombstone.
drop function pg_temp.mnt_rebrand_json(jsonb,text);
commit;
