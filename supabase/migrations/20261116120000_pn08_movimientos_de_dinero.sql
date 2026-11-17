-- PN-08 · Movimientos de Dinero (DEC-53 y DEC-56, 16/11/2026). Hoy Dinero solo lee comisiones del cierre y recibos 18;
-- con esta tabla se anota lo demás que pide el boceto:
--   · comisión: una comisión suelta que te deben (además de la del cierre del asunto);
--   · gasto: un gasto que Fortius pagó y el propietario debe reembolsar;
--   · apartado: dinero ajeno que Fortius recibió y guarda hasta entregarlo al propietario («Por entregar», DEC-56).
-- Cada movimiento nombra su asunto, tiene responsable y quien lo creó (RP-101) y la visibilidad la hace cumplir RLS
-- igual que los pendientes: el director ve todo, el asesor lo suyo y lo de sus asuntos.
-- El comprobante del apartado se guarda en el bucket privado (fortius-inmuebles-private); aquí solo su ruta.
-- No se borra: «Quitar» marca eliminado_el y se puede restaurar. Control de versión con PT409 como las demás tablas.
-- Sin aplicar: se aplica al integrar en main, junto con PN-02 (usa fortius_inmuebles_mi_asesor_id y puede_ver_asunto).
begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
select pg_advisory_xact_lock(781023);

create table public.fortius_inmuebles_movimientos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('comision', 'gasto', 'apartado')),
  asunto_id uuid not null references public.fortius_inmuebles_expedientes (id) on delete restrict,
  monto numeric(14, 2) not null check (monto > 0 and monto <= 999999999999),
  moneda text not null default 'MXN' check (moneda in ('MXN', 'USD')),   -- pesos y dólares por separado, sin convertir (DEC-53)
  concepto text not null default '' check (length(concepto) <= 300),
  -- Vencimiento: sin fecha, en 7 o en 30 días. Los apartados no vencen: se entregan.
  vence_el date,
  check (tipo <> 'apartado' or vence_el is null),
  -- Lo cobrado de una comisión o un gasto (se permite cobro parcial; nunca más del monto).
  cobrado numeric(14, 2) not null default 0 check (cobrado >= 0),
  check (cobrado <= monto),
  check (tipo <> 'apartado' or cobrado = 0),
  forma_pago text check (forma_pago is null or forma_pago in ('transferencia', 'efectivo', 'cheque')),
  -- pendiente → entregado (apartado), reembolsado (gasto) o cobrado (comisión); la fecha la pone el servidor.
  estado text not null default 'pendiente' check (estado in ('pendiente', 'entregado', 'reembolsado', 'cobrado')),
  check (estado = 'pendiente'
         or (tipo = 'apartado' and estado = 'entregado')
         or (tipo = 'gasto' and estado = 'reembolsado')
         or (tipo = 'comision' and estado = 'cobrado')),
  liquidado_el timestamptz,
  liquidado_por uuid,
  -- Comprobante privado: ruta en el bucket privado; la sube quien la registra (empieza con su id, como toda carga).
  comprobante_path text unique check (comprobante_path is null or comprobante_path ~ '^[a-f0-9-]+/[a-f0-9-]+\.(jpg|png|webp|gif|pdf)$'),
  comprobante_nombre text check (comprobante_nombre is null or length(btrim(comprobante_nombre)) between 1 and 160),
  comprobante_tipo text check (comprobante_tipo is null or comprobante_tipo in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif')),
  check ((comprobante_path is null) = (comprobante_nombre is null) and (comprobante_path is null) = (comprobante_tipo is null)),
  responsable_id text not null default public.fortius_inmuebles_mi_asesor_id(),
  responsable_collection text not null default 'asesores' check (responsable_collection = 'asesores'),
  creado_por uuid not null default auth.uid() references auth.users (id),
  eliminado_el timestamptz,
  eliminado_por uuid,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (responsable_collection, responsable_id) references public.fortius_inmuebles_records (collection, id) on delete restrict
);
create index on public.fortius_inmuebles_movimientos (estado, tipo, vence_el) where eliminado_el is null;
create index on public.fortius_inmuebles_movimientos (asunto_id);
create index on public.fortius_inmuebles_movimientos (responsable_id, estado) where eliminado_el is null;

-- El pendiente de cobro o de entrega puede nombrar su movimiento (la columna nació en PN-02 sin llave).
alter table public.fortius_inmuebles_pendientes
  add constraint fortius_inmuebles_pendientes_movimiento_fk
  foreign key (movimiento_id) references public.fortius_inmuebles_movimientos (id) on delete restrict;
