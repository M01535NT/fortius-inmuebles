"use client";
import * as React from "react";
import { ArrowRight, Columns3 } from "@/components/admin/icons";
import { useSession } from "@/lib/admin/store";
import { SALE_PROCESS } from "@/lib/formatos/operation-workflow";
import { Button, Card, EmptyBox, Eyebrow, Notice, Segmented, Sheet, StageProgress, StatusChip, Surface, Tabs, TabPanel } from "@/components/admin/kit";

/** Muestra interna de los componentes del panel guiado (Componentes.dc.html). Solo administrador, fuera del menú. */
export default function SistemaPage() {
  const session = useSession();
  const [tab, setTab] = React.useState<"sigue" | "docs" | "tareas" | "hist" | "ajustes">("sigue");
  const [scope, setScope] = React.useState<"mias" | "equipo">("mias");
  const [sheet, setSheet] = React.useState(false);
  if (session?.role !== "admin") return <p role="alert">Esta página requiere acceso de administrador.</p>;
  const stages = SALE_PROCESS.map(p => p.label);
  return <Surface className="-mx-4 -mt-5 flex flex-col gap-12 px-4 pb-8 pt-5 md:-mx-5 md:-mt-6 md:rounded-[14px] md:px-8 md:pt-8">
    <header className="flex flex-col gap-2"><Eyebrow>Panel Fortius · Sistema</Eyebrow><h1 className="text-3xl font-bold">Componentes</h1></header>

    <section aria-labelledby="c-btn" className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
      <div><h2 id="c-btn" className="text-xl font-bold">Botones</h2><p className="mt-1 text-sm text-muted-foreground">Uno principal por pantalla.</p></div>
      <div className="flex flex-wrap items-center gap-3.5">
        <Button variant="primary" size="lg">Pasar a: Contrato y preparación <ArrowRight size={16} aria-hidden="true" /></Button>
        <Button variant="primary">Guardar</Button>
        <Button>Continuar <ArrowRight size={16} aria-hidden="true" /></Button>
        <Button variant="ghost">Guardar y seguir después</Button>
        <Button variant="link">Más detalles</Button>
        <Button variant="danger">Eliminar operación</Button>
        <Button variant="primary" disabled>Deshabilitado</Button>
      </div>
    </section>

    <section aria-labelledby="c-st" className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
      <div><h2 id="c-st" className="text-xl font-bold">Estados de requisito</h2><p className="mt-1 text-sm text-muted-foreground">Relleno, borde e ícono; no solo color.</p></div>
      <div className="flex flex-wrap gap-3">{(["pendiente", "recibido", "revisado", "observado", "no_aplica"] as const).map(k => <StatusChip key={k} state={k} />)}</div>
    </section>

    <section aria-labelledby="c-av" className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
      <div><h2 id="c-av" className="text-xl font-bold">Avance de etapas</h2></div>
      <div className="flex flex-col gap-7"><StageProgress stages={stages} current={2} /><div className="max-w-[350px]"><StageProgress stages={stages} current={2} compact /></div></div>
    </section>

    <section aria-labelledby="c-tabs" className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
      <div><h2 id="c-tabs" className="text-xl font-bold">Pestañas y filtro</h2></div>
      <div className="flex min-w-0 flex-col gap-5">
        <Tabs idPrefix="muestra" label="Secciones de la operación" value={tab} onChange={setTab} items={[{ id: "sigue", label: "Lo que sigue" }, { id: "docs", label: "Documentos", count: 6 }, { id: "tareas", label: "Tareas", count: 3 }, { id: "hist", label: "Historial" }, { id: "ajustes", label: "Ajustes" }]} />
        <TabPanel idPrefix="muestra" id={tab} className="text-sm text-muted-foreground">Contenido de la pestaña seleccionada.</TabPanel>
        <Segmented label="Mostrar operaciones de" value={scope} onChange={setScope} options={[{ id: "mias", label: "Mías" }, { id: "equipo", label: "Todo el equipo" }]} className="self-start" />
      </div>
    </section>

    <section aria-labelledby="c-av2" className="grid gap-6 md:grid-cols-[240px_minmax(0,1fr)]">
      <div><h2 id="c-av2" className="text-xl font-bold">Avisos, panel y vacíos</h2></div>
      <div className="flex min-w-0 flex-col gap-6">
        <Notice title="Ya tenemos a alguien con ese teléfono" actions={<><Button>Sí, es la misma persona</Button><Button variant="ghost">No, es otra persona</Button></>}>Ramón Félix Arce · Prospecto desde marzo de 2026.</Notice>
        <Card className="flex flex-col gap-3 p-6"><Eyebrow as="h3">Próxima tarea</Eyebrow><p className="font-semibold">Llamar para agendar la opinión de valor</p><Button variant="secondary" className="self-start" onClick={() => setSheet(true)}>Abrir panel «Revisado»</Button></Card>
        <div className="grid gap-5 sm:grid-cols-2">
          <EmptyBox title="Nada espera por ti">Todas tus operaciones van al día.</EmptyBox>
          <EmptyBox icon={<Columns3 size={28} aria-hidden="true" />} title="Aún no hay operaciones en esta etapa" action={<Button>Nueva operación</Button>} />
        </div>
      </div>
    </section>

    <Sheet open={sheet} onClose={() => setSheet(false)} eyebrow="Marcar como revisado" title="Que se pueda vender sin obstáculos" description="Dinos con qué lo comprobaste." footer={<><Button onClick={() => setSheet(false)}>Cancelar</Button><Button variant="primary" onClick={() => setSheet(false)}>Guardar como revisado</Button></>}>
      <div className="flex flex-col gap-1.5"><label htmlFor="muestra-res">Qué encontraste</label><textarea id="muestra-res" rows={3} className="min-h-24 w-full px-3.5 py-3" defaultValue="Sin gravámenes ni embargos." /></div>
    </Sheet>
  </Surface>;
}
