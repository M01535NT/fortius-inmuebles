import { TIPO_LABELS, type TipoPropiedad } from "@/data/propiedades";
import type { AdminProperty } from "@/lib/domain/records";
import { matchReasons, zoneKey, zoneParts, type Seeker } from "@/lib/admin/buyer-matches";

/*
  «Buscan y no tenemos» (COR-19). Interesados activos que compran, rentan o invierten y que no
  tienen ningún inmueble publicado y disponible que les sirva, agrupados por operación, tipo y
  zona. Cada grupo dice cuántos son y su presupuesto (por moneda: no se convierte). Desde un grupo
  o desde la ficha del interesado se capta un inmueble para ese perfil. La zona se compara por
  texto sin acentos ni «de», «del», «la»…: «Lomas Virreyes» es «Lomas de Virreyes».
*/

export type DemandIntent = "comprar" | "rentar";
export type DemandGroup = {
  key: string; intent: DemandIntent; tipo?: TipoPropiedad; zona?: string;
  seekers: Seeker[];
  /** Presupuesto máximo declarado: el menor y el mayor del grupo, por moneda. */
  budgets: Array<{ moneda: "MXN" | "USD"; min: number; max: number }>;
};

const intentOf = (seeker: Seeker): DemandIntent | undefined => seeker.perfil?.operacion === "rentar" ? "rentar" : seeker.perfil?.operacion === "comprar" || seeker.perfil?.operacion === "invertir" ? "comprar" : undefined;
const tipoOf = (seeker: Seeker) => seeker.tipoPropiedad && seeker.tipoPropiedad in TIPO_LABELS ? seeker.tipoPropiedad as TipoPropiedad : undefined;

/** Interesados sin ningún inmueble publicado y disponible que les sirva. */
export function unmetSeekers(seekers: Seeker[], properties: AdminProperty[]) {
  return seekers.filter(seeker => !!intentOf(seeker) && !properties.some(property => matchReasons(property, seeker)));
}

/** Agrupa la demanda sin cubrir por operación, tipo y zona; los grupos más grandes primero. */
export function demandGroups(seekers: Seeker[], properties: AdminProperty[]): DemandGroup[] {
  const groups = new Map<string, DemandGroup>();
  for (const seeker of unmetSeekers(seekers, properties)) {
    const intent = intentOf(seeker)!, tipo = tipoOf(seeker);
    const zones = zoneParts(seeker.zona);
    for (const zona of zones.length ? zones : [undefined]) {
      const key = [intent, tipo ?? "", zona ? zoneKey(zona) : ""].join("|");
      const group = groups.get(key) ?? { key, intent, tipo, zona, seekers: [], budgets: [] };
      if (!group.seekers.some(s => s.kind === seeker.kind && s.id === seeker.id)) group.seekers.push(seeker);
      groups.set(key, group);
    }
  }
  for (const group of groups.values()) {
    const byCurrency = new Map<"MXN" | "USD", number[]>();
    for (const s of group.seekers) {
      const max = s.perfil?.presupuestoMax, moneda = s.perfil?.moneda;
      if (max !== undefined && moneda) byCurrency.set(moneda, [...(byCurrency.get(moneda) ?? []), max]);
    }
    group.budgets = [...byCurrency].map(([moneda, values]) => ({ moneda, min: Math.min(...values), max: Math.max(...values) }));
  }
  return [...groups.values()].sort((a, b) => b.seekers.length - a.seekers.length || (a.zona ?? "~").localeCompare(b.zona ?? "~", "es"));
}

/** Liga para captar un inmueble con ese perfil: Nueva operación del propietario con zona y tipo puestos. */
export function captureHref(group: { intent: DemandIntent; tipo?: string; zona?: string }) {
  const params = new URLSearchParams({ intencion: group.intent === "rentar" ? "arrendar" : "vender" });
  if (group.zona) params.set("zona", group.zona);
  if (group.tipo) params.set("tipo", group.tipo);
  return `/admin/operaciones/nueva?${params}`;
}

/**
  Interesados que esperan un inmueble como el que se está captando: misma operación, el tipo si
  lo dijeron y alguna de sus zonas. Se calcula al momento; no se guarda (COR-19).
*/
export function waitingFor(target: { intent: DemandIntent; tipo?: string; zona?: string }, seekers: Seeker[]) {
  const place = zoneKey(target.zona ?? "");
  if (!place) return [];
  return seekers.filter(seeker => {
    if (intentOf(seeker) !== target.intent) return false;
    if (seeker.tipoPropiedad && target.tipo && seeker.tipoPropiedad !== target.tipo) return false;
    const zones = zoneParts(seeker.zona).map(zoneKey);
    return zones.some(zone => place.includes(zone) || zone.includes(place));
  });
}
