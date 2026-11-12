"use client";
import * as React from "react";
import { AlertTriangle } from "@/components/admin/icons";
import { Button } from "@/components/admin/kit";

/*
  Límite de error de una sección (C60): si una parte de la pantalla falla al mostrarse,
  el resto sigue en pie y esa parte ofrece «Reintentar». Sin detalles técnicos en pantalla.
*/
type Props = { what: string; children: React.ReactNode };
type State = { failed: boolean };

export class SectionBoundary extends React.Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[panel] No se pudo mostrar ${this.props.what}.`, (error as { digest?: string } | null)?.digest ?? "");
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <div role="alert" className="flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-[var(--card-edge)] bg-[var(--card)] p-4 text-sm">
      <AlertTriangle size={20} aria-hidden="true" className="shrink-0 text-[var(--alert)]" />
      <span className="min-w-0 flex-1">No pudimos mostrar {this.props.what}. El resto de la pantalla sigue disponible.</span>
      <Button onClick={() => this.setState({ failed: false })}>Reintentar</Button>
    </div>;
  }
}
