-- Apply after the Fortius production build has been verified.
begin;
select pg_advisory_xact_lock(781023);
do $$
declare bridge regprocedure;
begin
 if to_regprocedure('public.fortius_inmuebles_public_records(text)') is null then
   raise exception 'Fortius reader is required before retiring compatibility';
 end if;
 bridge:=to_regprocedure('public.mnt_public_records(text)');
 if bridge is not null then
   if exists(select 1 from pg_proc where oid=bridge and (prosecdef or prosrc not like '%public.fortius_inmuebles_public_records(p_collection)%')) then
     raise exception 'Unexpected legacy reader; refusing to drop it';
   end if;
   drop function public.mnt_public_records(text);
 end if;
end $$;
notify pgrst,'reload schema';
commit;
