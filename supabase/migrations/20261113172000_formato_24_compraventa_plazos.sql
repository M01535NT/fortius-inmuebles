-- 13/11/2026: la compraventa a plazos con reserva de dominio es el formato 24.
-- Solo amplía la lista de formatos permitidos en los borradores; no toca datos existentes.
do $$
declare restriccion text;
begin
  for restriccion in
    select conname from pg_constraint
    where conrelid = 'public.fortius_inmuebles_formato_drafts'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%formato_id%'
  loop
    execute format('alter table public.fortius_inmuebles_formato_drafts drop constraint %I', restriccion);
  end loop;
end $$;

alter table public.fortius_inmuebles_formato_drafts
  add constraint fortius_inmuebles_formato_drafts_formato_id_check
  check (formato_id in ('01','02','03','04A','04B','04C','04D','04E','04F','04G','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24'));
