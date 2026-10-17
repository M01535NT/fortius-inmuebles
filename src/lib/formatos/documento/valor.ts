import { calcularComparables, calcularConstruccion, calcularValor } from "../valor";
import { valorFields } from "../valor-fields";
import { a, dinero, fecha, filas, junta, type Block, type Documento, type DocumentoContexto } from "./modelo";

/*
  07 · Opinión de valor comercial, con el diseño de su libro de Excel
  (Metodología/07.Opinion_de_valor_comercial.xlsx): portada con fotografía y valor
  concluido, índice, resumen, antecedentes, zona, inmueble, enfoques de mercado,
  ingresos y físico, conciliación y reporte fotográfico. Las cifras salen del mismo
  cálculo del panel; los enfoques con peso 0 % se indican como no aplicados.
*/

type Data = Record<string, unknown>;
type SheetCell = { label?: string; value?: string; w: number; strong?: boolean; big?: boolean };
const f = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? fecha(value) : a(value);
const num = (value: unknown, digits = 2) => typeof value === "number" && Number.isFinite(value) ? new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value) : "";
const mxn = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? dinero(value) : "";
const label = (key: string) => valorFields.find(field => field.key === key)?.label ?? key;
const choice = (key: string, value: unknown) => valorFields.find(field => field.key === key)?.options?.find(o => o.value === value)?.label ?? a(value);
const sub = (text: string): SheetCell[] => [{ value: text.toUpperCase(), w: 12, strong: true }];
/** Renglones etiqueta/valor; si el campo tiene fuente («…Fuente»), va junto al valor. */
const pares = (d: Data, keys: string[], short: Record<string, string> = {}): SheetCell[][] => keys.map(key => [{ label: short[key] ?? label(key), w: 4 }, { value: junta(f(d[key]), d[`${key}Fuente`] ? `Fuente: ${a(d[`${key}Fuente`])}` : ""), w: 8 }]);
const seccion = (num: string, text: string): Block[] => [{ kind: "pagebreak" }, { kind: "bar", text: `${num}.   ${text}`, big: true }];

function comparables(d: Data, key: "comparablesTerreno" | "comparablesConstruccion" | "comparablesRenta", tipo: string): Block[] {
  const list = filas(d[key]);
  const calc = calcularComparables(list, d, d[tipo]);
  const rows = (list.length ? list : [{}, {}, {}]).map((row, i) => {
    const c = calc.rows.find(r => r.id === String(row.id ?? ""));
    return [String(i + 1), junta(row.ubicacion, row.seleccion === "excluir" ? "Excluido" : ""), num(row.superficie), row.precio !== undefined ? `${num(row.precio)} ${a(row.moneda)}` : "", c ? num(c.unitario) : "", num(row.fZona, 3), num(row.fUbicacion, 3), num(row.fSuperficie, 3), num(row.fNegociacion, 3), c ? num(c.factor, 3) : "", c ? num(c.homologado) : ""];
  });
  const fuentes = (list.length ? list : [{}, {}, {}]).map(row => [a(row.id), a(row.fuente), f(row.fechaPrecio), row.seleccion === "excluir" ? "Excluido" : row.seleccion === "incluir" ? "Incluido" : "Pendiente"]);
  return [
    { kind: "sheet", rows: [sub("Comparables de mercado (ofertas / operaciones recientes)")] },
    { kind: "table", small: true, widths: [0.5, 2.4, 0.9, 1.7, 1.2, 0.75, 0.75, 0.75, 0.75, 0.75, 1.2], header: ["No.", "Ubicación / referencia", "Base m²", key === "comparablesRenta" ? "Renta mensual" : "Precio", key === "comparablesRenta" ? "$/m²/mes" : "$/m²", "Fzona", "Fubic.", "Fsup.", "Fneg.", "F. res.", "$/m² hom."], rows },
    { kind: "sheet", rows: [[{ label: "Valor unitario homologado medio ($/m²)", w: 8 }, { value: calc.media === null ? "" : num(calc.media), w: 4, strong: true }]] },
    { kind: "sheet", rows: [sub("Fuentes utilizadas")] },
    { kind: "table", widths: [1, 5, 2, 2], header: ["ID", "Referencia / URL", "Fecha precio", "Estado"], rows: fuentes },
  ];
}

