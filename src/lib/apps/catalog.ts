export const APPS = [
  { slug: "ficha-comercial", title: "Ficha comercial", description: "Presenta un inmueble con la identidad Fortius.", category: "Comercial", icon: "Building2" },
  { slug: "hipoteca", title: "Hipoteca", description: "Mensualidades, anticipos y tabla de amortización.", category: "Finanzas", icon: "Landmark" },
  { slug: "comparables", title: "Comparables", description: "Sustenta precios con fuentes y ajustes visibles.", category: "Comercial", icon: "Scale" },
  { slug: "ofertas", title: "Comparador de ofertas", description: "Compara condiciones y formas de pago.", category: "Comercial", icon: "GitCompareArrows" },
  { slug: "neto-propietario", title: "Neto del propietario", description: "Desglosa lo que recibirá el propietario.", category: "Finanzas", icon: "Wallet" },
  { slug: "comisiones", title: "Comisiones y reparto", description: "Honorarios, participantes y distribución.", category: "Finanzas", icon: "HandCoins" },
  { slug: "informe-propietario", title: "Informe al propietario", description: "Actividades, resultados y próximos pasos.", category: "Comercial", icon: "ChartNoAxesCombined" },
  { slug: "pdf", title: "Plantillas y PDF", description: "Prepara formatos y organiza páginas.", category: "Documentos", icon: "Files" },
  { slug: "revisor-expediente", title: "Pendientes documentales", description: "Requisitos, vencimientos y pendientes.", category: "Documentos", icon: "ClipboardCheck" },
  { slug: "fotografias", title: "Fotografías", description: "Recorte, luz y copias listas para publicar.", category: "Productividad", icon: "Image" },
  { slug: "qr", title: "Enlaces y QR", description: "Comparte fichas y documentos seleccionados.", category: "Productividad", icon: "QrCode" },
  { slug: "conversor", title: "Unidades y monedas", description: "Superficies, longitudes y MXN / USD.", category: "Finanzas", icon: "ArrowLeftRight" },
  { slug: "inversiones", title: "Inversiones", description: "ROI, VAN y TIR con flujos y escenarios.", category: "Finanzas", icon: "TrendingUp" },
  { slug: "rehabilitacion", title: "Rehabilitación", description: "Partidas, contingencia y desembolsos.", category: "Finanzas", icon: "Hammer" },
  { slug: "versiones", title: "Comparador de versiones", description: "Encuentra cambios entre dos textos.", category: "Documentos", icon: "FileDiff" },
  { slug: "cotizador", title: "Cotizador de servicios", description: "Prepara una propuesta con conceptos y vigencia.", category: "Comercial", icon: "ReceiptText" },
] as const;
export function getApp(slug: string) { return APPS.find(app => app.slug === slug); }
export const FINANCIAL_APPS = new Set(["hipoteca", "neto-propietario", "comisiones", "inversiones", "rehabilitacion", "conversor"]);
export const COMMERCIAL_APPS = new Set(["ficha-comercial", "comparables", "ofertas", "informe-propietario", "cotizador", "revisor-expediente"]);
