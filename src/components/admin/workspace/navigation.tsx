"use client";
import * as React from "react";
import Link from "next/link";
import { useBrowserPreference } from "./browser-preference";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, GripVertical, MoreHorizontal, RotateCcw, SlidersHorizontal } from "lucide-react";
import { moveModule, normalizeOrder } from "@/lib/admin/workspace";
import { btnGhost } from "@/components/admin/ui";

import { permittedModules, type AdminModule } from "./module-catalog";
export type { AdminModule } from "./module-catalog";
const isPrimary = (module: AdminModule) => module.primary || module.group === "Principal";
export function WorkspaceNavigation({
  modules,
  userId,
  role,
  pathname,
  onNavigate,
  collapsed = false,
  onExpand,
}: {
  modules: AdminModule[];
  userId: string;
  role: string;
  pathname: string;
  onNavigate: () => void;
  collapsed?: boolean;
  onExpand?: () => void;
}) {
  const allowed = permittedModules(modules, role);
  const key = `fortius:modules:${userId}`;
  const [order, setOrder] = useBrowserPreference<string[]>(key, [], (value) =>
    Array.isArray(value) ? value.filter((x) => typeof x === "string") : [],
  );
  const [editing, setEditing] = React.useState(false);
  const [dragging, setDragging] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState("");
  const [more, setMore] = React.useState<boolean | null>(null);

  const ids = normalizeOrder(
    order,
    allowed.map((m) => m.href),
  );
  function save(next: string[], message: string) {
    setNotice(
      setOrder(next)
        ? message
        : "Orden aplicado. Este navegador no permite guardarlo.",
    );
  }
  const custom = ids.some((id, i) => id !== allowed[i]?.href);
  const modular = allowed.some(isPrimary);
  const additionalActive = allowed.some(m => !isPrimary(m) && pathname.startsWith(m.href));
  const expanded = (more ?? (additionalActive || custom)) || editing;
  const visibleIds = modular && !expanded && !collapsed ? ids.filter(id => isPrimary(allowed.find(m => m.href === id)!)) : ids;
  return (
    <div className="min-w-0">
      <div className="space-y-1">
        {visibleIds.map((id, visibleIndex) => {
          const index = ids.indexOf(id);
          const item = allowed.find((m) => m.href === id)!;
          const Icon = item.icon;
          const previous = allowed.find((m) => m.href === visibleIds[visibleIndex - 1]);
          return (
            <React.Fragment key={id}>
              {!collapsed && !custom && !["Principal", "Inicio"].includes(item.group) && previous?.group !== item.group && (
                <p data-separated={!!previous && previous.group !== "Inicio"} className="admin-nav-group px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {item.group}
                </p>
              )}
              <div
                className={
                  "rounded-md " + (dragging === id ? "opacity-50" : "")
                }
                onDragOver={(event) => {
                  if (editing && dragging) event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragging)
                    save(
                      moveModule(ids, dragging, id),
                      `${allowed.find((m) => m.href === dragging)?.label} reordenado.`,
                    );
                  setDragging(null);
                }}
              >
                <Link
                  href={id}
                  aria-label={item.label}
                  title={collapsed ? item.label : undefined}
                  onClick={onNavigate}
                  aria-current={
                    (
                      id === "/admin"
                        ? pathname === id
                        : pathname.startsWith(id)
                    )
                      ? "page"
                      : undefined
                  }
                  className="admin-nav-link flex min-h-11 min-w-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground/75 transition-colors hover:bg-secondary aria-[current=page]:bg-secondary aria-[current=page]:text-foreground"
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.5} />
                  <span className={collapsed ? "sr-only" : "break-words"}>{item.label}</span>
                </Link>
                {editing && !collapsed && (
                  <div className="flex items-center justify-between gap-1 px-2 pb-2">
                    <span
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", id);
                        event.dataTransfer.effectAllowed = "move";
                        setDragging(id);
                      }}
                      onDragEnd={() => setDragging(null)}
                      className="cursor-grab p-2 text-muted-foreground"
                      title={`Arrastrar ${item.label}`}
                    >
                      <GripVertical size={18} />
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        aria-label={`Subir ${item.label}`}
                        className="rounded border border-border p-2 disabled:opacity-25"
                        onClick={() =>
                          save(
                            moveModule(ids, id, ids[index - 1]),
                            `${item.label}, posición ${index}.`,
                          )
                        }
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        disabled={index === ids.length - 1}
                        aria-label={`Bajar ${item.label}`}
                        className="rounded border border-border p-2 disabled:opacity-25"
                        onClick={() =>
                          save(
                            moveModule(ids, id, ids[index + 1]),
                            `${item.label}, posición ${index + 2}.`,
                          )
                        }
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      {modular && !collapsed && <button type="button" className="admin-more-tools" aria-expanded={expanded} onClick={() => setMore(!expanded)}><MoreHorizontal size={20} aria-hidden="true"/><span>{expanded ? "Menú principal" : "Más herramientas"}</span>{expanded ? <ChevronUp size={16} aria-hidden="true"/> : <ChevronDown size={16} aria-hidden="true"/>}</button>}
      <button
        className={btnGhost + " admin-organize-button mt-4 w-full"}
        aria-expanded={editing}
        aria-label={editing && !collapsed ? "Terminar organización" : "Organizar módulos"}
        title={collapsed ? "Organizar módulos" : undefined}
        type="button"
        onClick={() => { if (collapsed) { onExpand?.(); setEditing(true); } else setEditing(!editing); }}
      >
        {collapsed ? <GripVertical size={20} /> : <><SlidersHorizontal size={20} aria-hidden="true"/><span>{editing ? "Terminar organización" : "Organizar menú"}</span></>}
      </button>
      {editing && !collapsed && (
        <>
          <p className="mt-2 px-1 text-xs text-muted-foreground">
            Arrastra o usa las flechas. El orden se guarda para tu cuenta en
            este navegador.
          </p>
          <button
            type="button"
            className={btnGhost + " mt-2 w-full"}
            onClick={() =>
              save(
                allowed.map((m) => m.href),
                "Orden original restaurado.",
              )
            }
          >
            <RotateCcw size={14} /> Restablecer
          </button>
        </>
      )}
      <p role="status" className="sr-only">
        {notice}
      </p>
    </div>
  );
}
