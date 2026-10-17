/*
  Ayuda en pantalla para capturar formatos (pedido del titular, 17/10/2026): quienes capturan
  son asesores inmobiliarios, no peritos. Cada sección lleva una nota de qué se hace ahí, cada
  campo una explicación corta y, donde el texto es repetitivo, plantillas de un clic que el
  asesor ajusta. Las plantillas aceptan {clave} para insertar lo ya capturado (p. ej. {inmueble}).
  Las opciones salen de la plantilla del formato o de la norma que se cita; no se inventan.
*/

export type Plantilla = { label: string; text: string };
type Ayuda = { secciones?: Record<string, string>; campos?: Record<string, string>; plantillas?: Record<string, Plantilla[]> };

const VALOR: Ayuda = {
  secciones: {
    "02 / Antecedentes": "Quién pide la opinión, de qué inmueble, para qué sirve y con qué límites. Aparece en la portada, el resumen y la hoja de antecedentes. Lo que no captures queda en blanco en el PDF y en el Excel.",
    "03 / Características urbanas de la zona": "Describe el entorno del inmueble: qué hay alrededor, servicios, equipamiento y vías de acceso. El croquis de localización se sube en «Fotografías y croquis».",
    "04 / Características del inmueble": "Superficies y características del terreno y de la construcción. Si ya hiciste el levantamiento 04, copia los datos de ahí. La tabla de tipos de construcción alimenta el enfoque físico.",
    "05 / Comparables de terreno": "Terrenos en venta o vendidos parecidos al tuyo. Cada factor multiplica el precio por m² del comparable: 1 significa sin ajuste. El valor unitario se calcula con al menos tres comparables completos.",
    "06 / Comparables de inmuebles construidos": "Inmuebles en venta o vendidos parecidos al tuyo: mismo tipo, zona y tamaño similar. Cada factor multiplica el precio por m² del comparable: 1 significa sin ajuste. El valor unitario se calcula con al menos tres comparables completos.",
    "07 / Ingresos": "Valor a partir de la renta que podría generar el inmueble: rentas de inmuebles parecidos, vacancia, gastos y tasa de capitalización. Si no aplica, deja su peso en 0 en la conciliación.",
    "08 / Enfoque físico": "Terreno (sección 5), más construcciones depreciadas por edad y conservación (Ross-Heidecke), más obras complementarias. Las construcciones se capturan en la sección 4. Si no aplica, deja su peso en 0.",
    "09 / Conciliación": "Decide cuánto pesa cada enfoque en el valor final; los tres pesos deben sumar 100. El valor concluido se redondea a múltiplos de la cantidad que indiques.",
    "10 / Reporte fotográfico": "Elige las fotografías del reporte y escribe su pie. Primero súbelas en «Fotografías y croquis», donde también eliges la fotografía de la portada.",
  },
  campos: {
    folio: "Se llena solo con el folio de la operación.",
    fechaValor: "Día al que se refiere el valor, normalmente el de la visita. Aparece en la portada como fecha de valuación.",
    solicitante: "Quién te pide la opinión de valor. Nombre completo, como en su identificación.",
    relacionSolicitante: "Qué es el solicitante respecto del inmueble.",
    propietario: "Quien aparece como dueño en la escritura o en el documento que acredite la propiedad.",
    tipoInmueble: "Tipo de inmueble, con las opciones de la plantilla. Aparece en la portada.",
    usoActual: "Uso de suelo del predio. Tómalo de la constancia o dictamen de uso de suelo, o del programa de desarrollo urbano. Las opciones son las zonas del Reglamento de Zonificación y Usos del Suelo del Centro de Población de Tijuana (arts. 43 y 49, reforma del 14/08/2020). En otro municipio, elige «Otro» y escribe lo que diga su programa.",
    regimen: "Cómo está registrada la propiedad. Lo dice la escritura.",
    cuentaCatastral: "Viene en el recibo del predial o en la escritura.",
    inmueble: "Domicilio completo: calle, número, interior, colonia, municipio y código postal.",
    fechaSolicitud: "Día en que te pidieron la opinión.",
    operacion: "Para qué operación se hace la opinión. Aparece en la portada, por ejemplo «Casa en venta».",
    baseMercado: "Qué superficie se usa para comparar precios por m²: terreno para lotes, construcción para casas y área privativa para departamentos en condominio.",
    tipoCambio: "Solo si algún comparable está en dólares: cuántos pesos vale 1 dólar en la fecha de valor.",
    objeto: "Qué se estima. La plantilla ya trae un texto; cámbialo si hace falta.",
    proposito: "Para qué se usará el valor. Aparece en la portada.",
    inspeccionEstado: "«Realizada» si visitaste el inmueble por dentro; si no, el documento dice «Inspección no realizada».",
    fechaInspeccion: "Día de la visita al inmueble.",
    fechaEmision: "Día en que entregas el documento.",
    revisarAntes: "Hasta cuándo es válida la opinión; el documento lo dice en su vigencia.",
    alcance: "Qué hiciste y qué no hiciste para llegar al valor.",
    empresa: "Empresa que emite la opinión. La plantilla trae «Fortius Real Estate & Investments».",
    asesor: "Tu nombre completo. Aparece también en la firma.",
    contacto: "Teléfono, correo o sitio web de contacto.",
    documentos: "Hasta cinco documentos que tuviste a la vista, uno por renglón; por ejemplo, «Escritura 1234 del 10/05/2015».",
    privativa: "Solo para departamentos y locales en condominio: superficie privativa de la escritura.",
    construcciones: "Una fila por tipo de construcción. El estado de conservación va de 1 (óptimo) a 6 (ruinoso).",
    redondeo: "Por ejemplo, 10000 redondea a decenas de miles. Si lo dejas vacío, se redondea al peso.",
    limites: "La plantilla trae sus supuestos y condiciones; ajústalos al caso.",
  },
  plantillas: {
    relacionSolicitante: [
      { label: "Propietario", text: "Propietario" }, { label: "Copropietario", text: "Copropietario" },
      { label: "Apoderado", text: "Apoderado del propietario" }, { label: "Albacea o heredero", text: "Albacea o heredero del propietario" },
    ],
    // Zonas del Reglamento de Zonificación y Usos del Suelo del Centro de Población de Tijuana
    // (P.O. 03/09/2010, última reforma P.O. 49 del 14/08/2020): art. 49 (suelo urbano y urbanizable)
    // y art. 43 (agropecuaria y especial de conservación).
    usoActual: [
      { label: "Habitacional", text: "Habitacional" }, { label: "Comercio y servicios", text: "Comercio y servicios" }, { label: "Mixto", text: "Mixto" },
      { label: "Industrial", text: "Industrial" }, { label: "Equipamiento urbano", text: "Equipamiento urbano" }, { label: "Turístico", text: "Turístico" },
      { label: "Agropecuario", text: "Agropecuario" }, { label: "Especial de conservación", text: "Especial de conservación" },
    ],
    regimen: [
      { label: "Propiedad privada", text: "Propiedad privada individual" }, { label: "Condominio", text: "Propiedad en condominio" },
      { label: "Copropiedad", text: "Copropiedad" }, { label: "Ejidal con dominio pleno", text: "Origen ejidal con dominio pleno" },
    ],
    proposito: [
      { label: "Precio de salida", text: "Servir de referencia para que {propietario} defina el precio de salida del inmueble en su comercialización. No es un avalúo para crédito, impuestos ni juicio." },
      { label: "Evaluar una oferta", text: "Servir de referencia a {propietario} para evaluar una oferta de compra recibida por el inmueble. No es un avalúo para crédito, impuestos ni juicio." },
    ],
    alcance: [
      { label: "Con visita", text: "Opinión de valor comercial elaborada por un asesor inmobiliario; no es un avalúo de perito valuador ni lo sustituye. Se basa en la visita al inmueble, los documentos indicados y comparables de mercado consultados en las fechas señaladas. No se verificaron estructura ni instalaciones ocultas." },
      { label: "Sin entrar al inmueble", text: "Opinión de valor comercial elaborada por un asesor inmobiliario; no es un avalúo de perito valuador ni lo sustituye. No se tuvo acceso al interior del inmueble: sus características se tomaron de los documentos indicados y de lo declarado por el propietario, por lo que el valor puede cambiar al inspeccionarlo." },
    ],
  },
};

const AYUDA: Record<string, Ayuda> = { "07": VALOR };

export const ayudaSeccion = (formato: string, seccion?: string) => seccion ? AYUDA[formato]?.secciones?.[seccion] : undefined;
export const ayudaCampo = (formato: string, campo: string) => AYUDA[formato]?.campos?.[campo];
export const plantillasCampo = (formato: string, campo: string) => AYUDA[formato]?.plantillas?.[campo] ?? [];

/** Sustituye {clave} por lo ya capturado; lo que falta queda como «____» para completarlo a mano. */
export function aplicarPlantilla(text: string, values: Record<string, unknown>) {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = values[key];
    return typeof value === "string" && value.trim() ? value.trim() : typeof value === "number" ? String(value) : "____";
  });
}
