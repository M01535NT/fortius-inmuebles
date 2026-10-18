import * as React from "react";
import { Surface } from "@/components/admin/kit";
import { cn } from "@/lib/utils";

/** Marco de las secciones del panel guiado: fondo de lienzo, título, resumen y acciones. */
export function GuidedPage({ title, subtitle, actions, children, className }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <Surface className={cn("min-w-0 pb-4", className)}>
    <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="m-0 text-[clamp(1.75rem,2.6vw,2.5rem)] font-[650] leading-[1.1] tracking-[-0.03em]">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex min-w-0 flex-wrap items-center gap-3">{actions}</div>}
    </header>
    {children}
  </Surface>;
}
