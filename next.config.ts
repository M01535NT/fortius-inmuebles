import type { NextConfig } from "next";

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
      // Fotos de los anuncios: bucket público `listings` del back-office.
      {
        protocol: "https",
        hostname: "fvvmvnduvzxvodeombld.supabase.co",
        pathname: "/storage/v1/object/public/listings/**",
      },
    ],
  },
};

export default nextConfig;
