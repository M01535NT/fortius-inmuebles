import type { NextConfig } from "next";

const publicStorageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Secciones del panel provisional que el panel nuevo no tiene (más las direcciones viejas que el provisional
// todavía redirige). Las que existen en los dos (agenda, bandeja, configuración, herramientas, personas, trámites)
// abren el panel nuevo.
const SOLO_PROVISIONAL = [
  "apps", "archivos", "asesores", "ayuda", "blog", "calendario", "clientes", "contactos", "contenido", "control-comercial",
  "documentos", "entrevistas", "expedientes", "historial", "leads", "notas", "operaciones", "papelera", "perfil", "proceso",
  "propiedades", "reportes", "sistema", "tareas",
].join("|");
const nextConfig: NextConfig = {
  // No anunciar la pila en cada respuesta.
  poweredByHeader: false,
  // HTTP-only cloud tunnels reload on changes; React debug data must travel in RSC.
  ...(process.env.NODE_ENV === "development" && process.env.FORTIUS_INMUEBLES_CLOUD_PREVIEW === "true"
    ? { experimental: { reactDebugChannel: false } }
    : {}),
  outputFileTracingIncludes: {
    "/api/admin/formatos/*/emitir": ["./public/fonts/*.ttf", "./public/brand/membrete-*.png"],
    "/api/admin/comercial/*/emitir": ["./public/fonts/*.ttf", "./public/brand/membrete-*.png"],
    "/api/admin/apps/runs/*/documento": ["./public/fonts/*.ttf", "./public/brand/membrete-*.png"],
    "/api/admin/apps/runs/*/export": ["./public/fonts/*.ttf", "./public/brand/membrete-*.png", "./public/hero/**/*", "./node_modules/@img/sharp-*/**/*"],
    "/avisos/*": ["./public/fonts/*.ttf", "./public/brand/membrete-*.png"],
    "/inventario/*/imagen-social": ["./public/hero/**/*", "./node_modules/@img/sharp-*/**/*"],
    "/inventario/*/ficha-tecnica": [
      "./public/hero/**/*",
      "./public/fonts/*.ttf",
      "./public/brand/fortius-logo.png",
      "./public/brand/membrete-*.png",
      // Native Sharp binaries and libvips are loaded dynamically in Vercel's Linux runtime.
      "./node_modules/@img/sharp-*/**/*",
    ],
  },
  async redirects() {
    return [
      // Retire public production aliases while preserving paths and query strings.
      ...["fortius-inmuebles.vercel.app", "fortius-alpha.vercel.app"].map((host) => ({
        source: "/:path*",
        has: [{ type: "host" as const, value: host }],
        destination: "https://fortiusinmuebles.com/:path*",
        permanent: true,
      })),
      // Las tres páginas por especialidad eran el inventario filtrado: ahora son atajos del propio inventario.
      ...["residencial", "comercial", "industrial"].map((segmento) => ({ source: `/${segmento}`, destination: `/inventario?segmento=${segmento}`, permanent: true })),
      { source: "/due-diligence-inmobiliaria", destination: "/#por-que-fortius", permanent: true },
      { source: "/zonas", destination: "/inventario", permanent: true },
      { source: "/zonas/:zona", destination: "/inventario", permanent: true },
      { source: "/descargas/checklist-venta-mnt.pdf", destination: "/descargas/checklist-venta-fortius.pdf", permanent: true },
      // El cambio (etapa D): el panel nuevo vive en /admin. Las direcciones guardadas de /panel llegan a la misma
      // pantalla con sus parámetros. Temporales (307) mientras exista la reserva, para poder volver atrás sin caché.
      { source: "/panel", destination: "/admin", permanent: false },
      { source: "/panel/:resto+", destination: "/admin/:resto+", permanent: false },
      // Lo que solo existe en el provisional sigue abriendo en su reserva, /admin-anterior, con la misma ruta.
      { source: `/admin/:seccion(${SOLO_PROVISIONAL})`, destination: "/admin-anterior/:seccion", permanent: false },
      { source: `/admin/:seccion(${SOLO_PROVISIONAL})/:resto+`, destination: "/admin-anterior/:seccion/:resto+", permanent: false },
      // Panel guiado (Fase 2): las listas viejas viven ahora en secciones con pestañas; las fichas de detalle no cambian.
      { source: "/admin-anterior/expedientes", destination: "/admin-anterior/operaciones", permanent: false },
      // Fase 4: cada operación tiene su propia dirección y las páginas de etapa son columnas del tablero.
      { source: "/admin-anterior/operaciones", has: [{ type: "query" as const, key: "expediente", value: "(?<id>[0-9a-fA-F-]{36})" }], destination: "/admin-anterior/operaciones/:id", permanent: false },
      ...Object.entries({ preparacion: "verificacion-precio", promocion: "publicacion-seguimiento", negociacion: "visitas-ofertas", cierre: "cierre-entrega", postventa: "cierre-entrega" })
        .map(([legacy, slug]) => ({ source: `/admin-anterior/proceso/${legacy}`, destination: `/admin-anterior/operaciones?etapa=${slug}`, permanent: false })),
      { source: "/admin-anterior/proceso/:etapa", destination: "/admin-anterior/operaciones?etapa=:etapa", permanent: false },
      { source: "/admin-anterior/leads", destination: "/admin-anterior/contactos", permanent: false },
      { source: "/admin-anterior/clientes", destination: "/admin-anterior/contactos?tab=clientes", permanent: false },
      { source: "/admin-anterior/calendario", destination: "/admin-anterior/agenda", permanent: false },
      { source: "/admin-anterior/tareas", destination: "/admin-anterior/agenda?tab=tareas", permanent: false },
      { source: "/admin-anterior/apps", destination: "/admin-anterior/herramientas", permanent: false },
      { source: "/admin-anterior/documentos", destination: "/admin-anterior/herramientas", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d8j0ntlcm91z4.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Solo el bucket público configurado de MNT; nunca el privado.
      ...(publicStorageUrl ? [new URL("/storage/v1/object/public/fortius-inmuebles-public/**", publicStorageUrl)] : []),
    ],
  },
};

export default nextConfig;
