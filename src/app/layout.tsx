import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";

import "@/app/globals.css";
import { SiteFooter } from "@/components/home/site-footer";
import { SiteNav } from "@/components/home/site-nav";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://cota.example"),
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

/*
  Theme boot: light is the primary theme. We only add `.dark` when the user
  chose it before. Runs inline before paint to avoid a flash.
*/
const themeInit = `(function(){try{if(localStorage.getItem("cota-theme")==="dark"){document.documentElement.classList.add("dark")}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-MX"
      suppressHydrationWarning
      className={`${archivo.variable} ${plexMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <SiteNav />
        {/*
          Footer cortina: el contenido (z-10, fondo opaco) se desliza sobre el
          footer pegado al fondo del viewport (sticky bottom, z-0) y lo revela
          al llegar al final. Solo CSS, ambos temas.
        */}
        <div className="relative z-10 bg-background">{children}</div>
        <div className="sticky bottom-0 z-0">
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
