"use client";
import * as React from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useBrowserPreference } from "./browser-preference";

export function useSidebarPreference(userId: string) {
  return useBrowserPreference(`fortius:sidebar:${userId}`, { width: 232, collapsed: false }, (value) => {
    const saved = value as { width?: unknown; collapsed?: unknown } | null;
    return {
      width: typeof saved?.width === "number" && Number.isFinite(saved.width) ? Math.max(224, Math.min(360, saved.width)) : 232,
      collapsed: saved?.collapsed === true,
    };
  });
}
export function SidebarToggle({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return <button type="button" className="admin-sidebar-toggle hidden md:inline-flex" aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"} aria-expanded={!collapsed} aria-controls="admin-desktop-sidebar" onClick={onToggle} title={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}>
    {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
  </button>;
}
export function SidebarResize({ width, onResize }: { width: number; onResize: (width: number) => void }) {
  const drag = React.useRef<{ x: number; width: number } | null>(null);
  const clamp = (value: number) => Math.max(224, Math.min(360, Math.round(value)));
  return <div role="separator" tabIndex={0} aria-label="Ancho de la barra lateral" aria-orientation="vertical" aria-valuemin={224} aria-valuemax={360} aria-valuenow={width} aria-controls="admin-desktop-sidebar" className="admin-sidebar-resize"
    onPointerDown={(event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      drag.current = { x: event.clientX, width };
      event.currentTarget.setPointerCapture(event.pointerId);
    }}
    onPointerMove={(event) => { if (drag.current) onResize(clamp(drag.current.width + event.clientX - drag.current.x)); }}
    onPointerUp={() => { drag.current = null; }}
    onPointerCancel={() => { drag.current = null; }}
    onLostPointerCapture={() => { drag.current = null; }}
    onDoubleClick={() => onResize(232)}
    onKeyDown={(event) => {
      const next = event.key === "ArrowLeft" ? width - 16 : event.key === "ArrowRight" ? width + 16 : event.key === "Home" ? 224 : event.key === "End" ? 360 : null;
      if (next !== null) { event.preventDefault(); onResize(clamp(next)); }
    }} />;
}
