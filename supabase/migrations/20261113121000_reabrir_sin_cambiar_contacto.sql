-- SEG-M1 (auditoría del 13/11/2026), sobre CRM-03 (20261112231000): quien escribe desde el sitio
-- no ha probado ser la persona descartada que reconoce el teléfono o el correo. Al reabrirla, el
-- correo guardado ya no se reemplaza (el teléfono nunca se reemplazó): si el visitante dejó otro
-- correo, queda en la nota de regreso como «sin verificar», para que el asesor lo confirme antes de
-- usarlo. Lo demás de CRM-03 no cambia. Solo cambia la captura pública.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

do $$
declare definition text;
  picked text := $m$public.fortius_inmuebles_pick(d,array['propiedadSlug','mensaje','zona','tipoPropiedad','email'])$m$;
  noted text := $m$||coalesce(': «'||left(nullif(btrim(d->>'mensaje'),''),300)||'»','')))$m$;
begin
 select pg_get_functiondef('public.fortius_inmuebles_capture_lead(jsonb,text)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 -- Ya aplicada: no se repite el reemplazo.
 if position('Dejó otro correo' in definition)>0 then return;end if;
 if position(picked in definition)=0 or position(noted in definition)=0
 then raise exception 'Unexpected lead capture function public.fortius_inmuebles_capture_lead';end if;
 definition:=replace(definition,picked,$m$public.fortius_inmuebles_pick(d,array['propiedadSlug','mensaje','zona','tipoPropiedad'])$m$);
 definition:=replace(definition,noted,
  $m$||coalesce(': «'||left(nullif(btrim(d->>'mensaje'),''),300)||'»','')
          ||case when email_in<>'' and email_in is distinct from lower(btrim(coalesce(back->>'email','')))
            then '. Dejó otro correo, sin verificar: '||left(email_in,254) else '' end))$m$);
 execute definition;
end; $$;
notify pgrst,'reload schema';
commit;
