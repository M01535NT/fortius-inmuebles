-- Notas fijadas arriba en el costado de notas del asunto (decisión del titular, 17/11/2026; SPEC.md, «Las notas del asunto»).
-- El historial solo se agrega, así que lo fijado se guarda en el propio asunto: la lista de notas que van arriba.
-- Se fija y se suelta solo con la función de abajo, que revisa que quien está en sesión vea el asunto y que sea
-- una nota o una decisión de ese mismo asunto. Cada cambio queda en el Historial («Fijó una nota», «Soltó una nota»).
-- Hasta 10 por asunto: lo fijado es lo que hay que tener a la vista, no un archivo.

alter table public.fortius_inmuebles_asuntos
  add column notas_fijadas bigint[] not null default '{}'
  check (cardinality(notas_fijadas) <= 10);

-- Fijar o soltar una nota no es cambiar el asunto: no sube su versión ni su fecha de último cambio. Así quien
-- tiene el asunto abierto no recibe «alguien más cambió esto» y el asunto no sube en la lista por eso.
create function public.fortius_inmuebles_asunto_version() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.version is distinct from old.version then
    raise sqlstate 'PT409' using message = 'Alguien más cambió esto; vuelve a cargar';
  end if;
  if (to_jsonb(new) - 'notas_fijadas') = (to_jsonb(old) - 'notas_fijadas') then
    return new;
  end if;
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_asunto_version() from public, anon, authenticated, service_role;
drop trigger fortius_01_version on public.fortius_inmuebles_asuntos;
create trigger fortius_01_version before update on public.fortius_inmuebles_asuntos
  for each row execute function public.fortius_inmuebles_asunto_version();

-- El registro de cambios del asunto también anota qué notas se fijaron, para decir en el Historial si se fijó o se soltó.
drop trigger fortius_zz_historial on public.fortius_inmuebles_asuntos;
create trigger fortius_zz_historial after insert or update on public.fortius_inmuebles_asuntos
  for each row execute function public.fortius_inmuebles_registrar_cambio(
    'asunto', 'nombre,encargos,en_que_va,en_espera,espera_motivo,espera_hasta,resultado,motivo_cierre,responsable_id,capto_id,vendio_id,notas_fijadas');

create function public.fortius_inmuebles_fijar_nota(p_asunto uuid, p_nota bigint, p_fijar boolean)
returns bigint[] language plpgsql security definer set search_path = '' as $$
declare
  actuales bigint[];
  nuevas bigint[];
begin
  if not public.fortius_inmuebles_puede_ver_asunto(p_asunto) then
    raise sqlstate 'PT403' using message = 'Sin acceso a ese asunto';
  end if;
  select notas_fijadas into actuales from public.fortius_inmuebles_asuntos where id = p_asunto and deleted_at is null for update;
  if not found then
    raise sqlstate 'PT403' using message = 'Ese asunto está en Eliminados';
  end if;
  if p_fijar then
    if p_nota = any (actuales) then
      return actuales;
    end if;
    if not exists (select 1 from public.fortius_inmuebles_historial h
                    where h.id = p_nota and h.asunto_id = p_asunto and h.clase in ('nota', 'decision')) then
      raise sqlstate '22023' using message = 'Solo se fija una nota de este asunto';
    end if;
    if cardinality(actuales) >= 10 then
      raise sqlstate '22023' using message = 'Ya hay 10 notas fijadas: suelta una para fijar otra';
    end if;
    nuevas := array_prepend(p_nota, actuales);
  else
    if not (p_nota = any (actuales)) then
      return actuales;
    end if;
    nuevas := array_remove(actuales, p_nota);
  end if;
  update public.fortius_inmuebles_asuntos set notas_fijadas = nuevas where id = p_asunto;
  return nuevas;
end; $$;
revoke all on function public.fortius_inmuebles_fijar_nota(uuid, bigint, boolean) from public, anon;
grant execute on function public.fortius_inmuebles_fijar_nota(uuid, bigint, boolean) to authenticated, service_role;
