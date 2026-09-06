-- Apply after the MNT public deployment is verified. Never removes a write API.
begin;
drop function public.cota_public_records(text);
notify pgrst,'reload schema';
commit;
