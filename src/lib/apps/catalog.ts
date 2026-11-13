/*
  Catálogo de Herramientas (HER-01, confirmado por el titular el 18/10/2026): tres grupos
  (Documentos · Calcular · Presentar). Las herramientas retiradas («group: null») ya no se
  muestran en el catálogo, pero conservan su ruta y sus trabajos guardados: el `slug` no cambia
  para que ningún trabajo se pierda ni falle al abrirse.
*/
export const APP_GROUPS = ["Documentos", "Calcular", "Presentar"] as const;
export type AppGroup = typeof APP_GROUPS[number];

export const APPS = [
  { slug: "documentos", title: "Documentos sueltos", description: "Cualquier formato en blanco o lleno, sin abrir una operación.", group: "Documentos", icon: "FileText" },
  { slug: "pdf", title: "Unir y separar PDF", description: "Une escaneos, ordena, gira o quita páginas.", group: "Documentos", icon: "Files" },
  { slug: "neto-propietario", title: "ISR y neto del vendedor", description: "Cuánto le queda al propietario después de comisión, ISR y gastos.", group: "Calcular", icon: "Wallet" },
  { slug: "hipoteca", title: "Hipoteca", description: "Mensualidades, anticipos y tabla de amortización.", group: "Calcular", icon: "Landmark" },
  { slug: "gastos-compra", title: "Gastos de compra", description: "Lo que paga el comprador además del precio: impuesto, registro, notario y avalúo.", group: "Calcular", icon: "Calculator" },
  { slug: "ofertas", title: "Comparador de ofertas", description: "Compara precio, plazo y forma de pago de cada oferta.", group: "Calcular", icon: "GitCompareArrows" },
  { slug: "inversiones", title: "Inversiones", description: "ROI, VAN y TIR con flujos y escenarios; incluye el presupuesto de rehabilitación.", group: "Calcular", icon: "TrendingUp" },
  { slug: "conversor", title: "Unidades y monedas", description: "Superficies, longitudes y MXN / USD.", group: "Calcular", icon: "ArrowLeftRight" },
  { slug: "cotizador", title: "Cotizador de servicios", description: "Propuesta de honorarios antes de abrir una operación.", group: "Presentar", icon: "ReceiptText" },
  // Dentro de otra herramienta (revisión del catálogo, 12/11/2026): no tiene tarjeta, se abre desde Inversiones.
  { slug: "rehabilitacion", title: "Rehabilitación", description: "Partidas, contingencia y desembolsos del presupuesto de obra.", group: null, within: "inversiones", icon: "Hammer" },
  // Retiradas del catálogo (HER-01 y revisión del 12/11/2026). «home» dice dónde vive ahora su función.
  { slug: "comparables", title: "Comparables", description: "Comparables y ajustes de la opinión de valor, sin operación.", group: null, home: "Los comparables se capturan dentro de la opinión de valor: usa el acceso «Opinión de valor» de Herramientas.", icon: "Scale" },
  { slug: "comisiones", title: "Comisiones y reparto", description: "Honorarios y reparto con aliados o entre asesores.", group: null, home: "El reparto de cada venta se calcula en su cierre, con el aliado registrado en la operación; la comisión al propietario, en «ISR y neto del vendedor».", icon: "HandCoins" },
  { slug: "fotografias", title: "Fotografías", description: "Recorte, luz y copias listas para publicar.", group: null, home: "Las fotos se editan desde la galería de cada inmueble: botón «Editar» de cada foto.", icon: "Image" },
  { slug: "ficha-comercial", title: "Ficha comercial", description: "Presenta un inmueble con la identidad Fortius.", group: null, home: "Ahora se descarga desde el menú «⋯» de cada inmueble: «Descargar ficha técnica».", icon: "Building2" },
  { slug: "qr", title: "Enlaces y QR", description: "Comparte fichas y documentos seleccionados.", group: null, home: "Ahora está en el menú «⋯» de cada inmueble: «Compartir liga o QR».", icon: "QrCode" },
  { slug: "informe-propietario", title: "Informe al propietario", description: "Actividades, resultados y próximos pasos.", group: null, home: "Se prepara desde su operación, en Publicación y seguimiento.", icon: "ChartNoAxesCombined" },
  { slug: "revisor-expediente", title: "Pendientes documentales", description: "Requisitos, vencimientos y pendientes.", group: null, home: "Lo que falta o vence se ve en cada operación.", icon: "ClipboardCheck" },
  { slug: "versiones", title: "Comparador de versiones", description: "Encuentra cambios entre dos textos.", group: null, home: "Para comparar contratos usa «Comparar» de Word.", icon: "FileDiff" },
] as const;
export type AppDefinition = typeof APPS[number];
export function getApp(slug: string): AppDefinition | undefined { return APPS.find(app => app.slug === slug); }
/** Retirada: sin tarjeta ni lugar dentro de otra herramienta; solo se consultan sus trabajos guardados. */
export const isRetired = (app: AppDefinition) => app.group === null && !("within" in app);
/** Herramienta que vive dentro de otra (Rehabilitación dentro de Inversiones). */
export const parentOf = (app: AppDefinition) => "within" in app ? getApp(app.within) : undefined;
export const activeApps = (group: AppGroup) => APPS.filter(app => app.group === group);
export const RETIRED_APPS = APPS.filter(isRetired);
export const FINANCIAL_APPS = new Set(["hipoteca", "gastos-compra", "neto-propietario", "comisiones", "inversiones", "rehabilitacion", "conversor"]);
export const COMMERCIAL_APPS = new Set(["ficha-comercial", "comparables", "ofertas", "informe-propietario", "cotizador", "revisor-expediente"]);

/** Comparables es la opinión de valor (07) sin operación (HER-05): mismo cálculo, no un segundo motor. */
export const COMPARABLES_HREF = "/admin/apps/documentos?formato=07&seccion=comparables";
/** Destino de cada tarjeta del catálogo. */
export const appHref = (slug: string) => slug === "comparables" ? COMPARABLES_HREF : `/admin/apps/${slug}`;
