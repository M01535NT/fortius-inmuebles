import type { BlogFigure } from "./blog-figures";

export const september27Figures: Record<string, BlogFigure[]> = {
  "indice-shf-tijuana-primer-semestre-2026": [{
    id: "figura-shf-contexto-precio", afterHeading: "Del índice al precio de una propiedad",
    title: "Del contexto metropolitano al inmueble",
    caption: "Enero-junio de 2026 contra el mismo periodo de 2025. La diferencia calculada es 1.8 puntos porcentuales; no es una ganancia individual ni un pronóstico.",
    source: "SHF, boletín 05/2026; secuencia de análisis de Fortius",
    data: { type: "infographic", layout: "sequence", items: [
      { label: "Contexto: Tijuana 9.7% · nacional 7.9%", detail: "Índices de vivienda adquirida con crédito, comparados para el mismo semestre." },
      { label: "Segmento: propiedades comparables", detail: "Distingue anuncios de operaciones documentadas y registra diferencias relevantes." },
      { label: "Inmueble: expediente y características", detail: "Revisa ubicación, superficies, conservación y situación documental antes de proponer un precio." },
    ] },
  }],
  "mes-testamento-baja-california-2026": [{
    id: "figura-testamento-preparacion", afterHeading: "Una ruta para ordenar tu patrimonio",
    title: "Prepara la entrevista en cuatro pasos",
    caption: "Herramienta de preparación, no lista oficial de requisitos. Campaña anunciada para septiembre de 2026; no se acredita una prórroga.",
    source: "Elaboración editorial de Fortius; anuncio del Gobierno de BC del 3 de septiembre de 2026",
    data: { type: "infographic", layout: "sequence", items: [
      { label: "Ordena la información", detail: "Personas, bienes, documentos disponibles y dudas que necesitas resolver." },
      { label: "Confirma el servicio", detail: "Pide requisitos, alcance de la tarifa, conceptos adicionales y disponibilidad de cita." },
      { label: "Explica tu situación", detail: "Lleva a la entrevista los antecedentes familiares y patrimoniales que requieren revisión." },
      { label: "Conserva el resultado", detail: "Identifica el instrumento que recibes y cómo solicitar copias posteriormente." },
    ] },
  }],
  "predial-isai-tijuana-condonacion-octubre-diciembre-2026": [{
    id: "figura-predial-ejemplo", afterHeading: "Ejemplo ficticio de lectura del beneficio",
    title: "Condonar accesorios no elimina el impuesto",
    caption: "Ejemplo ficticio en pesos. Supone accesorios totalmente elegibles, cumplimiento del acuerdo y ausencia de otros cargos. No es una liquidación oficial.",
    source: "Cálculo didáctico de Fortius: 10,000 + 1,200 + 800 = 12,000; ahorro supuesto de 2,000",
    data: { type: "infographic", layout: "grid", items: [
      { label: "$10,000 · impuesto principal", detail: "Es la cantidad base del ejemplo y permanece a cargo del contribuyente." },
      { label: "$2,000 · accesorios", detail: "$1,200 de recargos + $800 de multas, supuestos elegibles en este ejemplo." },
      { label: "$2,000 · ahorro supuesto", detail: "Condonación del 100% aplicada solo a esos accesorios." },
      { label: "$10,000 · pago ilustrativo", detail: "Resultado sin otros cargos. La autoridad debe determinar el importe real." },
    ] },
  }],
  "acciones-vivienda-bienestar-baja-california-2026": [{
    id: "figura-vivienda-etapas", afterHeading: "Un mapa para leer los anuncios",
    title: "Cuatro preguntas antes de comparar cifras",
    caption: "No sumes etapas ni traslades totales nacionales a Tijuana. Una escritura y una vivienda construida describen resultados distintos.",
    source: "Lectura editorial de Fortius de los reportes de BC y FOVISSSTE de septiembre de 2026",
    data: { type: "infographic", layout: "grid", items: [
      { label: "Territorio · ¿dónde?", detail: "País, estado, municipio o desarrollo: compara la misma escala." },
      { label: "Periodo · ¿hasta cuándo?", detail: "Distingue el corte del reporte de una meta para todo el sexenio." },
      { label: "Unidad · ¿qué se cuenta?", detail: "Viviendas, escrituras, lotes y acciones no son unidades intercambiables." },
      { label: "Etapa · ¿qué ha ocurrido?", detail: "Una contratación, una obra en proceso y una asignación no acreditan por sí solas una entrega." },
    ] },
  }],
  "alerta-registral-baja-california-monitoreo-inmuebles": [{
    id: "figura-alerta-registro", afterHeading: "De la inscripción al seguimiento",
    title: "Cómo activar el monitoreo registral",
    caption: "Servicio de aviso y monitoreo, no bloqueo automático de operaciones. Guarda la activación y revisa la continuidad al término de su vigencia anual.",
    source: "RETYS, ficha BC-DRPPC-026, actualizada el 24 de septiembre de 2026",
    data: { type: "infographic", layout: "sequence", items: [
      { label: "Acude al Registro", detail: "La ficha describe contratación presencial en una oficina registral." },
      { label: "Completa la solicitud", detail: "Nombre, correo, teléfono y folio real del predio a monitorear." },
      { label: "Paga y entrega", detail: "Presenta la solicitud y el comprobante del pago de derechos." },
      { label: "Comprueba la activación", detail: "La confirmación llega por correo electrónico. Conserva el mensaje." },
    ] },
  }],
  "isr-venta-casa-habitacion-exencion-requisitos": [{
    id: "figura-isr-revision", afterHeading: "Una ruta de revisión antes de fijar tu neto",
    title: "Preguntas para preparar la revisión del ISR",
    caption: "Orientación para integrar el expediente. La exención no se obtiene por marcar una casilla; requiere cumplir conjuntamente las condiciones aplicables.",
    source: "LISR, artículo 93 XIX a; Reglamento, artículos 154 y 155; RMF 2026, reglas 3.11.3 y 3.11.4",
    data: { type: "infographic", layout: "sequence", items: [
      { label: "Persona y antecedentes", detail: "¿Cuál es la residencia fiscal y hubo otra venta con exención dentro de los tres años anteriores?" },
      { label: "Vivienda y pruebas", detail: "¿Cómo se acredita el domicilio y qué uso y superficies tiene el inmueble?" },
      { label: "Importe y fecha", detail: "Contrasta el precio con 700,000 UDIS a la fecha aplicable; identifica si existe excedente." },
      { label: "Formalización y cálculo", detail: "Integra el expediente para revisión y formalización ante fedatario; separa impuesto, gastos y neto esperado." },
    ] },
  }],
};
