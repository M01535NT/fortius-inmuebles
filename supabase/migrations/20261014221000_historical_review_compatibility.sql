begin;
set local lock_timeout='2s';
set local statement_timeout='20s';
select pg_advisory_xact_lock(781023);
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_convert_lead(text,bigint)'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('when ''arrendar'' then ''arrendador'' else ''otro'' end' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_convert_lead';end if;
 definition:=replace(definition,'when ''arrendar'' then ''arrendador'' else ''otro'' end','when ''arrendar'' then ''arrendador'' when ''invertir'' then ''inversionista'' else ''otro'' end');
 execute definition;
end; $$;
do $$ declare definition text; begin
 select pg_get_functiondef('public.fortius_inmuebles_guard_guided_operation()'::regprocedure) into definition;
 definition:=replace(definition,chr(13),'');
 if position('if r->>''estado''=''revisado'' then
      if not public.fortius_inmuebles_evidence_ok' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,'if r->>''estado''=''revisado'' then
      if not public.fortius_inmuebles_evidence_ok','if r->>''estado''=''revisado'' and not context_changed and (tg_op=''INSERT'' or (r-''registradoPor''-''registradoEl'') is distinct from ((old.flujo->''requisitos''->k)-''registradoPor''-''registradoEl'')) then
      if not public.fortius_inmuebles_evidence_ok');
 if position('octet_length(new.flujo::text)>40000' in definition)=0 then raise exception 'Unexpected process function public.fortius_inmuebles_guard_guided_operation';end if;
 definition:=replace(definition,'octet_length(new.flujo::text)>40000','octet_length(new.flujo::text)>200000');
 execute definition;
end; $$;
notify pgrst,'reload schema';
commit;
