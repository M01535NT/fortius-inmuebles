import type { Metadata } from "next";
import { Archivo } from "next/font/google";

import { AdminShell } from "@/components/admin/admin-shell";
import "./panel-base.css";
import styles from "./panel.module.css";
import "./panel-uplift.css";

// Misma Archivo que el layout raíz, pero precargada solo en las rutas del panel.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s | Panel Fortius" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${styles.panel} ${archivo.variable} admin-root`}><AdminShell>{children}</AdminShell></div>;
}