export function valorDocumento(d: Data, contexto: DocumentoContexto = {}): Documento {
  let valor: ReturnType<typeof calcularValor> | null = null;
  try { valor = calcularValor(d); } catch { /* opinión incompleta: se muestran los datos capturados */ }
  const concluido = valor?.concluido ?? null;
  const pesos = [["Comparativo de mercado", d.pesoMercado, valor?.mercado], ["Ingresos (capitalización)", d.pesoIngresos, valor?.ingresos?.valor], ["Físico (neto de reposición)", d.pesoFisico, valor?.fisico?.valor]] as const;
  const peso = (value: unknown) => typeof value === "number" ? `${num(value, 0)} %` : "";
  const aplica = (value: unknown) => typeof value === "number" && value > 0;
  const imagen = (key: string) => typeof d[key] === "string" ? contexto.imagenes?.[d[key] as string] : undefined;
  const fotos = filas(d.fotografias);
  const terrenoBase = d.baseMercado === "terreno";
  const blocks: Block[] = [
    // Portada
    { kind: "title", text: "Opinión de valor comercial", bold: true, size: 26 },
    { kind: "caption", text: junta(d.tipoInmueble, d.inmueble) || "Tipo de inmueble pendiente" },
    { kind: "image", label: "Fotografía principal del inmueble", image: imagen("fotoPrincipalId"), height: 210 },
    { kind: "sheet", rows: [
      [{ label: "FOLIO", w: 4 }, { value: a(d.folio), w: 8 }],
      [{ label: "FECHA DE VALUACIÓN", w: 4 }, { value: f(d.fechaValor), w: 8 }],
      [{ label: "SOLICITANTE", w: 4 }, { value: a(d.solicitante), w: 8 }],
      [{ label: "PROPIETARIO DEL INMUEBLE", w: 4 }, { value: a(d.propietario), w: 8 }],
      [{ label: "INMUEBLE QUE SE VALÚA", w: 4 }, { value: a(d.tipoInmueble), w: 8 }],
      [{ label: "UBICACIÓN DEL INMUEBLE", w: 4 }, { value: a(d.inmueble), w: 8 }],
      [{ label: "PROPÓSITO DE LA OPINIÓN DE VALOR", w: 4 }, { value: a(d.proposito), w: 8 }],
    ] },
    { kind: "bar", text: "Valor comercial concluido", right: concluido === null ? "Pendiente" : dinero(concluido, "MXN"), big: true },
    { kind: "note", text: "Opinión comercial orientativa. No es precio de venta garantizado ni sustituye un avalúo exigido por autoridad, institución de crédito o contrato." },

    // Índice
    { kind: "pagebreak" },
    { kind: "bar", text: "Índice · secciones del reporte", big: true },
    { kind: "table", widths: [1, 11], rows: [["1", "Resumen ejecutivo"], ["2", "Antecedentes"], ["3", "Características urbanas de la zona"], ["4", "Características del inmueble"], ["5", "Enfoque comparativo de mercado — Terrenos"], ["6", "Mercado — inmuebles construidos"], ["7", "Enfoque de ingresos (capitalización de rentas)"], ["8", "Enfoque físico (valor neto de reposición)"], ["9", "Conciliación de valor y justificación"], ["10", "Reporte fotográfico del inmueble"]] },
    { kind: "note", text: "Las secciones 5 a 8 se utilizan según el inmueble y la evidencia disponible. Un peso de 0 % indica que el enfoque no se aplicó." },

    // 1. Resumen
    ...seccion("1", "Resumen ejecutivo"),
    { kind: "sheet", rows: [
      sub("Datos generales"),
      [{ label: "Solicitante", w: 3 }, { value: a(d.solicitante), w: 9 }],
      [{ label: "Tipo de inmueble", w: 3 }, { value: a(d.tipoInmueble), w: 9 }],
      [{ label: "Ubicación", w: 3 }, { value: a(d.inmueble), w: 9 }],
      [{ label: "Régimen de propiedad", w: 3 }, { value: a(d.regimen), w: 9 }],
      [{ label: "Cuenta catastral", w: 3 }, { value: a(d.cuentaCatastral), w: 3 }, { label: "Folio", w: 3 }, { value: a(d.folio), w: 3 }],
      [{ label: "Superficie de terreno", w: 3 }, { value: d.terreno !== undefined ? `${num(d.terreno)} m²` : "", w: 3 }, { label: "Sup. construida", w: 3 }, { value: d.construccion !== undefined ? `${num(d.construccion)} m²` : "", w: 3 }],
      sub("Características principales"),
      [{ label: "Niveles", w: 3 }, { value: a(d.niveles), w: 3 }, { label: "Edad (años)", w: 3 }, { value: a(d.edad), w: 3 }],
      [{ label: "Recámaras", w: 3 }, { value: a(d.recamaras), w: 3 }, { label: "Baños", w: 3 }, { value: a(d.banos), w: 3 }],
      [{ label: "Estado de conservación", w: 3 }, { value: a(d.conservacion), w: 3 }, { label: "Estacionamientos", w: 3 }, { value: a(d.estacionamientos), w: 3 }],
      sub("Resultados por enfoque de valor"),
    ] },
    { kind: "table", widths: [6, 2, 4], header: ["Enfoque", "Peso", "Valor indicado"], rows: pesos.map(([name, w, v]) => [name, peso(w), aplica(w) ? mxn(v) : "No aplicado"]) },
    { kind: "bar", text: "Valor comercial concluido", right: concluido === null ? "Pendiente" : dinero(concluido, "MXN") },
    { kind: "sheet", rows: [sub("Observaciones y conclusión"), [{ value: a(d.justificacion), w: 12 }]] },

    // 2. Antecedentes
    ...seccion("2", "Antecedentes"),
    { kind: "sheet", rows: [
      sub("De la solicitud"),
      ...pares(d, ["solicitante", "relacionSolicitante", "propietario", "tipoInmueble", "usoActual", "regimen", "cuentaCatastral", "inmueble", "fechaSolicitud"], { relacionSolicitante: "Relación del solicitante con el inmueble", propietario: "Propietario del inmueble", tipoInmueble: "Inmueble objeto de la opinión", usoActual: "Uso o destino actual", cuentaCatastral: "Cuenta catastral", inmueble: "Ubicación del inmueble" }),
      sub("De la opinión de valor"),
      [{ label: "Objeto de la opinión de valor", w: 4 }, { value: a(d.objeto) || "Estimar el valor comercial del inmueble.", w: 8 }],
      [{ label: "Propósito / uso previsto", w: 4 }, { value: a(d.proposito), w: 8 }],
      [{ label: "Destinatario y derechos valorados", w: 4 }, { value: a(d.derechosDestinatario), w: 8 }],
      [{ label: "Enfoques aplicados", w: 4 }, { value: pesos.filter(([, w]) => aplica(w)).map(([name]) => name.split(" ")[0]).join("; "), w: 8 }],
      [{ label: d.inspeccionEstado === "realizada" ? "Fecha de inspección" : "Inspección", w: 4 }, { value: d.inspeccionEstado === "realizada" ? f(d.fechaInspeccion) : choice("inspeccionEstado", d.inspeccionEstado), w: 8 }],
      [{ label: "Fecha de valor", w: 4 }, { value: f(d.fechaValor), w: 8 }],
      [{ label: "Fecha de emisión", w: 4 }, { value: f(d.fechaEmision), w: 8 }],
      [{ label: "Revisar a más tardar", w: 4 }, { value: f(d.revisarAntes), w: 8 }],
      [{ label: "Tipo de valor", w: 4 }, { value: "Valor comercial / de mercado", w: 8 }],
      [{ label: "Moneda", w: 4 }, { value: "Pesos mexicanos (MXN)", w: 8 }],
      [{ label: "Alcance y condiciones limitantes", w: 4 }, { value: a(d.alcance), w: 8 }],
      [{ label: "Levantamiento 04 / revisión 05-06", w: 4 }, { value: junta(d.referencia04, d.referenciaJuridica), w: 8 }],
      [{ label: "Superficies y efecto jurídico", w: 4 }, { value: junta(choice("superficiesEstado", d.superficiesEstado), d.superficiesEfecto, choice("juridicaEstado", d.juridicaEstado), d.condicionesJuridicas), w: 8 }],
      sub("De la inmobiliaria (emisor)"),
      [{ label: "Empresa inmobiliaria", w: 4 }, { value: a(d.empresa) || "Fortius Inmuebles", w: 8 }],
      [{ label: "Asesor que emite la opinión", w: 4 }, { value: a(d.asesor), w: 8 }],
      [{ label: "Contacto (correo / teléfono)", w: 4 }, { value: a(d.contacto), w: 8 }],
      sub("Documentos que se tuvieron a la vista"),
    ] },
    { kind: "table", widths: [4, 2, 6], header: ["Documento", "Fecha", "Localizador y alcance examinado"], rows: d.documentosEstado === "sin_documentos" ? [["Sin documentos a la vista", "", "Ver alcance y límites"]] : (filas(d.documentos).length ? filas(d.documentos) : [{}, {}]).map(r => [a(r.documento), f(r.fecha), a(r.referencia)]) },
    { kind: "note", text: "Opinión comercial orientativa. No sustituye un avalúo requerido por una autoridad, institución de crédito o contrato." },

    // 3. Urbanas
    ...seccion("3", "Características urbanas de la zona"),
    { kind: "sheet", rows: [
      sub("Entorno"), ...pares(d, ["clasificacionZona", "habitantes", "construccionZona", "zonificacion", "saturacion", "dinamicaMercado", "usoPredominante"]),
      sub("Servicios y equipamiento urbano"), ...pares(d, ["servicios"]),
      sub("Infraestructura y equipamiento cercano"), ...pares(d, ["educacion", "comercios", "salud", "transporte"]),
      sub("Vías de acceso"), ...pares(d, ["vialidades"]),
      sub("Ubicación geográfica"),
      [{ label: "Latitud", w: 2 }, { value: a(d.latitud), w: 4 }, { label: "Longitud", w: 2 }, { value: a(d.longitud), w: 4 }],
      [{ label: "Altitud (msnm)", w: 2 }, { value: a(d.altitud), w: 4 }, { label: "Orientación", w: 2 }, { value: a(d.orientacion), w: 4 }],
      [{ label: "Fuente", w: 2 }, { value: a(d.geolocalizacionFuente), w: 10 }],
    ] },
    { kind: "image", label: "Croquis de localización / mapa", image: imagen("croquisId"), height: 180 },

    // 4. Inmueble
    ...seccion("4", "Características del inmueble"),
    { kind: "sheet", rows: [
      sub("Terreno"),
      [{ label: "Superficie del terreno", w: 3 }, { value: d.terreno !== undefined ? junta(`${num(d.terreno)} m²`, choice("origenTerreno", d.origenTerreno), d.fuenteTerreno) : "", w: 9 }],
      ...pares(d, ["frente", "indiviso", "loteTipo", "forma", "topografia", "linderos", "restricciones"]),
      sub("Construcción"),
      [{ label: "Superficie construida", w: 3 }, { value: d.construccion !== undefined ? junta(`${num(d.construccion)} m²`, choice("origenConstruccion", d.origenConstruccion), d.fuenteConstruccion) : "", w: 9 }],
      ...(d.privativa !== undefined ? [[{ label: "Área privativa", w: 3 }, { value: junta(`${num(d.privativa)} m²`, choice("origenPrivativa", d.origenPrivativa), d.fuentePrivativa), w: 9 }]] : []),
      ...pares(d, ["niveles", "recamaras", "banos", "estacionamientos", "edad", "conservacion", "calidadProyecto", "descripcion", "areasInaccesibles"]),
      sub("Tipos de construcción"),
    ] },
    { kind: "table", widths: [1, 2, 2, 1.2, 1, 1, 1.2], header: ["Clave", "Tipo", "Uso", "Estado 1–6", "Edad", "V. útil", "Sup. m²"], rows: (filas(d.construcciones).length ? filas(d.construcciones) : [{}, {}]).map(r => [a(r.id), a(r.tipo), a(r.uso), a(r.estado), a(r.edad), a(r.vidaUtil), num(r.superficie)]) },
    { kind: "sheet", rows: [sub("Elementos de la construcción (acabados e instalaciones)"), ...pares(d, ["cimentacion", "estructura", "muros", "entrepisos", "azoteas", "acabados", "pisos", "carpinteria", "hidrosanitaria", "electrica", "especiales"])] },

    // 5. Comparables de terreno
    ...seccion("5", "Enfoque comparativo de mercado — Terrenos"),
    ...(aplica(d.pesoFisico) || aplica(d.pesoMercado) && terrenoBase ? [
      { kind: "note", text: `Comparables de lotes y terrenos en la zona, homologados a valor unitario por metro cuadrado. Tipo de precio: ${choice("tipoPrecioTerreno", d.tipoPrecioTerreno) || "pendiente"}.` } as Block,
      ...comparables(d, "comparablesTerreno", "tipoPrecioTerreno"),
      { kind: "sheet", rows: [sub("Criterios de selección y ajuste de comparables"), [{ value: a(d.criterioTerreno), w: 12 }]] } as Block,
      ...(terrenoBase && aplica(d.pesoMercado) ? [{ kind: "bar", text: "Valor de mercado del terreno ($)", right: mxn(valor?.mercado) } as Block] : []),
    ] : [{ kind: "note", text: "Enfoque no aplicado en esta opinión (sin peso asignado ni uso en el enfoque físico)." } as Block]),

    // 6. Comparables construidos
    ...seccion("6", "Enfoque comparativo — Inmuebles construidos"),
    ...(aplica(d.pesoMercado) && !terrenoBase ? [
      { kind: "note", text: `Precio total del inmueble por m² de construcción o área privativa; el resultado ya incluye los derechos sobre el terreno. Tipo de precio: ${choice("tipoPrecioConstruccion", d.tipoPrecioConstruccion) || "pendiente"}.` } as Block,
      ...comparables(d, "comparablesConstruccion", "tipoPrecioConstruccion"),
      { kind: "sheet", rows: [[{ label: "Factor adicional", w: 3 }, { value: num(d.factorMercado, 3), w: 2 }, { label: "Motivo del factor", w: 2 }, { value: a(d.razonFactorMercado), w: 5 }], sub("Criterios de selección y ajuste de comparables"), [{ value: a(d.criterioMercado), w: 12 }]] } as Block,
      { kind: "bar", text: "Valor por enfoque comparativo de mercado ($)", right: mxn(valor?.mercado) } as Block,
    ] : [{ kind: "note", text: aplica(d.pesoMercado) ? "El mercado se calculó con comparables de terreno (sección 5)." : "Enfoque no aplicado en esta opinión (peso 0 %)." } as Block]),

    // 7. Ingresos
    ...seccion("7", "Enfoque de ingresos (capitalización de rentas)"),
    ...(aplica(d.pesoIngresos) ? [
      ...comparables(d, "comparablesRenta", "tipoPrecioRenta"),
      { kind: "sheet", rows: [
        sub("Ingreso bruto"),
        [{ label: "Renta mensual de mercado", w: 8 }, { value: mxn(valor?.ingresos?.mensual), w: 4 }],
        [{ label: "Renta bruta anual (× 12)", w: 8 }, { value: mxn(valor?.ingresos?.bruto), w: 4 }],
        sub("Deducciones"),
        [{ label: "Vacancia y cobranza (%)", w: 8 }, { value: peso(d.vacanciaPct), w: 4 }],
        [{ label: "Pérdida por vacancia", w: 8 }, { value: mxn(valor?.ingresos?.perdida), w: 4 }],
        [{ label: "Renta bruta efectiva", w: 8 }, { value: mxn(valor?.ingresos?.efectivo), w: 4 }],
        [{ label: "Gastos de operación (%)", w: 8 }, { value: peso(d.gastosPct), w: 4 }],
        [{ label: "Gastos de operación ($)", w: 8 }, { value: mxn(valor?.ingresos?.gastos), w: 4 }],
        sub("Capitalización"),
        [{ label: "Ingreso neto operativo (NOI)", w: 8 }, { value: mxn(valor?.ingresos?.noi), w: 4 }],
        [{ label: "Tasa de capitalización (%)", w: 8 }, { value: peso(d.tasaCapPct), w: 4 }],
      ] } as Block,
      { kind: "bar", text: "Valor por enfoque de ingresos ($)", right: mxn(valor?.ingresos?.valor) } as Block,
      { kind: "sheet", rows: [sub("Sustento de vacancia, gastos y tasa neta"), [{ value: junta(d.criterioRenta, d.sustentoIngresos), w: 12 }]] } as Block,
    ] : [{ kind: "note", text: "Enfoque no aplicado en esta opinión (peso 0 %)." } as Block]),

    // 8. Físico
    ...seccion("8", "Enfoque físico (valor neto de reposición)"),
    ...(aplica(d.pesoFisico) ? [
      { kind: "sheet", rows: [
        sub("A)  Valor del terreno"),
        [{ label: "Superficie (m²)", w: 3 }, { value: num(d.terreno), w: 3 }, { label: "Factor de eficiencia", w: 3 }, { value: num(d.factorTerreno, 3), w: 3 }],
        [{ label: "Justificación del factor", w: 3 }, { value: a(d.razonFactorTerreno), w: 9 }],
        [{ label: "SUBTOTAL (A)", w: 8 }, { value: mxn(valor?.fisico?.terreno), w: 4, strong: true }],
        sub("B)  Construcciones — valor neto de reposición"),
      ] } as Block,
      { kind: "table", small: true, widths: [2, 1, 1.2, 0.8, 0.9, 0.8, 0.9, 0.9, 0.9, 1.2, 1.4], header: ["Tipo", "Sup. m²", "VRN $/m²", "Edad", "Vida útil", "Estado", "C. Ross", "C. Heid.", "F. neto", "VNR neto", "Valor parcial"], rows: (filas(d.construcciones).length ? filas(d.construcciones) : [{}, {}]).map(r => { const c = calcularConstruccion(r); return [junta(r.id, r.tipo), num(r.superficie), num(r.costoNuevo), a(r.edad), a(r.vidaUtil), a(r.estado), num(c.ross, 4), num(c.heidecke, 4), num(c.neto, 4), num(c.unitarioNeto), mxn(c.parcial)]; }) } as Block,
      { kind: "sheet", rows: [[{ label: "SUBTOTAL (B)", w: 8 }, { value: mxn(valor?.fisico?.construccion), w: 4, strong: true }], sub("C)  Instalaciones especiales, elementos accesorios y obras complementarias")] } as Block,
      { kind: "table", widths: [4, 1.5, 1, 2, 1.5, 2], header: ["Concepto", "Unidad", "Cant.", "VRN $", "F. cons.", "Valor parcial $"], rows: d.obrasEstado === "incluidas" && filas(d.obras).length ? filas(d.obras).map(r => [a(r.concepto), a(r.unidad), num(r.cantidad), num(r.costoNuevo), num(r.factorConservacion, 2), typeof r.cantidad === "number" && typeof r.costoNuevo === "number" && typeof r.factorConservacion === "number" ? mxn(r.cantidad * r.costoNuevo * r.factorConservacion) : ""]) : [["No aplican o no se incluyeron", "", "", "", "", ""]] } as Block,
      { kind: "sheet", rows: [[{ label: "SUBTOTAL (C)", w: 8 }, { value: mxn(valor?.fisico?.obras), w: 4, strong: true }]] } as Block,
      { kind: "bar", text: "Valor físico  =  A + B + C  ($)", right: mxn(valor?.fisico?.valor) } as Block,
      { kind: "note", text: "Coef. Ross (edad) = ½ × [(Edad ÷ Vida útil) + (Edad ÷ Vida útil)²] · Factor neto = (1 − Coef. Ross) × (1 − Coef. Heidecke) · VNR neto = VRN × Factor neto · Valor parcial = Superficie × VNR neto." } as Block,
      { kind: "sheet", rows: [sub("Fuentes y supuestos adoptados"), [{ value: junta(d.metodoFisico, d.supuestosDepreciacion, d.obrasFuente), w: 12 }]] } as Block,
    ] : [{ kind: "note", text: "Enfoque no aplicado en esta opinión (peso 0 %)." } as Block]),

    // 9. Conciliación
    ...seccion("9", "Conciliación de valor y justificación"),
    { kind: "sheet", rows: [sub("Ponderación de enfoques")] },
    { kind: "table", widths: [5, 1.5, 2.5, 3], header: ["Enfoque de valor", "Peso", "Valor indicado", "Valor ponderado"], rows: [...pesos.map(([name, w, v]) => [name, peso(w), aplica(w) ? mxn(v) : "No aplicado", aplica(w) && typeof v === "number" && typeof w === "number" ? mxn(v * w / 100) : ""]), ["Suma", peso([d.pesoMercado, d.pesoIngresos, d.pesoFisico].reduce<number>((s, w) => s + (typeof w === "number" ? w : 0), 0)), "", mxn(valor?.indicador)]] },
    { kind: "bar", text: "Valor comercial concluido · MXN", right: concluido === null ? "Pendiente" : dinero(concluido), big: true },
    { kind: "sheet", rows: [
      sub("Justificación de la opinión de valor"), [{ value: junta(d.justificacion, d.razonMercado, d.razonIngresos, d.razonFisico), w: 12 }],
      sub("Supuestos, condiciones limitantes y vigencia"), [{ value: a(d.limites), w: 12 }],
      sub("Validación"),
      [{ label: "Asesor que emite la opinión", w: 3 }, { value: a(d.asesor), w: 3 }, { label: "Empresa inmobiliaria", w: 3 }, { value: a(d.empresa) || "Fortius Inmuebles", w: 3 }],
      [{ label: "Fecha de emisión", w: 3 }, { value: f(d.fechaEmision), w: 3 }, { label: "Revisar a más tardar", w: 3 }, { value: f(d.revisarAntes), w: 3 }],
      [{ label: "Revisó", w: 3 }, { value: junta(d.revisor, f(d.fechaRevision), choice("revisionEstado", d.revisionEstado)), w: 9 }],
    ] },
    { kind: "note", text: "1. La opinión distingue datos documentados, observados y declarados. 2. Los precios corresponden a sus fechas registradas; oferta y cierre no son equivalentes. 3. No se certifica cumplimiento normativo ni condición de sistemas ocultos. 4. Las condiciones jurídicas y su efecto se describen en antecedentes. 5. Cambios del inmueble, operación o mercado requieren actualizar la opinión. 6. Es una referencia comercial, no garantía de venta ni sustituto de un avalúo exigido por autoridad, banco o contrato." },
    { kind: "signatures", parties: [{ role: "Nombre y firma del asesor que emite la opinión", name: a(d.asesor) || "____________________" }] },

    // 10. Fotografías
    ...seccion("10", "Reporte fotográfico del inmueble"),
    ...(fotos.length ? fotos : [{}, {}]).flatMap((foto, i): Block[] => [
      { kind: "image", label: `Fotografía ${i + 1}`, image: typeof foto.assetId === "string" ? contexto.imagenes?.[foto.assetId] : undefined, height: 200 },
      { kind: "sheet", rows: [[{ label: "Pie", w: 2 }, { value: a(foto.pie), w: 10 }]] },
    ]),
  ];
  return { title: "Opinión de valor comercial", subject: `Formato 07 · ${a(d.folio)}`, blocks };
}
