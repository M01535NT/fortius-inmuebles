-- Quien busca comprar o rentar es interesado, no operación (COR-11, RP-93, 29/10/2026).
-- Fortius solo representa al propietario. «Quiere comprar» y «Quiere rentar» guardan un
-- interesado (lead) con su perfil y su próxima acción; ya no abren operación ni expediente.
-- 1. La entrevista operativa no empieza para «comprar» ni «rentar».
-- 2. No se crea una operación nueva con ruta «compra» o «arrendatario», ni se cambia a ellas.
--    Las que ya existen se conservan, se abren y se pueden seguir guardando (históricas).
-- 3. La guía acepta «contraparteLeadId»: el interesado que firma con el propietario queda como
--    contraparte de su operación, y cuenta como contraparte identificada para avanzar.
-- No cambia ni borra datos existentes.
begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);

do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_start_intake(uuid,text,jsonb,uuid)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('then raise sqlstate ''PT400'' using message=''Ingreso inválido''; end if;' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_start_intake';end if;
 definition:=replace(definition,'then raise sqlstate ''PT400'' using message=''Ingreso inválido''; end if;','then raise sqlstate ''PT400'' using message=''Ingreso inválido''; end if;
 if p_intent in (''comprar'',''rentar'') then raise sqlstate ''PT400'' using message=''Quien busca comprar o rentar se guarda como interesado; no se abre operación''; end if;');
 execute definition;
end; $$;

do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_guided_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('''requisitos'',''contraparteId'',''contraparteExterna'',''resolucion'',''entregasInforme'')' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,'''requisitos'',''contraparteId'',''contraparteExterna'',''resolucion'',''entregasInforme'')','''requisitos'',''contraparteId'',''contraparteExterna'',''resolucion'',''entregasInforme'',''contraparteLeadId'')');
 if position('if exists(select 1 from jsonb_object_keys(new.flujo) key' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,'if exists(select 1 from jsonb_object_keys(new.flujo) key','
   if new.flujo->>''ruta'' in (''compra'',''arrendatario'') and (tg_op=''INSERT'' or (old.flujo is not null and old.flujo->>''ruta'' is distinct from new.flujo->>''ruta'')) then
     raise sqlstate ''PT400'' using message=''Quien busca comprar o rentar se sigue como interesado; no se abre operación'';
   end if;
   if new.flujo ? ''contraparteLeadId'' and (jsonb_typeof(new.flujo->''contraparteLeadId'')<>''string'' or length(new.flujo->>''contraparteLeadId'') not between 1 and 200
     or new.flujo ? ''contraparteId'' or not exists(select 1 from public.fortius_inmuebles_records lead_record where lead_record.collection=''leads'' and lead_record.id=new.flujo->>''contraparteLeadId'')) then
     raise sqlstate ''PT400'' using message=''Interesado de la contraparte inválido'';
   end if;
   if exists(select 1 from jsonb_object_keys(new.flujo) key');
 if position('counterpart is null and length(btrim(coalesce(new.flujo->>''contraparteExterna'','''')))<3' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,'counterpart is null and length(btrim(coalesce(new.flujo->>''contraparteExterna'','''')))<3','counterpart is null and not (new.flujo ? ''contraparteLeadId'') and length(btrim(coalesce(new.flujo->>''contraparteExterna'','''')))<3');
 execute definition;
end; $$;

notify pgrst, 'reload schema';
commit;
