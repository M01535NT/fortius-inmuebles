import * as React from "react";
import { Surface } from "@/components/admin/kit";
import { cn } from "@/lib/utils";

/** Marco de las secciones del panel guiado: fondo de lienzo, título, resumen y acciones. */
export function GuidedPage({ title, subtitle, actions, children, className }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <Surface className={cn("-mx-4 -mt-5 min-w-0 px-4 pb-8 pt-5 md:-mx-5 md:-mt-6 md:rounded-[14px] md:px-8 md:pt-8", className)}>
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="m-0">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex min-w-0 flex-wrap items-center gap-3">{actions}</div>}
    </header>
    {children}
  </Surface>;
}