create index on public.fortius_inmuebles_pendientes (movimiento_id) where movimiento_id is not null;

alter table public.fortius_inmuebles_movimientos enable row level security;
revoke all on public.fortius_inmuebles_movimientos from anon, authenticated;
grant select, insert, update on public.fortius_inmuebles_movimientos to authenticated;   -- no se borra: se quita y se restaura
grant all on public.fortius_inmuebles_movimientos to service_role;
-- Mismas reglas que un pendiente: el director todo; el asesor lo suyo y lo de los asuntos que ve.
create policy movimientos_read on public.fortius_inmuebles_movimientos for select to authenticated
  using (public.fortius_inmuebles_puede_ver_pendiente(responsable_id, asunto_id));
create policy movimientos_insert on public.fortius_inmuebles_movimientos for insert to authenticated
  with check (creado_por = (select auth.uid()) and estado = 'pendiente' and eliminado_el is null
              and public.fortius_inmuebles_puede_guardar_pendiente(responsable_id, asunto_id, null)
              and (comprobante_path is null or split_part(comprobante_path, '/', 1) = (select auth.uid())::text));
create policy movimientos_update on public.fortius_inmuebles_movimientos for update to authenticated
  using (public.fortius_inmuebles_puede_ver_pendiente(responsable_id, asunto_id))
  with check (public.fortius_inmuebles_puede_guardar_pendiente(responsable_id, asunto_id, null));

-- Reglas que no dependen de quién mira: versión, datos que no cambian, fechas de entrega y de quitar, y reasignar.
create function public.fortius_inmuebles_guardar_movimiento() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.version := 1;
    new.created_at := now();
    new.updated_at := now();
    new.cobrado := 0; new.forma_pago := null;
    new.liquidado_el := null; new.liquidado_por := null;
    new.eliminado_el := null; new.eliminado_por := null;
    return new;
  end if;
  -- Versión optimista: quien guarda manda la versión que leyó; si alguien guardó antes, 409.
  if new.version is distinct from old.version then
    raise sqlstate 'PT409' using message = 'Alguien más cambió este movimiento. Vuelve a abrirlo.';
  end if;
  if new.tipo is distinct from old.tipo or new.creado_por is distinct from old.creado_por or new.created_at is distinct from old.created_at
     or (old.comprobante_path is not null and new.comprobante_path is distinct from old.comprobante_path) then
    raise sqlstate 'PT403' using message = 'Esos datos del movimiento no se cambian';
  end if;
  if new.responsable_id is distinct from old.responsable_id and auth.uid() is not null and not public.fortius_inmuebles_is_admin() then
    raise sqlstate 'PT403' using message = 'Solo dirección reasigna un movimiento';
  end if;
  if old.estado <> 'pendiente' and (new.monto is distinct from old.monto or new.moneda is distinct from old.moneda) then
    raise sqlstate 'PT409' using message = 'Este movimiento ya se cerró; su monto no cambia';
  end if;
  -- Un cobro completo cierra la comisión o el gasto; uno parcial lo deja pendiente.
  if new.tipo in ('comision', 'gasto') then
    if new.cobrado >= new.monto then new.estado := case new.tipo when 'gasto' then 'reembolsado' else 'cobrado' end;
    elsif new.estado <> 'pendiente' and new.cobrado < new.monto and new.cobrado is distinct from old.cobrado then new.estado := 'pendiente';
    end if;
  end if;
  if new.estado <> old.estado then
    if new.estado = 'pendiente' then new.liquidado_el := null; new.liquidado_por := null;
    else new.liquidado_el := now(); new.liquidado_por := auth.uid(); end if;
  else
    new.liquidado_el := old.liquidado_el; new.liquidado_por := old.liquidado_por;
  end if;
  if (new.eliminado_el is null) <> (old.eliminado_el is null) then
    if new.eliminado_el is null then new.eliminado_por := null; else new.eliminado_el := now(); new.eliminado_por := auth.uid(); end if;
  else
    new.eliminado_el := old.eliminado_el; new.eliminado_por := old.eliminado_por;
  end if;
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end; $$;
revoke all on function public.fortius_inmuebles_guardar_movimiento() from public, anon, authenticated, service_role;
create trigger fortius_00_guardar_movimiento before insert or update on public.fortius_inmuebles_movimientos
  for each row execute function public.fortius_inmuebles_guardar_movimiento();

notify pgrst, 'reload schema';
commit;
