"use client";
import Link from "next/link";
import { Card, Surface } from "@/components/admin/kit";
import { PageHeader } from "@/components/admin/ui";
import { openTour } from "@/components/admin/workspace/tour";
import { useIsDirector } from "@/lib/admin/staff-scope";
import { HELP_SECTIONS } from "@/lib/admin/help";

/** «¿Cómo se hace esto?» (COR-26): el manual del panel, por pantalla. La guía de cada pantalla enlaza aquí. */
export default function HelpPage() {
  const director = useIsDirector();
  const sections = HELP_SECTIONS.filter(section => !section.director || director);
  return <Surface className="pb-8">
    <PageHeader title="¿Cómo se hace esto?" description="Lo que se hace en cada pantalla, paso por paso. Para ver dónde está cada cosa, abre la guía con el botón «Ayuda» o la tecla «?»." />
    <nav aria-label="Pantallas" className="mb-6 flex flex-wrap gap-2">
      {sections.map(section => <Link key={section.id} href={`#${section.id}`} className="inline-flex min-h-11 items-center rounded-full border border-[var(--card-edge)] bg-card px-4 text-sm font-semibold">{section.title}</Link>)}
    </nav>
    <div className="flex flex-col gap-5">
      {sections.map(section => <Card key={section.id} id={section.id} aria-labelledby={`ayuda-${section.id}`} className="scroll-mt-24 p-5 sm:p-6">
        <h2 id={`ayuda-${section.id}`} className="m-0 text-xl font-semibold">{section.title}</h2>
        <p className="mt-1 text-muted-foreground">{section.intro}</p>
        <div className="mt-4 flex flex-col gap-2">
          {section.tasks.map(task => <details key={task.q} className="rounded-[var(--radius-control)] border border-[var(--card-edge)] px-4 py-1">
            <summary className="flex min-h-11 cursor-pointer items-center font-semibold">{task.q}</summary>
            <ol className="mb-3 ml-5 mt-1 list-decimal space-y-1">{task.steps.map(step => <li key={step}>{step}</li>)}</ol>
          </details>)}
        </div>
      </Card>)}
    </div>
    <p className="mt-6 text-sm text-muted-foreground">¿No encuentras algo? <button type="button" className="font-semibold text-foreground underline underline-offset-4" onClick={openTour}>Abre la guía de esta pantalla</button> o pregúntale al director.</p>
  </Surface>;
}
