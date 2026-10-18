import type { NextConfig } from "next";

const publicStorageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const nextConfig: NextConfig = {
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
      { source: "/zonas", destination: "/inventario", permanent: true },
      { source: "/zonas/:zona", destination: "/inventario", permanent: true },
      { source: "/descargas/checklist-venta-mnt.pdf", destination: "/descargas/checklist-venta-fortius.pdf", permanent: true },
      // Panel guiado (Fase 2): las listas viejas viven ahora en secciones con pestañas; las fichas de detalle no cambian.
      { source: "/admin/expedientes", destination: "/admin/operaciones", permanent: false },
      // Fase 4: cada operación tiene su propia dirección y las páginas de etapa son columnas del tablero.
      { source: "/admin/operaciones", has: [{ type: "query" as const, key: "expediente", value: "(?<id>[0-9a-fA-F-]{36})" }], destination: "/admin/operaciones/:id", permanent: false },
      ...Object.entries({ preparacion: "verificacion-precio", promocion: "publicacion-seguimiento", negociacion: "visitas-ofertas", cierre: "cierre-entrega", postventa: "cierre-entrega" })
        .map(([legacy, slug]) => ({ source: `/admin/proceso/${legacy}`, destination: `/admin/operaciones?etapa=${slug}`, permanent: false })),
      { source: "/admin/proceso/:etapa", destination: "/admin/operaciones?etapa=:etapa", permanent: false },
      { source: "/admin/leads", destination: "/admin/contactos", permanent: false },
      { source: "/admin/clientes", destination: "/admin/contactos?tab=clientes", permanent: false },
      { source: "/admin/calendario", destination: "/admin/agenda", permanent: false },
      { source: "/admin/tareas", destination: "/admin/agenda?tab=tareas", permanent: false },
      { source: "/admin/apps", destination: "/admin/herramientas", permanent: false },
      { source: "/admin/documentos", destination: "/admin/herramientas?tab=documentos", permanent: false },
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
