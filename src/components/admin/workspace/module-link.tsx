import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

export function ModuleLink({ href, title, description, icon: Icon }: { href: string; title: string; description: string; icon: LucideIcon }) {
  return <Link href={href} className="admin-card admin-module-link">
    <Icon size={24} aria-hidden="true" />
    <div><h2>{title}</h2><p className="mt-2">{description}</p></div>
    <span className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary-ink">Abrir <ArrowUpRight size={16} aria-hidden="true" /></span>
  </Link>;
}
