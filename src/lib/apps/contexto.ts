import type { AppContext, AppInput } from "./types";

/*
  Herramientas abiertas desde donde están los datos (HER-05): el inmueble, el prospecto o la
  operación pasan en la dirección lo que el sistema ya sabe, y la herramienta abre con eso puesto.
  Solo se aceptan datos simples y validados; lo que no se entiende se ignora y la herramienta abre
  vacía, como siempre.
*/

const amount = (value: string | null) => {
  if (!value || !/^\d{1,13}(\.\d{1,2})?$/.test(value)) return undefined;
  const number = Number(value);
  return number > 0 ? value : undefined;
};
const slugOf = (value: string | null) => value && /^[a-z0-9][a-z0-9-]{0,199}$/i.test(value) ? value : undefined;

/** Datos iniciales y vínculo de una herramienta según su dirección (`?precio=…&inmueble=…`). */
export function prefillFromUrl(slug: string, params: URLSearchParams): { input: AppInput; context: AppContext } {
  const inmuebleId = slugOf(params.get("inmueble"));
  const context: AppContext = inmuebleId ? { inmuebleId } : {};
  const precio = amount(params.get("precio"));
  if (slug === "hipoteca" && precio) return { input: { price: precio }, context };
  if (slug === "neto-propietario" && precio) return { input: { salePrice: precio }, context };
  if (slug === "gastos-compra" && precio) return { input: { price: precio }, context };
  return { input: {}, context };
}

type PriceLink = { precio?: number; moneda?: string; inmueble?: string };
function priceHref(slug: string, { precio, moneda, inmueble }: PriceLink) {
  const query = new URLSearchParams();
  // Hipoteca e ISR calculan en pesos: un precio en dólares no se pasa para no confundirlo.
  if (precio && precio > 0 && (!moneda || moneda === "MXN")) query.set("precio", String(Math.round(precio * 100) / 100));
  if (inmueble) query.set("inmueble", inmueble);
  const text = query.toString();
  return `/admin/apps/${slug}${text ? `?${text}` : ""}`;
}
/** Enlace a la hipoteca con el precio puesto (desde un inmueble o el presupuesto de un prospecto). */
export const hipotecaHref = (link: PriceLink) => priceHref("hipoteca", link);
/** Enlace a ISR y neto del vendedor con el precio de venta puesto (HER-03). */
export const netoHref = (link: PriceLink) => priceHref("neto-propietario", link);

type Propuesta = { id: string; formato_id: string; data: Record<string, unknown> };
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const money = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value > 0 ? String(value) : "";
const isoDay = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? Date.parse(`${value}T00:00:00Z`) : NaN;

/**
  Ofertas del Comparador leídas de las propuestas de compra (formato 14) de una operación, sin
  recapturar. El plazo va de la fecha de la propuesta a la fecha propuesta para formalizar. El
  anticipo, los gastos y el saldo de crédito no vienen en el 14: quedan vacíos para capturarlos.
*/
export function ofertasDesdePropuestas(documentos: Propuesta[]) {
  return documentos.filter(doc => doc.formato_id === "14" && money(doc.data.precioPropuesto)).map((doc, index) => {
    const d = doc.data;
    const desde = isoDay(d.fechaPropuesta), hasta = isoDay(d.fechaFormalizacion);
    const days = Number.isFinite(desde) && Number.isFinite(hasta) && hasta >= desde ? String(Math.round((hasta - desde) / 86_400_000)) : "";
    const credito = money(d.credito);
    const financing = [credito ? `Crédito ${Number(credito).toLocaleString("es-MX")}` : "", text(d.institucionCredito), text(d.estadoCredito)].filter(Boolean).join(" · ") || (money(d.recursosPropios) ? "Recursos propios" : "");
    return {
      name: text(d.comprador) || `Propuesta ${index + 1}`,
      currency: text(d.moneda) === "USD" ? "USD" : "MXN",
      price: money(d.precioPropuesto), deposit: "", expenses: "", creditBalance: "", days,
      financing, paymentSchedule: "", conditions: text(d.condiciones),
    };
  });
}
