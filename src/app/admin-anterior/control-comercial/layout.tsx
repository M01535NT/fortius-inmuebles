import { AdminFrame } from "@/components/admin/workspace/admin-frame";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminFrame section="reportes">{children}</AdminFrame>;
}
