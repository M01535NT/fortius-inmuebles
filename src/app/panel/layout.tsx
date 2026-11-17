import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { PanelShell } from "@/components/panel/panel-shell";
import "./panel-ds.css";
import "./panel-kit.css";
import "./panel-shadcn.css";

// Estilo tipo Apple (16/11/2026): letra del sistema en Apple; Inter en Windows y Android. Solo se carga en el panel nuevo.
const letra = Inter({ subsets: ["latin"], variable: "--font-panel", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s | Panel Fortius" },
  robots: { index: false, follow: false },
};

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={letra.variable}>
      <PanelShell>{children}</PanelShell>
    </div>
  );
}
