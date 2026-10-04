import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { connection } from "next/server";
import { headers } from "next/headers";

import "@/app/globals.css";
import "@/app/editorial.css";
import { SiteFooter } from "@/components/home/site-footer";
import { SiteNav } from "@/components/home/site-nav";
import { PublicFeaturesProvider } from "@/components/providers/public-features-provider";
import { getPublicContent, getPublicSettings } from "@/lib/backend/public";
import { siteConfig } from "@/data/site";
import { SITE_COPY } from "@/data/home-copy";
import { PublicPerformance } from "@/components/providers/public-performance";
import { PublicExperience } from "@/components/home/public-experience";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex",
  display: "swap",
});

const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: SITE_COPY.seoTitle,
    template: "%s | Mint Inmuebles",
  },
  description:
    SITE_COPY.seoDescription,
  openGraph: {
    title: SITE_COPY.seoTitle,
    description: SITE_COPY.seoDescription,
    locale: "es_MX",
    type: "website",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const pathname = (await headers()).get("x-mnt-pathname") ?? "/";
  const content = pathname.startsWith("/admin")
    ? null
    : await getPublicContent().catch(() => {
        console.error("[public-shell] Contenido público no disponible.");
        return null;
      });
  return {
    ...defaultMetadata,
    title: { default: content?.seoTitle || SITE_COPY.seoTitle, template: "%s | Mint Inmuebles" },
    description: content?.seoDescription || defaultMetadata.description,
    openGraph: { ...defaultMetadata.openGraph, title: content?.seoTitle || SITE_COPY.seoTitle, description: content?.seoDescription || SITE_COPY.seoDescription },
  };
}

/*
  Theme boot: light is the primary theme. We only add `.dark` when the user
  chose it before. Runs inline before paint to avoid a flash.
*/
const themeInit = `(function(){try{if(localStorage.getItem("mnt-theme")==="dark"){document.documentElement.classList.add("dark")}}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-mnt-pathname") ?? "/";
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const settings = isAdmin
    ? null
    : await getPublicSettings().catch(() => {
        console.error("[public-shell] Configuración pública no disponible.");
        return null;
      });
  const publicLeadsEnabled = process.env.MNT_PUBLIC_LEADS_ENABLED === "true";
  return (
    <html
      lang="es-MX"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${archivo.variable} ${plexMono.variable}`}
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
              <SiteNav settings={settings} solidHome />
              {process.env.VERCEL === "1" ? <PublicPerformance /> : null}
              <div className="relative z-10 bg-background">{children}</div>
              <div className="public-footer relative z-0"><SiteFooter settings={settings} /></div>
            </PublicExperience>
          )}
        </PublicFeaturesProvider>
      </body>
    </html>
  );
}
