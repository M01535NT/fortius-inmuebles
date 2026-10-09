export const navigationGroups = [
  { label: "Propiedades", href: "/inventario", heading: "Encuentra tu espacio.", featured: "Ver inventario", links: [
    { href: "/comprar-propiedad", label: "Comprar una propiedad", detail: "De la búsqueda a la entrega." },
    { href: "/residencial", label: "Residencial", detail: "Casas y departamentos." },
    { href: "/comercial", label: "Comercial", detail: "Locales y oficinas." },
    { href: "/industrial", label: "Industrial", detail: "Espacios para tu operación." },
  ] },
  { label: "Servicios", href: "/vender-propiedad", heading: "Tu operación, paso a paso.", featured: "Vender mi propiedad", links: [
    { href: "/#metodo", label: "Método", detail: "Cómo coordinamos cada etapa." },
    { href: "/#entregables", label: "Entregables", detail: "Los documentos de tu operación." },
    { href: "/due-diligence-inmobiliaria", label: "Revisión documental", detail: "Qué revisamos antes de vender." },
    { href: "/vender-propiedad#precio-y-condiciones", label: "Opinión de valor", detail: "Cómo proponemos el precio de salida." },
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
    { href: "/#respuestas", label: "Preguntas frecuentes", detail: "Resuelve las dudas iniciales." },
  ] },
];
export type NavigationGroup = typeof navigationGroups[number];
