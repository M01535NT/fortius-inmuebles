import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Schibsted_Grotesk } from "next/font/google";
import { connection } from "next/server";
import { headers } from "next/headers";

import "@/app/globals.css";
import "@/app/editorial.css";
import "@/app/nocturno.css";
import "@/app/publico.css";
import { SiteFooter } from "@/components/home/site-footer";
import { SiteNav } from "@/components/home/site-nav";
import { PublicFeaturesProvider } from "@/components/providers/public-features-provider";
import { getPublicContent, getPublicSettings } from "@/lib/backend/public";
import { siteConfig } from "@/data/site";
import { SITE_COPY } from "@/data/home-copy";
import { PublicPerformance } from "@/components/providers/public-performance";
import { PublicExperience } from "@/components/home/public-experience";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationLd, websiteLd } from "@/lib/seo/json-ld";
import { SITE_NAME } from "@/lib/seo/page-metadata";

// Archivo es la letra del panel: aquí no se precarga para no competir con la del sitio público
// en el celular (Web Vitals, 13/11/2026). El layout del panel la precarga en sus rutas.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
  preload: false,
});

// Sitio público (30/10/2026): Schibsted Grotesk en 400/600/700. El panel conserva Archivo.
const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-public",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex",
  display: "swap",
  // Solo la usan contadores pequeños (galería, carrusel); se descarga cuando aparecen.
  preload: false,
});

export const viewport: Viewport = { themeColor: "#061f3f" };

const defaultMetadata: Metadata = {
  applicationName: "Fortius",
  // Next emits the standard mobile tag; retain Apple’s tag for older iOS.
  other: { "apple-mobile-web-app-capable": "yes" },
  appleWebApp: { capable: true, title: "Fortius", statusBarStyle: "default" },
  metadataBase: new URL(siteConfig.url),
  title: {
    default: SITE_COPY.seoTitle,
    template: "%s | Fortius Inmuebles",
  },
  description:
    SITE_COPY.seoDescription,
  openGraph: {
    title: SITE_COPY.seoTitle,
    description: SITE_COPY.seoDescription,
    siteName: SITE_NAME,
    locale: "es_MX",
    type: "website",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const pathname = (await headers()).get("x-fortius-inmuebles-pathname") ?? "/";
  const content = pathname.startsWith("/admin")
    ? null
    : await getPublicContent().catch(() => {
        console.error("[public-shell] Contenido público no disponible.");
        return null;
      });
  return {
    ...defaultMetadata,
    title: { default: content?.seoTitle || SITE_COPY.seoTitle, template: "%s | Fortius Inmuebles" },
    description: content?.seoDescription || defaultMetadata.description,
    openGraph: { ...defaultMetadata.openGraph, title: content?.seoTitle || SITE_COPY.seoTitle, description: content?.seoDescription || SITE_COPY.seoDescription, url: pathname },
    twitter: { card: "summary_large_image", title: content?.seoTitle || SITE_COPY.seoTitle, description: content?.seoDescription || SITE_COPY.seoDescription },
  };
}

/*
  Theme boot: light is the primary theme. We add `.dark` when the user chose it
  before or, on the public site with no choice saved yet, when the device is in
  dark mode (12/11/2026). The panel keeps light unless chosen. Runs inline before
  paint to avoid a flash.
*/
const themeInit = `(function(){try{var s=localStorage.getItem("fortius-inmuebles-theme");var p=location.pathname;var admin=p==="/admin"||p.indexOf("/admin/")===0;if(s==="dark"||(s===null&&!admin&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-fortius-inmuebles-pathname") ?? "/";
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const settings = isAdmin
    ? null
    : await getPublicSettings().catch(() => {
        console.error("[public-shell] Configuración pública no disponible.");
        return null;
      });
  const publicLeadsEnabled = process.env.FORTIUS_INMUEBLES_PUBLIC_LEADS_ENABLED === "true";
  return (
    <html
      lang="es-MX"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${archivo.variable} ${plexMono.variable}${isAdmin ? "" : ` ${schibsted.variable}`}`}
    >
      <head>
        {/* Browsers hide the nonce content attribute before hydration; the nonce property and CSP remain intact. */}
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        {/*
          En pantallas amplias y altas, el contenido (z-10, fondo opaco) revela
          el footer al llegar al final. En pantallas cortas, el footer sigue el
          flujo normal para que todos sus enlaces sean accesibles.
        */}
        <PublicFeaturesProvider publicLeadsEnabled={publicLeadsEnabled} settings={settings}>
          {/* Links crossing the admin/public boundary load a fresh document:
              this server layout and its settings persist during soft navigation. */}
          {isAdmin ? <div className="relative z-10 bg-background">{children}</div> : (
            <PublicExperience>
              <JsonLd data={[organizationLd(settings), websiteLd()]} />
              {/* Con teclado, la primera parada salta la barra y lleva directo al contenido. */}
              <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-md focus:bg-background focus:px-4 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg">Saltar al contenido</a>
              <SiteNav />
              {process.env.VERCEL === "1" ? <PublicPerformance /> : null}
              <div id="contenido" tabIndex={-1} className="relative z-10 bg-background outline-none">{children}</div>
              <div className="public-footer relative z-0"><SiteFooter settings={settings} /></div>
            </PublicExperience>
          )}
        </PublicFeaturesProvider>
      </body>
    </html>
  );
}
