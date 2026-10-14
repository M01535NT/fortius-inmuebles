"use client";
import { btnGhost } from "@/components/admin/ui";
export type DossierView =
  | "all"
  | "summary"
  | "documents"
  | "activity"
  | "tasks";
/** Coach first: one next step; dense surfaces stay under Vista avanzada. */
const tabs: { id: DossierView; label: string }[] = [
  { id: "summary", label: "Siguiente paso" },
  { id: "documents", label: "Documentos" },
  { id: "tasks", label: "Tareas" },
  { id: "activity", label: "Actividad" },
  { id: "all", label: "Vista avanzada" },
];
export function DossierTabs({
  value,
  onChange,
  disabled,
}: {
  value: DossierView;
  onChange: (value: DossierView) => void;
  disabled: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label="Secciones del expediente"
      className="mb-5 flex flex-wrap gap-2"
    >
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          id={`exp-tab-${tab.id}`}
          role="tab"
          type="button"
          className={btnGhost + " aria-selected:bg-secondary"}
          disabled={disabled}
          tabIndex={value === tab.id ? 0 : -1}
          aria-selected={value === tab.id}
          aria-controls="exp-tab-content"
          onClick={() => onChange(tab.id)}
          onKeyDown={(event) => {
            let next = index;
            if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
            else if (event.key === "ArrowLeft")
              next = (index - 1 + tabs.length) % tabs.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = tabs.length - 1;
            else return;
            event.preventDefault();
            onChange(tabs[next].id);
            document.getElementById(`exp-tab-${tabs[next].id}`)?.focus();
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
