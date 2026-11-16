import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { PanelShell } from "@/components/panel/panel-shell";
import "./panel-ds.css";
import "./panel-kit.css";
import "./panel-shadcn.css";

// Geist del sistema de diseño Fortius; solo se carga en las rutas del panel nuevo.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s | Panel Fortius" },
  robots: { index: false, follow: false },
};

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={geist.variable}>
      <PanelShell>{children}</PanelShell>
    </div>
  );
}
