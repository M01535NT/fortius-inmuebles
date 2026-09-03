import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { connection } from "next/server";

import "@/app/globals.css";
import { SiteFooter } from "@/components/home/site-footer";
import { SiteNav } from "@/components/home/site-nav";
import { getPublicContent, getPublicSettings } from "@/lib/backend/public";
import { siteConfig } from "@/data/site";

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
    default: "COTA | Vende tu propiedad en Tijuana con método",
    template: "%s | COTA",
  },
  description:
    "Firma inmobiliaria en Tijuana y Baja California. Precio con datos, expediente revisado y seguimiento por escrito, de la captación a la firma ante notario.",
  openGraph: {
    title: "COTA | Bienes raíces con método",
    description:
      "Vende, renta o compra en Tijuana con un proceso documentado: análisis de mercado, revisión de papeles y coordinación hasta la firma.",
    locale: "es_MX",
    type: "website",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPublicContent();
  return {
    ...defaultMetadata,
    title: { default: content?.seoTitle || "COTA | Vende tu propiedad en Tijuana con método", template: "%s | COTA" },
    description: content?.seoDescription || defaultMetadata.description,
    openGraph: { ...defaultMetadata.openGraph, title: content?.seoTitle || "COTA | Bienes raíces con método", description: content?.seoDescription || defaultMetadata.openGraph?.description },
  };
}

/*
  Theme boot: light is the primary theme. We only add `.dark` when the user
  chose it before. Runs inline before paint to avoid a flash.
*/
const themeInit = `(function(){try{if(localStorage.getItem("cota-theme")==="dark"){document.documentElement.classList.add("dark")}}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  const settings = await getPublicSettings();
  return (
    <html
      lang="es-MX"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${archivo.variable} ${plexMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <SiteNav settings={settings} />
        {/*
          Footer cortina: el contenido (z-10, fondo opaco) se desliza sobre el
          footer pegado al fondo del viewport (sticky bottom, z-0) y lo revela
          al llegar al final. Solo CSS, ambos temas.
        */}
        <div className="relative z-10 bg-background">{children}</div>
        <div className="sticky bottom-0 z-0">
          <SiteFooter settings={settings} />
        </div>
      </body>
    </html>
  );
}
