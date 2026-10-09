import type { NextConfig } from "next";

const publicStorageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const nextConfig: NextConfig = {
  // HTTP-only cloud tunnels reload on changes; React debug data must travel in RSC.
  ...(process.env.NODE_ENV === "development" && process.env.FORTIUS_INMUEBLES_CLOUD_PREVIEW === "true"
    ? { experimental: { reactDebugChannel: false } }
    : {}),
  outputFileTracingIncludes: {
    "/avisos/*": ["./public/fonts/*.ttf", "./public/brand/fortius-logo.png"],
    "/inventario/*/imagen-social": ["./public/hero/**/*", "./node_modules/@img/sharp-*/**/*"],
    "/inventario/*/ficha-tecnica": [
      "./public/hero/**/*",
      "./public/fonts/*.ttf",
      "./public/brand/fortius-logo.png",
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
