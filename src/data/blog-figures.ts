interface FigureStep {
  label: string;
  detail: string;
}

interface MonthlyComparison {
  type: "monthly-comparison";
  rows: { label: string; parts: { label: string; amount: number }[] }[];
}

interface CurrencySensitivity {
  type: "currency-sensitivity";
  paymentMxn: number;
  exchangeRates: number[];
}

export interface BlogFigure {
  id: string;
  afterHeading: string;
  title: string;
  caption: string;
  source: string;
  data:
    | { type: "infographic"; layout: "grid" | "sequence"; items: FigureStep[] }
    | MonthlyComparison
    | CurrencySensitivity;
}

export function calculateFigureChart(data: MonthlyComparison | CurrencySensitivity): {
  rows: { label: string; value: number; detail: string }[];
  max: number;
} {
  const rows = data.type === "monthly-comparison"
    ? data.rows.map((row) => ({
        label: row.label,
        value: row.parts.reduce((total, part) => total + part.amount, 0),
        detail: row.parts.map((part) => `${formatFigureAmount(part.amount)} MXN ${part.label}`).join(" + "),
      }))
    : data.exchangeRates.map((rate) => ({
        label: `${rate} MXN por USD`,
        value: Math.round((data.paymentMxn / rate) * 100) / 100,
        detail: `${formatFigureAmount(data.paymentMxn)} MXN ÷ ${rate} MXN/USD`,
      }));
  return { rows, max: Math.max(...rows.map(({ value }) => value)) };
}

export function formatFigureAmount(value: number): string {
  return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(value);
}

