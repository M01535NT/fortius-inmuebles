-- Firma del contrato con Fortius (COR-10, RP-90, RP-91 y RP-97; autorizada por el titular el 12/11/2026).
-- Una persona es prospecto hasta que firma su contrato con Fortius, y el inmueble está captado
-- solo cuando el propietario firma la intermediación. Hasta ahora la operación no guardaba esa
-- firma: el requisito «intermediación» se cumplía con marcarlo revisado.
-- 1. La guía acepta «firmaContrato»: tipo de contrato, fecha, quién firmó por cada parte, el
--    contrato firmado (un documento del cliente de la misma operación), si está completa (con
--    quién falta) y, aparte, su revisión y su terminación. Admite contratos firmados fuera del panel.
--    El servidor anota quién la registró y cuándo; cambiar la firma borra su revisión.
-- 2. Solo un administrador (el director) la marca revisada, y nunca una firma incompleta.
-- 3. La firma no se borra: un contrato que se acaba se registra con su terminación.
-- 4. Para pasar a Publicación (o más adelante) en la venta y la renta del propietario hace falta la
--    firma completa, revisada y sin terminar; publicar el inmueble pide lo mismo.
-- No cambia ni borra datos existentes: las operaciones que ya están más adelante se conservan
-- donde están; la regla aplica al avanzar y al publicar.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

create function public.fortius_inmuebles_signature_ok(flow jsonb) returns boolean
language sql immutable set search_path='' as $body$
 select coalesce(jsonb_typeof(flow->'firmaContrato')='object'
  and flow->'firmaContrato'->'completa'='true'::jsonb and flow->'firmaContrato'->'revisada'='true'::jsonb
  and nullif(flow->'firmaContrato'->>'revisadoEl','') is not null
  and not (flow->'firmaContrato' ? 'terminacion'), false);
$body$;
revoke all on function public.fortius_inmuebles_signature_ok(jsonb) from public,anon,authenticated,service_role;

