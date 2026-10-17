import { calcularComparables, calcularConstruccion, calcularValor } from "../valor";
import { importeEnLetra } from "../letras";
import { VALOR_DEFAULTS } from "../valor-fields";
import { a, dinero, fecha, filas, type Block, type Documento, type DocumentoContexto } from "./modelo";

/*
  07 · Opinión de valor comercial con las hojas que imprime su plantilla
  (07_OpinionValor.xlsx, versión del 17/10/2026): portada, índice, resumen, antecedentes,
  zona, inmueble, enfoques de mercado, ingresos y físico, conciliación y fotografías.
  Mismos rótulos y textos fijos; las cifras salen de las fórmulas de la plantilla
  (src/lib/formatos/valor.ts). Lo que no se capturó queda en blanco o «Pendiente».
*/

type Data = Record<string, unknown>;
type SheetCell = { label?: string; value?: string; w: number; strong?: boolean; big?: boolean };
const f = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? fecha(value) : a(value);
const num = (value: unknown, digits = 2) => typeof value === "number" && Number.isFinite(value) ? new Intl.NumberFormat("es-MX", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value) : "";
const mxn = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? dinero(value) : "";
const pct = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? `${num(value, 2)} %` : "";
const sub = (text: string): SheetCell[] => [{ value: text.toUpperCase(), w: 12, strong: true }];
const fila = (label: string, value: string, lw = 4): SheetCell[] => [{ label, w: lw }, { value, w: 12 - lw }];
const doble = (l1: string, v1: string, l2: string, v2: string): SheetCell[] => [{ label: l1, w: 3 }, { value: v1, w: 3 }, { label: l2, w: 3 }, { value: v2, w: 3 }];
const seccion = (n: string, text: string): Block[] => [{ kind: "pagebreak", force: true }, { kind: "bar", text: `${n}.   ${text}`, big: true }];
const NOTA_FACTOR = "Un factor igual a 1 indica que no se aplicó ajuste. Todo factor distinto de 1 se justifica en la ficha del comparable y no debe duplicar el efecto de otro factor.";

function comparables(d: Data, key: "comparablesTerreno" | "comparablesConstruccion" | "comparablesRenta", prefijo: string): { tabla: Block[]; fuentes: Block[]; media: number | null } {
  const list = filas(d[key]);
  const calc = calcularComparables(list, d);
  const renta = key === "comparablesRenta";
  const rows = Array.from({ length: Math.max(5, list.length) }, (_, i) => {
    const row = list[i] ?? {}, c = calc.rows.find(r => r.index === i);
    return [String(i + 1), a(row.ubicacion), num(row.superficie), c ? mxn(c.precioMxn) : "", c ? num(c.unitario) : "", num(row.fZona, 3), num(row.fUbicacion, 3), num(row.fSuperficie, 3), num(row.fNegociacion, 3), c ? num(c.factor, 3) : "", c ? num(c.homologado) : ""];
  });
  return {
    media: calc.media,
    tabla: [
      { kind: "sheet", rows: [sub(renta ? "Comparables de renta ($/m² por mes)" : "Comparables de mercado (ofertas / operaciones recientes)")] },
      { kind: "table", small: true, widths: [0.5, 2.4, 0.9, 1.6, 1.2, 0.75, 0.75, 0.75, 0.75, 0.75, 1.2], header: ["No.", "Ubicación / referencia", "Base m²", renta ? "Renta MXN/mes" : "Precio MXN", renta ? "$/m²/mes" : "$/m²", "Fzona", key === "comparablesTerreno" ? "Fubic." : "Fconserv.", "Fsup.", "Fneg.", "F. res.", "$/m² hom."], rows },
      { kind: "sheet", rows: [
        [{ label: renta ? "Renta unitaria homologada media ($/m²/mes)" : "Valor unitario homologado medio ($/m²)", w: 8 }, { value: calc.media === null ? "" : num(calc.media), w: 4, strong: true }],
        [{ label: "Dispersión de la muestra homologada: desviación estándar ($/m²) y coeficiente de variación", w: 8 }, { value: calc.desviacion === null ? "" : `${num(calc.desviacion)} · ${num((calc.variacion ?? 0) * 100, 1)} %`, w: 4 }],
      ] },
    ],
    fuentes: [
      { kind: "sheet", rows: [sub("Fuentes de los comparables")] },
      { kind: "table", widths: [1, 7, 2], header: ["ID", "Referencia / URL", "Fecha precio"], rows: Array.from({ length: Math.max(5, list.length) }, (_, i) => [`${prefijo}${i + 1}`, a(list[i]?.fuente), f(list[i]?.fechaPrecio)]) },
    ],
  };
}