const figures: Record<string, BlogFigure[]> = {
  "cuanto-vale-mi-casa-tijuana": [{
    id: "figura-cuatro-cifras",
    afterHeading: "Cuatro cifras que conviene distinguir",
    title: "Cuatro cifras, cuatro funciones",
    caption: "El propósito y la evidencia de cada cifra son distintos. Ninguna obliga a un comprador a pagar ese importe.",
    source: "Síntesis de esta guía",
    data: { type: "infographic", layout: "grid", items: [
      { label: "Precio de publicación", detail: "Cantidad con la que el inmueble se ofrece al público." },
      { label: "Precio de compraventa", detail: "Importe acordado por las partes, respaldado por evidencia de la operación." },
      { label: "Opinión de valor", detail: "Orientación comercial sustentada en características, referencias y supuestos." },
      { label: "Avalúo", detail: "Dictamen técnico con propósito y fecha de referencia; confirma su aceptación para el trámite." },
    ] },
  }],
  "documentos-vender-propiedad-baja-california": [{
    id: "figura-expediente-venta",
    afterHeading: "Ordena la entrega y protege la documentación",
    title: "Un expediente que responde preguntas",
    caption: "Registra emisor, fecha, ubicación del original y pendientes. La lista orienta la preparación; los requisitos finales dependen de la operación.",
    source: "Síntesis de esta guía",
    data: { type: "infographic", layout: "grid", items: [
      { label: "¿Quién puede vender?", detail: "Titulares, identidad, estado civil y facultades de representación." },
      { label: "¿Qué inmueble es?", detail: "Título, datos registrales, catastro, superficies y planos disponibles." },
      { label: "¿Qué debe revisarse?", detail: "Gravámenes, diferencias físicas, antecedentes fiscales y saldo de créditos." },
      { label: "¿Cómo se entregará?", detail: "Ocupación, equipo, servicios, condiciones y documentos con acceso controlado." },
    ] },
  }],
  "que-revisar-antes-apartar-propiedad": [{
    id: "figura-antes-del-apartado",
    afterHeading: "Decide con los pendientes a la vista",
    title: "Antes de transferir un apartado",
    caption: "Conserva los acuerdos y comprobantes. Esta ruta no determina la validez del apartado ni una devolución automática.",
    source: "Síntesis de esta guía",
    data: { type: "infographic", layout: "sequence", items: [
      { label: "Identifica a las personas", detail: "Contrasta propietario, facultades del representante y persona autorizada para cobrar." },
      { label: "Contrasta el inmueble", detail: "Relaciona documentos, situación registral, visita y condiciones de entrega." },
      { label: "Aclara el acuerdo", detail: "Importe, moneda, aplicación al precio, plazo, obligaciones y reglas de devolución." },
      { label: "Resuelve lo esencial", detail: "Distingue lo verificado de lo pendiente, incluido qué ocurre si no se concreta el crédito." },
    ] },
  }],
  "que-revisar-comprar-terreno": [{
    id: "figura-terreno-proyecto",
    afterHeading: "Convierte la revisión en una decisión",
    title: "Del terreno anunciado al proyecto posible",
    caption: "Superficie total y superficie aprovechable requieren revisión. La pendiente, las contenciones y el acceso necesitan evidencia y presupuesto propios.",
    source: "Síntesis de esta guía",
    data: { type: "infographic", layout: "grid", items: [
      { label: "Identidad y derechos", detail: "Titular, antecedentes, límites y naturaleza del derecho que se transmite." },
      { label: "Acceso y topografía", detail: "Situación del acceso, dimensiones, desniveles y área útil para tu objetivo." },
      { label: "Uso y riesgos", detail: "Compatibilidad del proyecto y revisiones específicas del sitio cuando correspondan." },
      { label: "Servicios y costo total", detail: "Factibilidades, conexiones, estudios, permisos y preparación del terreno." },
    ] },
  }],
  "como-elegir-local-comercial": [{
    id: "figura-local-operacion",
    afterHeading: "Usa una comparación que puedas explicar",
    title: "Compara el local con tu operación",
    caption: "Usa la misma ficha para cada candidato: observado, informado y confirmado. La visibilidad por sí sola no demuestra demanda ni garantiza ventas.",
    source: "Síntesis de esta guía",
    data: { type: "infographic", layout: "grid", items: [
      { label: "Cliente y acceso", detail: "Llegadas, horarios, estacionamiento, carga y descarga según tu actividad." },
      { label: "Giro compatible", detail: "Consulta la revisión de uso de suelo y autorizaciones aplicables al domicilio y actividad." },
      { label: "Espacio e instalaciones", detail: "Distribución, capacidad técnica, adecuaciones, responsables y plazos." },
      { label: "Costo y contrato", detail: "Renta, apertura, tiempo sin operar, entrega, obras y condiciones de salida." },
    ] },
  }],
  "que-debe-hacer-inmobiliaria-vender": [{
    id: "figura-servicio-inmobiliario",
    afterHeading: "Negociación y coordinación del cierre",
    title: "Cada etapa debe dejar un resultado",
    caption: "Define alcance, responsables, honorarios y exclusiones por escrito. La coordinación no sustituye a la notaría ni garantiza un precio o plazo de venta.",
    source: "Síntesis de esta guía",
    data: { type: "infographic", layout: "sequence", items: [
      { label: "Preparar", detail: "Encargo definido, precio sustentado y expediente con pendientes visibles." },
      { label: "Presentar", detail: "Fotografías e información fieles a las características confirmadas." },
      { label: "Dar seguimiento", detail: "Reporte de consultas, visitas, ofertas y decisiones por tomar." },
      { label: "Negociar y coordinar", detail: "Condiciones autorizadas y calendario de documentos, firmas, pagos y entrega." },
    ] },
  }],
  "comprar-o-rentar-tijuana": [{
    id: "figura-flujo-compra-renta",
    afterHeading: "Ejemplo ficticio: comparar flujo no equivale a comparar patrimonio",
    title: "La salida mensual de efectivo",
    caption: "Ejemplo ficticio de esta guía. La diferencia de flujo no mide patrimonio, ganancia ni pérdida. No representa precios de mercado ni una cotización hipotecaria.",
    source: "Cifras didácticas de esta guía",
    data: { type: "monthly-comparison", rows: [
      { label: "Compra", parts: [{ label: "de pago hipotecario", amount: 24000 }, { label: "de mantenimiento y reserva de otros gastos", amount: 4000 }] },
      { label: "Renta", parts: [{ label: "de renta", amount: 17000 }, { label: "de cargos acordados", amount: 1000 }] },
    ] },
  }],
  "comprar-casa-tijuana-ingresos-estados-unidos": [{
    id: "figura-sensibilidad-divisas",
    afterHeading: "Revisa la conversión de moneda",
    title: "El mismo pago en pesos, distintos dólares",
    caption: "Importe y tipos de cambio inventados para ilustrar la conversión: no son cotizaciones vigentes y no es una oferta bancaria. No incluye comisiones ni pronostica el mercado.",
    source: "Cálculo ilustrativo: obligación en MXN ÷ tipo de cambio en MXN/USD",
    data: { type: "currency-sensitivity", paymentMxn: 20000, exchangeRates: [20, 18, 16] },
  }],
};

export function getBlogFigures(slug: string): BlogFigure[] {
  return Object.hasOwn(figures, slug) ? figures[slug] : [];
}
