-- Reconstruye el inventario de enlaces entre registros a partir de los propios
-- registros. El 16/11 quedaron 8 enlaces sin escribir (clientes -> inmueble y
-- inmuebles -> asesor) y el ensayo de restauración del respaldo diario dejó de
-- pasar. La función solo borra y vuelve a escribir los enlaces de cada registro;
-- no toca los registros ni su historial. Es idempotente.
select public.fortius_inmuebles_sync_references(collection, id, data)
from public.fortius_inmuebles_records;
