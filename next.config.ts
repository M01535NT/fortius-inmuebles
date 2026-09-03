import type { NextConfig } from "next";

const publicStorageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const nextConfig: NextConfig = {
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
      // Solo el bucket público del proyecto COTA configurado; nunca el privado.
      ...(publicStorageUrl ? [new URL("/storage/v1/object/public/cota-public/**", publicStorageUrl)] : []),
    ],
  },
};

export default nextConfig;
