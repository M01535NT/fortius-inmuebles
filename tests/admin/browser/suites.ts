/*
  Pruebas del sitio público que corren con `playwright.public.config.ts`: necesitan el backend local
  de ejemplo (fixtures/public-backend.mjs, puerto 3101) y el sitio en el 3100. La configuración del
  panel las excluye para no correrlas contra otro servidor ni con el `.env.local` real.
*/
export const PUBLIC_SPECS = [
  "home-commercial.spec.ts",
  "pwa-install.spec.ts",
  "fortius-editorial.spec.ts",
  "home-experience.spec.ts",
  "editorial-home.spec.ts",
  "public-motion-experience.spec.ts",
  "public-navigation.spec.ts",
  "blog-editorial.spec.ts",
  "property-pdf.spec.ts",
  "financial-tools.spec.ts",
];
