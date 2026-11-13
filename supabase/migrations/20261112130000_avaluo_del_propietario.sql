-- Avalúo del propietario (COR-17, RP-96; dentro del bloque 1 del plan).
-- Cuando el propietario ya trae un avalúo no hace falta la opinión de valor (07):
-- 1. La guía acepta «avaluo»: el archivo (un documento del cliente de la misma operación),
--    el perito, la fecha, el valor y la vigencia. El servidor anota quién lo registró y cuándo.
-- 2. El respaldo de cualquier requisito admite un documento del cliente (tipo «cliente»),
--    además de un formato, su PDF, una imagen o un documento fuera del sistema.
-- 3. El requisito «valor» respaldado con el avalúo solo cuenta mientras el avalúo está vigente:
--    vencido, la operación vuelve a pedir el valor para avanzar y para publicar.
-- No cambia ni borra datos existentes.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

-- Valida el avalúo que llega y devuelve el que se guarda, con las marcas que pone el servidor.
create function public.fortius_inmuebles_owner_appraisal(a jsonb,prev jsonb,exp_id uuid,context_changed boolean) returns jsonb
language plpgsql stable security definer set search_path='' as $body$
declare content jsonb; stamp text:=to_char(clock_timestamp() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
 if a is null then return null; end if;
 if jsonb_typeof(a)<>'object' or exists(select 1 from jsonb_object_keys(a) x where x not in ('archivo','perito','fecha','valor','vigenteHasta','registradoPor','registradoEl'))
  or jsonb_typeof(a->'archivo') is distinct from 'string' or length(a->>'archivo')>64
  or jsonb_typeof(a->'perito') is distinct from 'string' or length(btrim(a->>'perito')) not between 3 and 160
  or jsonb_typeof(a->'valor') is distinct from 'number' or (a->>'valor')::numeric<=0 or (a->>'valor')::numeric>=1000000000000
  or jsonb_typeof(a->'fecha') is distinct from 'string' or (a->>'fecha') !~ '^\d{4}-\d{2}-\d{2}$'
  or jsonb_typeof(a->'vigenteHasta') is distinct from 'string' or (a->>'vigenteHasta') !~ '^\d{4}-\d{2}-\d{2}$' then
  raise sqlstate 'PT400' using message='Avalúo incompleto: archivo, perito, fecha, valor y vigencia';
 end if;
 if to_char((a->>'fecha')::date,'YYYY-MM-DD')<>a->>'fecha' or to_char((a->>'vigenteHasta')::date,'YYYY-MM-DD')<>a->>'vigenteHasta' then raise sqlstate 'PT400' using message='Fecha del avalúo inválida';end if;
 if (a->>'vigenteHasta')::date<(a->>'fecha')::date then raise sqlstate 'PT400' using message='La vigencia del avalúo no puede ser anterior a su fecha';end if;
 content:=a-'registradoPor'-'registradoEl';
 if prev is not null and content=(prev-'registradoPor'-'registradoEl') and not context_changed then
  return content||jsonb_build_object('registradoPor',prev->'registradoPor','registradoEl',prev->'registradoEl');
 end if;
 if auth.uid() is null then raise sqlstate 'PT401' using message='Sesión requerida para registrar el avalúo';end if;
 if not exists(select 1 from public.fortius_inmuebles_expediente_archivos f where f.id::text=a->>'archivo' and f.expediente_id=exp_id and f.deleted_at is null) then
  raise sqlstate 'PT400' using message='Sube el avalúo a los documentos del cliente y elígelo';
 end if;
 return content||jsonb_build_object('registradoPor',auth.uid()::text,'registradoEl',stamp);
exception when invalid_datetime_format or datetime_field_overflow then raise sqlstate 'PT400' using message='Fecha del avalúo inválida';
end; $body$;
revoke all on function public.fortius_inmuebles_owner_appraisal(jsonb,jsonb,uuid,boolean) from public,anon,authenticated,service_role;

-- Un documento del cliente respalda un requisito de su misma operación.
do $$ declare definition text; anchor text; begin
 select pg_get_functiondef('public.fortius_inmuebles_evidence_expediente(jsonb)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 anchor:='elsif e->>''tipo''=''adjunto'' then';
 if (length(definition)-length(replace(definition,anchor,'')))/length(anchor)<>1 then raise exception 'Unexpected process function public.fortius_inmuebles_evidence_expediente';end if;
 definition:=replace(definition,anchor,'elsif e->>''tipo''=''cliente'' then select expediente_id into result from public.fortius_inmuebles_expediente_archivos where id=(e->>''referencia'')::uuid and deleted_at is null;
 '||anchor);
 execute definition;
end; $$;

-- El valor respaldado con el avalúo vale mientras el avalúo está vigente.
do $$ declare definition text; anchor text; begin
 select pg_get_functiondef('public.fortius_inmuebles_flow_review_ok(jsonb,text)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 anchor:='and (key not in (''factibilidad'',''revision_cierre'') or';
 if (length(definition)-length(replace(definition,anchor,'')))/length(anchor)<>1 then raise exception 'Unexpected process function public.fortius_inmuebles_flow_review_ok';end if;
 definition:=replace(definition,anchor,'and (key<>''valor'' or coalesce(flow->''requisitos''->key->''evidencia''->>''tipo'','''')<>''cliente''
   or (flow->''avaluo''->>''archivo''=flow->''requisitos''->key->''evidencia''->>''referencia''
    and (flow->''avaluo''->>''vigenteHasta'')::date >= (now() at time zone ''America/Tijuana'')::date))
 '||anchor);
 execute definition;
end; $$;

do $$ declare definition text; anchor text; begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_guided_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 anchor:='''contraparteLeadId'',''firmaContrato'')';
 if position(anchor in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,anchor,'''contraparteLeadId'',''firmaContrato'',''avaluo'')');
 anchor:='if exists(select 1 from jsonb_object_keys(new.flujo) key';
 if (length(definition)-length(replace(definition,anchor,'')))/length(anchor)<>1 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,anchor,'if new.flujo ? ''avaluo'' then
     new.flujo:=jsonb_set(new.flujo,''{avaluo}'',public.fortius_inmuebles_owner_appraisal(new.flujo->''avaluo'',case when tg_op=''UPDATE'' then old.flujo->''avaluo'' end,new.id,coalesce(context_changed,false)));
   end if;
   '||anchor);
 execute definition;
end; $$;

notify pgrst, 'reload schema';
commit;
