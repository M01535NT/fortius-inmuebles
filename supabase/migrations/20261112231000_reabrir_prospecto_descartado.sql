-- CRM-03 (titular, 12/11/2026): si una persona descartada vuelve a escribir desde el sitio, se
-- reabre la misma persona en vez de crear otra. Se reconoce por teléfono (10 dígitos, con o sin 52)
-- o por correo, igual que `duplicateContacts` del panel. Vuelve a «Nuevo» con todo su historial y
-- una nota de que regresó y por dónde; `reabiertoEl` marca desde cuándo corre el plazo de primera
-- atención (`firstContactedAt` no se puede borrar). La recibe su asesor si sigue activo; si no,
-- queda sin asesor y le toca al director. Lo nuevo que escribió (inmueble, mensaje, zona, tipo,
-- correo) reemplaza lo anterior. Al visitante no se le muestra nada distinto. No toca a quien ya
-- es cliente ni a quien sigue activo. Solo cambia la captura pública.
begin;
select pg_advisory_xact_lock(781023);

do $$
declare definition text;
  anchor text := $m$perform public.fortius_inmuebles_validate_record('leads',lead_id,d);$m$;
  declared text := 'declare d jsonb;';
begin
 select pg_get_functiondef('public.fortius_inmuebles_capture_lead(jsonb,text)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 -- Ya aplicada: no se repite el reemplazo.
 if position('reabiertoEl' in definition)>0 then return;end if;
 if position(anchor in definition)=0 or position(declared in definition)=0
 then raise exception 'Unexpected lead capture function public.fortius_inmuebles_capture_lead';end if;
 definition:=replace(definition,declared,'declare back_id text; back jsonb; phone_in text; email_in text; d jsonb;');
 definition:=replace(definition,anchor,
  $m$phone_in:=regexp_replace(coalesce(p_data->>'telefono',''),'\D','','g');
  if length(phone_in)=12 and left(phone_in,2)='52' then phone_in:=substr(phone_in,3);end if;
  email_in:=lower(btrim(coalesce(p_data->>'email','')));
  select r.id,r.data into back_id,back from public.fortius_inmuebles_records r
   where r.collection='leads' and r.data->>'estado'='descartado' and coalesce(r.data->>'clienteId','')=''
     and ((length(phone_in)>=7 and (case when length(regexp_replace(coalesce(r.data->>'telefono',''),'\D','','g'))=12 and left(regexp_replace(coalesce(r.data->>'telefono',''),'\D','','g'),2)='52'
            then substr(regexp_replace(coalesce(r.data->>'telefono',''),'\D','','g'),3) else regexp_replace(coalesce(r.data->>'telefono',''),'\D','','g') end)=phone_in)
       or (email_in<>'' and lower(btrim(coalesce(r.data->>'email','')))=email_in))
   order by r.updated_at desc limit 1 for update;
  if back_id is not null then
    -- Su asesor la recibe si sigue activo; si no, le toca al director (sin asesor).
    if coalesce(back->>'asesorId','')<>'' and not exists(select 1 from public.fortius_inmuebles_records a
        where a.collection='asesores' and a.id=back->>'asesorId' and a.data->>'activo'='true') then back:=back-'asesorId';end if;
    back:=back || public.fortius_inmuebles_pick(d,array['propiedadSlug','mensaje','zona','tipoPropiedad','email'])
      || jsonb_build_object('estado','nuevo','reabiertoEl',now(),'notas',
        jsonb_build_array(jsonb_build_object('id',gen_random_uuid()::text,'fecha',now(),'texto',
          'Regresó por el sitio'
          ||coalesce(' preguntando por '||(select p.data->>'titulo' from public.fortius_inmuebles_records p where p.collection='propiedades' and p.id=d->>'propiedadSlug'),'')
          ||coalesce(': «'||left(nullif(btrim(d->>'mensaje'),''),300)||'»','')))
        || coalesce(back->'notas','[]'::jsonb));
    perform public.fortius_inmuebles_validate_record('leads',back_id,back);
    update public.fortius_inmuebles_records set data=back,updated_at=clock_timestamp() where collection='leads' and id=back_id;
    perform public.fortius_inmuebles_sync_references('leads',back_id,back);
    return back_id;
  end if;
  $m$||anchor);
 execute definition;
end; $$;
notify pgrst,'reload schema';
commit;