-- Valida la firma que llega y devuelve la que se guarda, con las marcas que pone el servidor.
create function public.fortius_inmuebles_contract_signature(sig jsonb,prev jsonb,exp_id uuid,context_changed boolean) returns jsonb
language plpgsql stable security definer set search_path='' as $body$
declare f jsonb; t jsonb; content jsonb; prev_content jsonb; result jsonb; stamp text:=to_char(clock_timestamp() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
 wants boolean; had boolean;
begin
 if sig is null then return prev; end if; -- la firma no se borra: se registra su terminación
 if jsonb_typeof(sig)<>'object' or exists(select 1 from jsonb_object_keys(sig) x where x not in ('tipo','fecha','firmantes','archivo','completa','faltan','revisada','registradoPor','registradoEl','revisadoPor','revisadoEl','terminacion'))
  or coalesce(sig->>'tipo','') not in ('intermediacion','intermediacion_renta','mandato')
  or jsonb_typeof(sig->'fecha') is distinct from 'string' or (sig->>'fecha') !~ '^\d{4}-\d{2}-\d{2}$'
  or jsonb_typeof(sig->'completa') is distinct from 'boolean' or jsonb_typeof(sig->'revisada') is distinct from 'boolean'
  or jsonb_typeof(sig->'archivo') is distinct from 'string' or length(sig->>'archivo')>64
  or jsonb_typeof(sig->'firmantes') is distinct from 'array' or jsonb_array_length(sig->'firmantes') not between 1 and 12
  or (sig ? 'faltan' and (jsonb_typeof(sig->'faltan') is distinct from 'string' or length(sig->>'faltan')>1000)) then
  raise sqlstate 'PT400' using message='Firma del contrato incompleta';
 end if;
 if to_char((sig->>'fecha')::date,'YYYY-MM-DD')<>sig->>'fecha' then raise sqlstate 'PT400' using message='Fecha de firma inválida';end if;
 for f in select value from jsonb_array_elements(sig->'firmantes') loop
  if jsonb_typeof(f)<>'object' or exists(select 1 from jsonb_object_keys(f) x where x not in ('nombre','parte'))
   or jsonb_typeof(f->'nombre') is distinct from 'string' or length(btrim(f->>'nombre')) not between 3 and 160
   or coalesce(f->>'parte','') not in ('propietario','representante','fortius','otro') then
   raise sqlstate 'PT400' using message='Firmante inválido';
  end if;
 end loop;
 if sig->'completa'='false'::jsonb and length(btrim(coalesce(sig->>'faltan','')))<3 then raise sqlstate 'PT400' using message='Indica quién falta por firmar';end if;
 if sig ? 'terminacion' then
  t:=sig->'terminacion';
  if jsonb_typeof(t)<>'object' or exists(select 1 from jsonb_object_keys(t) x where x not in ('fecha','motivo'))
   or jsonb_typeof(t->'fecha') is distinct from 'string' or (t->>'fecha') !~ '^\d{4}-\d{2}-\d{2}$'
   or jsonb_typeof(t->'motivo') is distinct from 'string' or length(btrim(t->>'motivo')) not between 3 and 1000 then
   raise sqlstate 'PT400' using message='Terminación del contrato incompleta';
  end if;
  if to_char((t->>'fecha')::date,'YYYY-MM-DD')<>t->>'fecha' then raise sqlstate 'PT400' using message='Fecha de terminación inválida';end if;
 end if;

 content:=sig-'registradoPor'-'registradoEl'-'revisada'-'revisadoPor'-'revisadoEl'-'terminacion';
 prev_content:=prev-'registradoPor'-'registradoEl'-'revisada'-'revisadoPor'-'revisadoEl'-'terminacion';
 if prev is null or content is distinct from prev_content or context_changed then
  -- Firma nueva o corregida: se vuelve a registrar y queda por revisar.
  if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida para registrar la firma';end if;
  if not exists(select 1 from public.fortius_inmuebles_expediente_archivos a where a.id::text=sig->>'archivo' and a.expediente_id=exp_id and a.deleted_at is null) then
   raise sqlstate 'PT400' using message='Sube el contrato firmado a los documentos del cliente y elígelo';
  end if;
  result:=content||jsonb_build_object('revisada',false,'registradoPor',auth.uid()::text,'registradoEl',stamp);
 else
  result:=content||jsonb_build_object('registradoPor',prev->'registradoPor','registradoEl',prev->'registradoEl');
  wants:=sig->'revisada'='true'::jsonb; had:=coalesce(prev->'revisada'='true'::jsonb,false);
  if wants is distinct from had then
   if not public.fortius_inmuebles_is_admin() then raise sqlstate 'PT403' using message='Solo el director marca la firma como revisada';end if;
   if wants and content->'completa'<>'true'::jsonb then raise sqlstate 'PT409' using message='Una firma incompleta no se marca revisada';end if;
   result:=result||case when wants then jsonb_build_object('revisada',true,'revisadoPor',auth.uid()::text,'revisadoEl',stamp) else jsonb_build_object('revisada',false) end;
  else
   result:=result||jsonb_build_object('revisada',had)||case when had then jsonb_build_object('revisadoPor',prev->'revisadoPor','revisadoEl',prev->'revisadoEl') else '{}'::jsonb end;
  end if;
 end if;
 if sig ? 'terminacion' then
  if prev is not null and prev->'terminacion' is distinct from sig->'terminacion' and auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida para registrar la terminación';end if;
  result:=result||jsonb_build_object('terminacion',sig->'terminacion');
 end if;
 return result;
exception when invalid_datetime_format or datetime_field_overflow then raise sqlstate 'PT400' using message='Fecha de firma inválida';
end; $body$;
revoke all on function public.fortius_inmuebles_contract_signature(jsonb,jsonb,uuid,boolean) from public,anon,authenticated,service_role;

do $$ declare definition text; anchor text; begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_guided_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 anchor:='''entregasInforme'',''contraparteLeadId'')';
 if position(anchor in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,anchor,'''entregasInforme'',''contraparteLeadId'',''firmaContrato'')');
 anchor:='if exists(select 1 from jsonb_object_keys(new.flujo) key';
 if (length(definition)-length(replace(definition,anchor,'')))/length(anchor)<>1 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,anchor,'
   if new.flujo ? ''firmaContrato'' or coalesce(case when tg_op=''UPDATE'' then old.flujo ? ''firmaContrato'' end,false) then
     new.flujo:=jsonb_set(new.flujo,''{firmaContrato}'',public.fortius_inmuebles_contract_signature(new.flujo->''firmaContrato'',case when tg_op=''UPDATE'' then old.flujo->''firmaContrato'' end,new.id,coalesce(context_changed,false)));
   end if;
   '||anchor);
 anchor:='foreach k in array public.fortius_inmuebles_flow_required(new.flujo->>''ruta'',new.etapa) loop';
 if (length(definition)-length(replace(definition,anchor,'')))/length(anchor)<>1 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,anchor,'if new.flujo->>''ruta'' in (''captacion'',''arrendador'') and new_stage>=3 and not public.fortius_inmuebles_signature_ok(new.flujo) then
         raise sqlstate ''PT409'' using message=''Registra la firma del contrato y que el director la revise antes de publicar'';end if;
       '||anchor);
 execute definition;
end; $$;

do $$ declare definition text; anchor text; begin
 select pg_get_functiondef('public.fortius_inmuebles_flow_publish_ready(uuid)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 anchor:='and public.fortius_inmuebles_resolution_allows(e.flujo,''comercializacion'')';
 if position(anchor in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_flow_publish_ready';end if;
 definition:=replace(definition,anchor,anchor||' and public.fortius_inmuebles_signature_ok(e.flujo)');
 execute definition;
end; $$;

notify pgrst, 'reload schema';
commit;
