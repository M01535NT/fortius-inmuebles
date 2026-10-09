import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import styles from "./panel.module.css";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s | Panel Fortius" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.panel}><AdminShell>{children}</AdminShell></div>;
}
