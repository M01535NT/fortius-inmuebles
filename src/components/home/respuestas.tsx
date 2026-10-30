"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { homeText, type HomeTextKey } from "@/data/home-copy";
import type { SiteContent } from "@/lib/admin/store";
import { Reveal } from "@/components/gsap/reveal";
import { SplitHeading } from "@/components/gsap/split-heading";

type AnswerLink = { href: string; label: string };
type Question = { id: string; q: string; a: string; link?: AnswerLink };

const OWNER_QUESTIONS: { q: string; copy: HomeTextKey; link?: AnswerLink }[] = [
  { q: "¿Qué necesito para empezar?", copy: "inicioRespuesta" },
  { q: "¿Cómo definen el precio de salida?", copy: "precioRespuesta" },
  { q: "¿Qué gastos debo considerar al vender?", copy: "gastosRespuesta", link: { href: "/herramientas/gastos-de-cierre", label: "Estimar gastos de cierre" } },
  { q: "¿Cuánto tarda en venderse una propiedad?", copy: "tiempoRespuesta" },
];
const BUYER_QUESTIONS: Question[] = [
  { id: "inventario", q: "¿Dónde consulto las propiedades?", a: "En el inventario puedes explorar las fichas, revisar fotografías y características y consultar la disponibilidad.", link: { href: "/inventario", label: "Explorar propiedades" } },
  { id: "visita", q: "¿Cómo solicito información o una visita?", a: "Abre la ficha del inmueble y utiliza su opción de contacto para consultar esa propiedad y coordinar una visita." },
];

function Item({ item, index }: { item: Question; index: number }) {
  const [open, setOpen] = React.useState(false);
  const panelId = `respuesta-${item.id}`;
  const buttonId = `${panelId}-button`;
  return <Reveal direction={index % 2 === 0 ? "left" : "right"} distance={70} delay={0.05 * index}>
    <div className="border-b border-border">
      <h4><button id={buttonId} type="button" aria-expanded={open} aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left">
        <span className="display-soft text-xl text-foreground">{item.q}</span>
        <Plus aria-hidden="true" className={`h-5 w-5 shrink-0 text-primary-ink transition-transform duration-300${open ? " rotate-45" : ""}`} strokeWidth={1.5} />
      </button></h4>
      <div id={panelId} role="region" aria-labelledby={buttonId} aria-hidden={!open} inert={!open}
        className={`editorial-faq-answer${open ? " is-open" : ""}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="pb-7">
            <p className="max-w-[62ch] text-base leading-relaxed text-muted-foreground">{item.a}</p>
            {item.link && <Link href={item.link.href} className="editorial-text-link mt-3">{item.link.label}</Link>}
          </div>
        </div>
      </div>
    </div>
  </Reveal>;
}

export function Respuestas({ content }: { content?: SiteContent | null }) {
  const groups = [
    { title: "Para vender", questions: OWNER_QUESTIONS.map((item) => ({ ...item, id: item.copy, a: homeText(content, item.copy) })) },
    { title: "Para comprar", questions: BUYER_QUESTIONS },
  ];
  return <section id="respuestas" aria-label="Preguntas frecuentes" className="mx-auto max-w-[1280px] scroll-mt-20 overflow-x-clip px-5 py-24 md:px-8 md:py-32">
    <div className="grid gap-12 lg:grid-cols-12">
      <SplitHeading lines={homeText(content, "preguntasTitulo").split("\n")} className="display-title text-4xl text-foreground sm:text-5xl lg:col-span-4" />
      <div className="space-y-10 lg:col-span-7 lg:col-start-6">
        {groups.map((group) => <div key={group.title}>
          <h3 className="editorial-eyebrow mb-4">{group.title}</h3>
          <div className="border-t border-border">{group.questions.map((item, index) => <Item key={item.id} item={item} index={index} />)}</div>
        </div>)}
      </div>
    </div>
  </section>;
}
