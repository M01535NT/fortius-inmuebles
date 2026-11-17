/*
  Pruebas del sitio público que corren con `playwright.public.config.ts`: necesitan el backend local
  de ejemplo (fixtures/public-backend.mjs, puerto 3101) y el sitio en el 3100. La configuración del
  panel las excluye para no correrlas contra otro servidor ni con el `.env.local` real.
*/
export const PUBLIC_SPECS = [
  "pwa-install.spec.ts",
  "public-navigation.spec.ts",
  "property-pdf.spec.ts",
  "financial-tools.spec.ts",
  "sitio-fortius-ii.spec.ts",
];
