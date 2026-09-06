import type { NextConfig } from "next";

const publicStorageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/inventario/*/ficha-tecnica": [
      "./public/hero/**/*",
      // Native Sharp binaries and libvips are loaded dynamically in Vercel's Linux runtime.
      "./node_modules/@img/sharp-*/**/*",
    ],
  },
  async redirects() {
    return [
      {
        source: "/descargas/checklist-venta-cota.pdf",
        destination: "/descargas/checklist-venta-mnt.pdf",
        permanent: true,
      },
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
      ...(publicStorageUrl ? [new URL("/storage/v1/object/public/mnt-public/**", publicStorageUrl)] : []),
    ],
  },
};

export default nextConfig;