export function valorDocumento(d: Data, contexto: DocumentoContexto = {}): Documento {
  const valor = calcularValor(d);
  const concluido = valor.concluido;
  const letra = concluido === null ? "" : `(${importeEnLetra(concluido)})`;
  const enfoques = [["Comparativo de mercado", d.pesoMercado, valor.mercado], ["Ingresos (capitalización)", d.pesoIngresos, valor.ingresos?.valor ?? null], ["Físico (neto de reposición)", d.pesoFisico, valor.fisico?.valor ?? null]] as const;
  const aplicados = [d.pesoMercado, d.pesoIngresos, d.pesoFisico].map((w, i) => typeof w === "number" && w > 0 ? ["Mercado", "Ingresos", "Físico"][i] : "").filter(Boolean).join("; ");
  const imagen = (key: string) => typeof d[key] === "string" ? contexto.imagenes?.[d[key] as string] : undefined;
  const fotos = filas(d.fotografias);
  const texto = (key: string) => a(d[key]) || String(VALOR_DEFAULTS[key] ?? "");
  const vigencia = typeof d.revisarAntes === "string" && d.revisarAntes ? `Esta opinión es válida hasta el ${f(d.revisarAntes)}, salvo cambios en el inmueble, la operación o las condiciones de mercado.` : "";
  const valorBar = (text: string): Block => ({ kind: "bar", text, right: concluido === null ? "Pendiente" : dinero(concluido, "MXN"), big: true });
  const terreno = comparables(d, "comparablesTerreno", "T"), construido = comparables(d, "comparablesConstruccion", "C"), renta = comparables(d, "comparablesRenta", "R");
  const construcciones = filas(d.construcciones), obras = filas(d.obras);
  const blocks: Block[] = [
    // Portada
    { kind: "title", text: "Opinión de valor comercial", bold: true, size: 26 },
    { kind: "caption", text: a(d.tipoInmueble) ? `${a(d.tipoInmueble)}${a(d.operacion) ? ` en ${a(d.operacion).toLowerCase()}` : ""}` : "" },
    { kind: "image", label: "Fotografía principal del inmueble", image: imagen("fotoPrincipalId"), height: 210 },
    { kind: "sheet", rows: [
      fila("FOLIO", a(d.folio)), fila("FECHA DE VALUACIÓN", f(d.fechaValor)), fila("SOLICITANTE", a(d.solicitante)), fila("PROPIETARIO DEL INMUEBLE", a(d.propietario)),
      fila("INMUEBLE QUE SE VALÚA", a(d.tipoInmueble)), fila("UBICACIÓN DEL INMUEBLE", a(d.inmueble)), fila("PROPÓSITO DE LA OPINIÓN DE VALOR", a(d.proposito)),
    ] },
    valorBar("Valor comercial / concluido"),
    ...(letra ? [{ kind: "center", text: letra } as Block] : []),
    { kind: "note", text: "Opinión comercial orientativa. No es precio de venta garantizado. Todos los resultados se expresan en MXN." },

    // Índice
    { kind: "pagebreak", force: true },
    { kind: "bar", text: "Índice", big: true },
    { kind: "table", widths: [1, 11], rows: [["1", "Resumen ejecutivo"], ["2", "Antecedentes"], ["3", "Características urbanas de la zona"], ["4", "Características del inmueble"], ["5", "Enfoque comparativo de mercado: terrenos"], ["6", "Enfoque comparativo de mercado: inmuebles construidos"], ["7", "Enfoque de ingresos (capitalización de rentas)"], ["8", "Enfoque físico (valor neto de reposición)"], ["9", "Conciliación de valor y justificación"], ["10", "Reporte fotográfico del inmueble"]] },
    { kind: "note", text: "Las secciones 5 a 8 se aplican según el tipo de inmueble y la evidencia disponible. Un enfoque con peso de 0 % no participa en la conciliación y su exclusión se justifica en la sección 9." },

    // 1. Resumen
    ...seccion("1", "Resumen ejecutivo"),
    { kind: "sheet", rows: [
      sub("Datos generales"),
      fila("Solicitante", a(d.solicitante), 3), fila("Tipo de inmueble", a(d.tipoInmueble), 3), fila("Ubicación", a(d.inmueble), 3), fila("Régimen de propiedad", a(d.regimen), 3),
      doble("Cuenta catastral", a(d.cuentaCatastral), "Folio", a(d.folio)),
      doble("Superficie de terreno", num(d.terreno), "Sup. construida", num(d.construccion)),
      sub("Características principales"),
      doble("Niveles", a(d.niveles), "Edad (años)", a(d.edad)), doble("Recámaras", a(d.recamaras), "Baños", a(d.banos)), doble("Estado de conservación", a(d.conservacion), "Estacionamientos", a(d.estacionamientos)),
      sub("Resultados por enfoque de valor"),
    ] },
    { kind: "table", widths: [7, 2, 3], header: ["Enfoque", "Peso", "Valor indicado"], rows: enfoques.map(([name, w, v]) => [name, pct(w), mxn(v)]) },
    valorBar("Valor comercial concluido"),
    ...(letra ? [{ kind: "center", text: letra } as Block] : []),
    { kind: "sheet", rows: [sub("Observaciones y conclusión"), [{ value: a(d.justificacion), w: 12 }], sub("Vigencia de la opinión"), [{ value: vigencia, w: 12 }]] },

    // 2. Antecedentes
    ...seccion("2", "Antecedentes"),
    { kind: "sheet", rows: [
      sub("De la solicitud"),
      fila("Solicitante", a(d.solicitante)), fila("Relación del solicitante con el inmueble", a(d.relacionSolicitante)), fila("Propietario del inmueble", a(d.propietario)),
      fila("Inmueble objeto de la opinión", a(d.tipoInmueble)), fila("Uso o destino actual", a(d.usoActual)), fila("Régimen de propiedad", a(d.regimen)),
      fila("Cuenta catastral", a(d.cuentaCatastral)), fila("Ubicación del inmueble", a(d.inmueble)), fila("Fecha de solicitud", f(d.fechaSolicitud)),
      sub("De la opinión de valor"),
      fila("Objeto de la opinión de valor", texto("objeto")), fila("Propósito / uso previsto", a(d.proposito)), fila("Enfoques aplicados", aplicados),
      fila(d.inspeccionEstado === "No realizada" ? "Inspección no realizada" : "Fecha de inspección", d.inspeccionEstado === "No realizada" ? "" : f(d.fechaInspeccion)),
      fila("Fecha de emisión", f(d.fechaEmision)), fila("Vigencia (válida hasta)", f(d.revisarAntes)),
      fila("Tipo de valor", "Valor comercial / de mercado"), fila("Moneda", "Pesos mexicanos (MXN)"), fila("Alcance y condiciones limitantes", a(d.alcance)),
      sub("De la inmobiliaria (emisor)"),
      fila("Empresa inmobiliaria", texto("empresa")), fila("Asesor que emite la opinión", a(d.asesor)), fila("Contacto (correo / teléfono)", texto("contacto")),
      sub("Documentos que se tuvieron a la vista"),
      ...Array.from({ length: Math.max(5, filas(d.documentos).length) }, (_, i): SheetCell[] => [{ value: a(filas(d.documentos)[i]?.documento), w: 12 }]),
      sub("Nota / alcance de la opinión"),
    ] },
    { kind: "note", text: "Opinión comercial orientativa. No sustituye un avalúo requerido por una autoridad, institución financiera o contrato. La revisión de campos no certifica la veracidad de las fuentes." },

    // 3. Características urbanas
    ...seccion("3", "Características urbanas de la zona"),
    { kind: "sheet", rows: [
      sub("Entorno"), fila("Clasificación de la zona", a(d.clasificacionZona)), fila("Uso del suelo (zonificación)", a(d.zonificacion)), fila("Índice de saturación de la zona", a(d.saturacion)),
      fila("Dinámica de oferta y demanda", a(d.dinamicaMercado)), fila("Uso predominante (vivienda, mixto, etc.)", a(d.usoPredominante)),
      sub("Servicios y equipamiento urbano"), fila("Servicios públicos disponibles", a(d.servicios)),
      sub("Infraestructura y equipamiento cercano"), fila("Escuelas / centros educativos", a(d.educacion)), fila("Comercios y abasto", a(d.comercios)), fila("Salud / hospitales", a(d.salud)), fila("Transporte público", a(d.transporte)),
      sub("Vías de acceso"), fila("Vías primarias y secundarias", a(d.vialidades)),
      sub("Ubicación geográfica"), doble("Latitud", a(d.latitud), "Longitud", a(d.longitud)), doble("Altitud (msnm)", a(d.altitud), "Orientación", a(d.orientacion)),
    ] },
    { kind: "image", label: "Croquis de localización / mapa", image: imagen("croquisId"), height: 200 },

    // 4. Características del inmueble
    ...seccion("4", "Características del inmueble"),
    { kind: "sheet", rows: [
      sub("Terreno"),
      doble("Superficie del terreno", num(d.terreno), "Frente (m)", a(d.frente)), doble("Indiviso (%)", a(d.indiviso), "Sup. lote tipo (m²)", a(d.loteTipo)), doble("Forma / configuración", a(d.forma), "Topografía", a(d.topografia)),
      fila("Medidas y colindancias", a(d.linderos), 3), fila("Servidumbres y restricciones", a(d.restricciones), 3),
      sub("Construcción"),
      doble("Superficie construida", num(d.construccion), "Niveles", a(d.niveles)), doble("Recámaras", a(d.recamaras), "Baños", a(d.banos)), doble("Estacionamientos", a(d.estacionamientos), "Edad (años)", a(d.edad)),
      doble("Estado de conservación", a(d.conservacion), "Calidad del proyecto", a(d.calidadProyecto)), fila("Descripción de la propiedad", a(d.descripcion), 3),
      sub("Tipos de construcción"),
    ] },
    { kind: "table", widths: [1.2, 2, 2.4, 1, 0.9, 0.9, 0.9, 1.3], header: ["Clave", "Tipo", "Uso", "Estado 1–6", "Edad", "V. útil", "V. rest.", "Sup. m²"], rows: Array.from({ length: Math.max(4, construcciones.length) }, (_, i) => { const r = construcciones[i] ?? {}; return [a(r.id), a(r.tipo), a(r.uso), a(r.estado), a(r.edad), a(r.vidaUtil), typeof r.edad === "number" && typeof r.vidaUtil === "number" ? num(r.vidaUtil - r.edad, 0) : "", num(r.superficie)]; }) },
    { kind: "sheet", rows: [sub("Elementos de la construcción (acabados e instalaciones)"),
      ...([["cimentacion", "Cimentación"], ["estructura", "Estructura"], ["muros", "Muros"], ["entrepisos", "Entrepisos y losas"], ["azoteas", "Azoteas"], ["acabados", "Aplanados y acabados"], ["pisos", "Pisos"], ["carpinteria", "Carpintería / herrería"], ["hidrosanitaria", "Instalación hidrosanitaria"], ["electrica", "Instalación eléctrica"], ["especiales", "Instalaciones especiales"]] as const).map(([key, label]) => fila(label, a(d[key]), 3))] },

    // 5. Terrenos
    ...seccion("5", "Enfoque comparativo de mercado: terrenos"),
    { kind: "note", text: "Comparables de lotes/terrenos en la zona, homologados a valor unitario por metro cuadrado." },
    ...terreno.tabla,
    { kind: "sheet", rows: [sub("Resultado del enfoque"), doble("Sup. m²", num(d.terreno), "Valor unitario terreno ($/m²)", num(terreno.media)), doble("Factor adicional", num(d.factorTerreno ?? 1, 3), "Motivo del factor (si es distinto de 1)", a(d.razonFactorTerreno))] },
    { kind: "bar", text: "Valor de mercado del terreno ($)", right: mxn(valor.valorTerreno) },
    { kind: "sheet", rows: [sub("Criterios de selección y ajuste de comparables"), [{ value: a(d.criterioTerreno), w: 12 }]] },
    { kind: "note", text: NOTA_FACTOR },
    ...terreno.fuentes,

    // 6. Construidos
    ...seccion("6", "Enfoque comparativo de mercado: inmuebles construidos"),
    { kind: "note", text: "Precio total del inmueble por m² de construcción o área privativa. El resultado ya incluye los derechos sobre el terreno." },
    ...construido.tabla,
    { kind: "sheet", rows: [sub("Resultado del enfoque"), doble("Base del sujeto m²", num(valor.base), "Valor unitario MXN/m²", num(construido.media)), doble("Factor adicional", num(d.factorMercado ?? 1, 3), "Motivo del factor (si es distinto de 1)", a(d.razonFactorMercado))] },
    { kind: "bar", text: "Valor por enfoque comparativo de mercado ($)", right: mxn(valor.valorConstruido) },
    { kind: "sheet", rows: [sub("Criterios de selección y ajuste de comparables"), [{ value: a(d.criterioMercado), w: 12 }]] },
    { kind: "note", text: NOTA_FACTOR },
    ...construido.fuentes,

    // 7. Ingresos
    ...seccion("7", "Enfoque de ingresos (capitalización de rentas)"),
    { kind: "note", text: "Estima el valor a partir de la renta de mercado del inmueble, sus deducciones y la tasa de capitalización." },
    ...renta.tabla,
    { kind: "sheet", rows: [
      [{ label: "Renta mensual: superficie base del sujeto × renta unitaria media", w: 8 }, { value: mxn(valor.ingresos?.mensual), w: 4 }],
      sub("Ingreso bruto"), fila("Renta mensual de mercado", mxn(valor.ingresos?.mensual), 8), fila("Renta bruta anual (× 12)", mxn(valor.ingresos?.bruto), 8),
      sub("Deducciones"), fila("Vacancia y cobranza (%)", pct(d.vacanciaPct), 8), fila("Pérdida por vacancia", mxn(valor.ingresos?.perdida), 8), fila("Renta bruta efectiva", mxn(valor.ingresos?.efectivo), 8),
      fila("Gastos de operación (%)", pct(d.gastosPct), 8), fila("Gastos de operación ($)", mxn(valor.ingresos?.gastos), 8),
      sub("Capitalización"), fila("Ingreso neto operativo (NOI)", mxn(valor.ingresos?.noi), 8), fila("Tasa de capitalización (%)", pct(d.tasaCapPct), 8),
    ] },
    { kind: "bar", text: "Valor por enfoque de ingresos ($)", right: mxn(valor.ingresos?.valor) },
    { kind: "sheet", rows: [sub("Sustento de vacancia, gastos y tasa neta"), [{ value: a(d.sustentoIngresos), w: 12 }]] },
    ...renta.fuentes,

    // 8. Físico
    ...seccion("8", "Enfoque físico (valor neto de reposición)"),
    { kind: "sheet", rows: [sub("A)  Valor del terreno"), doble("Superficie (m²)", num(d.terreno), "Valor unitario ($/m²)", num(terreno.media)), doble("Factor aplicado (sección 5)", num(d.factorTerreno ?? 1, 3), "SUBTOTAL (A)", mxn(valor.valorTerreno)), sub("B)  Construcciones: valor neto de reposición")] },
    { kind: "table", small: true, widths: [2, 1, 1.2, 0.8, 0.9, 0.8, 0.9, 0.9, 0.9, 1.2, 1.4], header: ["Tipo de construcción", "Sup. m²", "VRN $/m²", "Edad (años)", "Vida útil (años)", "Estado 1–6", "Coef. Ross", "Coef. Heidecke", "Factor neto", "VNR neto $/m²", "Valor parcial $"], rows: Array.from({ length: Math.max(4, construcciones.length) }, (_, i) => { const r = construcciones[i] ?? {}; const c = calcularConstruccion(r); return [a(r.id), num(r.superficie), num(r.costoNuevo), a(r.edad), a(r.vidaUtil), a(r.estado), num(c.ross, 4), num(c.heidecke, 4), num(c.neto, 4), num(c.unitarioNeto), mxn(c.parcial)]; }) },
    { kind: "sheet", rows: [fila("SUBTOTAL (B)", mxn(valor.fisico?.construccion ?? null), 8), sub("C)  Instalaciones especiales, elementos accesorios y obras complementarias")] },
    { kind: "table", widths: [4, 1.5, 1, 2, 1.5, 2], header: ["Concepto", "Unidad", "Cant.", "VRN $", "F. cons.", "Valor parcial $"], rows: Array.from({ length: Math.max(3, obras.length) }, (_, i) => { const r = obras[i] ?? {}; return [a(r.concepto), a(r.unidad), num(r.cantidad), num(r.costoNuevo), num(r.factorConservacion, 2), typeof r.cantidad === "number" && typeof r.costoNuevo === "number" && typeof r.factorConservacion === "number" ? mxn(r.cantidad * r.costoNuevo * r.factorConservacion) : ""]; }) },
    { kind: "sheet", rows: [fila("SUBTOTAL (C)", mxn(valor.fisico?.obras ?? null), 8)] },
    { kind: "bar", text: "Valor físico  =  A + B + C  ($)", right: mxn(valor.fisico?.valor ?? null) },
    { kind: "sheet", rows: [sub("Depreciación Ross-Heidecke: parámetros"), [{ value: "Coef. Ross (edad) = ½ × [ (Edad ÷ Vida útil) + (Edad ÷ Vida útil)² ]\nFactor neto de depreciación = (1 − Coef. Ross) × (1 − Coef. Heidecke)\nVNR neto ($/m²) = VRN × Factor neto;  Valor parcial = Superficie × VNR neto", w: 12 }]] },
    { kind: "note", text: "El costo nuevo, la edad, la vida útil y el estado de conservación se documentan por componente con su fuente. Esta variante no considera valor de rescate ni indirectos; los accesorios ya incluidos en el costo nuevo no se vuelven a contar." },
    { kind: "sheet", rows: [sub("Fuentes y supuestos adoptados"), [{ value: a(d.fuenteCosto) ? `Costo: ${a(d.fuenteCosto)}\nEdad y vida útil: ${a(d.fuenteEdadVida)}\nMétodo y supuestos: ${a(d.supuestosDepreciacion)}` : "Por documentar: costo nuevo, edad, vida útil y método de depreciación.", w: 12 }]] },

    // 9. Conciliación
    ...seccion("9", "Conciliación de valor y justificación"),
    { kind: "sheet", rows: [sub("Ponderación de enfoques")] },
    { kind: "table", widths: [5, 1.5, 2.5, 3], header: ["Enfoque de valor", "Peso", "Valor indicado", "Valor ponderado"], rows: [...enfoques.map(([name, w, v]) => [name, pct(w), mxn(v), typeof w === "number" && typeof v === "number" ? mxn(v * w / 100) : typeof w === "number" && w === 0 ? mxn(0) : ""]), ["Suma", pct([d.pesoMercado, d.pesoIngresos, d.pesoFisico].every(w => typeof w === "number") ? (d.pesoMercado as number) + (d.pesoIngresos as number) + (d.pesoFisico as number) : undefined), "", mxn(valor.indicador)]] },
    valorBar("Valor comercial concluido (MXN)"),
    ...(letra ? [{ kind: "center", text: letra } as Block] : []),
    { kind: "sheet", rows: [
      sub("Justificación de la opinión de valor"), [{ value: a(d.justificacion), w: 12 }],
      sub("Supuestos, condiciones limitantes y vigencia"), [{ value: texto("limites"), w: 12 }],
      sub("Validación"),
      doble("Asesor que emite la opinión", a(d.asesor), "Empresa inmobiliaria", texto("empresa")),
      doble("Fecha de emisión", f(d.fechaEmision), "Vigente hasta", f(d.revisarAntes)),
    ] },
    { kind: "signatures", line: true, parties: [{ role: "Asesor que emite la opinión", name: junta2(a(d.asesor), texto("empresa")) }] },
    { kind: "sheet", rows: [sub("Vigencia de la opinión"), [{ value: vigencia, w: 12 }]] },

    // 10. Fotografías
    ...seccion("10", "Reporte fotográfico del inmueble"),
    { kind: "note", text: "Fotografías del inmueble y su entorno, con pie que identifica la vista y la fecha de la visita." },
    ...Array.from({ length: Math.max(fotos.length, 2) }, (_, i) => fotos[i] ?? {}).flatMap((foto, i): Block[] => [
      { kind: "image", label: `Fotografía ${i + 1}`, image: typeof foto.assetId === "string" ? contexto.imagenes?.[foto.assetId] : undefined, height: 200 },
      { kind: "sheet", rows: [[{ label: "Pie", w: 2 }, { value: a(foto.pie), w: 10 }]] },
    ]),
  ];
  return { title: "Opinión de valor comercial", subject: `Formato 07 · ${a(d.folio)}`, blocks };
}

/** Nombre del asesor y, abajo, la empresa (bloque de firma de la plantilla). */
function junta2(nombre: string, empresa: string) { return nombre ? `${nombre}\n${empresa}` : empresa; }
