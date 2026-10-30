export const navigationGroups = [
  { label: "Propiedades", href: "/inventario", heading: "Encuentra tu espacio.", featured: "Ver inventario", links: [
    { href: "/comprar-propiedad", label: "Comprar una propiedad", detail: "De la búsqueda a la entrega." },
    { href: "/inventario?segmento=residencial", label: "Residencial", detail: "Casas y departamentos." },
    { href: "/inventario?segmento=comercial", label: "Comercial", detail: "Locales, oficinas y plazas." },
    { href: "/inventario?segmento=industrial", label: "Industrial", detail: "Naves, bodegas y terrenos." },
  ] },
  { label: "Servicios", href: "/vender-propiedad", heading: "Tu operación, paso a paso.", featured: "Vender mi propiedad", links: [
    { href: "/#metodo", label: "Método", detail: "Cómo coordinamos cada etapa." },
    { href: "/#entregables", label: "Entregables", detail: "Los documentos de tu operación." },
    { href: "/due-diligence-inmobiliaria", label: "Revisión documental", detail: "Qué revisamos antes de vender." },
    { href: "/opinion-de-valor", label: "Opinión de valor", detail: "Cómo proponemos el precio de salida." },
  ] },
  { label: "Nosotros", href: "/nosotros", heading: "Conoce a Fortius.", featured: "Nuestro equipo", links: [
    { href: "/nosotros#agentes", label: "Agentes", detail: "Conoce a tu contacto." },
    { href: "/nosotros#mision", label: "Misión", detail: "El propósito de nuestro trabajo." },
    { href: "/nosotros#vision", label: "Visión", detail: "Hacia dónde queremos crecer." },
    { href: "/nosotros#valores", label: "Valores", detail: "Lo que guía nuestras decisiones." },
  ] },
  { label: "Recursos", href: "/herramientas", heading: "Prepara tu decisión.", featured: "Todas las herramientas", links: [
    { href: "/blog", label: "Blog", detail: "Guías para comprar y vender." },
    { href: "/herramientas/hipoteca", label: "Calculadora de hipoteca", detail: "Estima tu financiamiento." },
    { href: "/herramientas/gastos-de-cierre", label: "Gastos de cierre", detail: "Prepara los números de la operación." },
    { href: "/preguntas-frecuentes", label: "Preguntas frecuentes", detail: "Resuelve las dudas iniciales." },
  ] },
  { label: "Avisos", href: "/avisos", heading: "Información a tu alcance.", featured: "Ver documentos", links: [
    { href: "/avisos#derechos", label: "Derechos del consumidor", detail: "Carta de derechos en PDF." },
    { href: "/avisos#no-discriminacion", label: "No discriminación", detail: "Nuestra política de atención." },
    { href: "/privacidad", label: "Privacidad", detail: "Información sobre tus datos." },
    { href: "/avisos#honorarios", label: "Honorarios y atención", detail: "Información y canales de contacto." },
  ] },
];
export type NavigationGroup = typeof navigationGroups[number];
