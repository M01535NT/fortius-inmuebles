"use client";
import * as React from "react";
import { DayPicker, getDefaultClassNames, type DayButton } from "react-day-picker";
import { es } from "react-day-picker/locale";
import { ChevronDown, ChevronLeft, ChevronRight } from "@/components/admin/icons";
import { cn } from "@/lib/utils";

/*
  Calendario del panel (shadcn/ui «Calendar» sobre react-day-picker 9, DEC-52): en español, la
  semana empieza en lunes, hoy marcado con un anillo y lo elegido en azul de marca (el borgoña se
  reserva para la acción principal). Flechas, Re Pág y Av Pág para moverse con el teclado. Días de
  44 px en celular. Para elegir fecha dentro de un campo, va dentro de `Popover`.
*/
// Fuera de `Calendar`: si fueran funciones en línea, cada render crearía un tipo nuevo y el
// calendario se volvería a montar (perdería el foco y los clics).
function CalendarRoot({ className, rootRef, ...rest }: React.ComponentProps<NonNullable<CalendarComponents["Root"]>>) {
  return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...rest} />;
}
function CalendarChevron({ className, orientation, ...rest }: React.ComponentProps<NonNullable<CalendarComponents["Chevron"]>>) {
  const Icon = orientation === "left" ? ChevronLeft : orientation === "right" ? ChevronRight : ChevronDown;
  return <Icon size={18} aria-hidden="true" className={cn(className)} {...rest} />;
}
type CalendarComponents = NonNullable<React.ComponentProps<typeof DayPicker>["components"]>;

export function Calendar({ className, classNames, showOutsideDays = true, captionLayout = "label", formatters, components, ...props }: React.ComponentProps<typeof DayPicker>) {
  const d = getDefaultClassNames();
  return <DayPicker
    locale={es}
    weekStartsOn={1}
    showOutsideDays={showOutsideDays}
    captionLayout={captionLayout}
    className={cn("group/calendar w-fit p-3 [--cell-size:2.75rem] sm:[--cell-size:2.5rem]", className)}
    formatters={{ formatMonthDropdown: date => date.toLocaleString("es-MX", { month: "short" }), ...formatters }}
    classNames={{
      root: cn("w-fit", d.root),
      months: cn("relative flex flex-col gap-4 md:flex-row", d.months),
      month: cn("flex w-full flex-col gap-3", d.month),
      nav: cn("absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1", d.nav),
      button_previous: cn("inline-flex size-(--cell-size) items-center justify-center rounded-[var(--radius-control)] text-foreground hover:bg-secondary aria-disabled:opacity-40", d.button_previous),
      button_next: cn("inline-flex size-(--cell-size) items-center justify-center rounded-[var(--radius-control)] text-foreground hover:bg-secondary aria-disabled:opacity-40", d.button_next),
      month_caption: cn("flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)", d.month_caption),
      dropdowns: cn("flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-semibold", d.dropdowns),
      dropdown_root: cn("relative rounded-[8px] border border-[var(--control-edge)] has-focus:outline-3 has-focus:outline-[var(--focus-color)]", d.dropdown_root),
      dropdown: cn("absolute inset-0 bg-card opacity-0", d.dropdown),
      caption_label: cn("select-none font-semibold first-letter:uppercase", captionLayout === "label" ? "text-[0.9375rem]" : "flex h-9 items-center gap-1 rounded-[8px] pl-2 pr-1 text-sm [&>svg]:size-3.5 [&>svg]:text-muted-foreground", d.caption_label),
      month_grid: cn("w-full border-collapse", d.month_grid),
      weekdays: cn("flex", d.weekdays),
      weekday: cn("flex-1 select-none text-[0.75rem] font-semibold uppercase text-muted-foreground", d.weekday),
      week: cn("mt-1 flex w-full", d.week),
      week_number_header: cn("w-(--cell-size) select-none", d.week_number_header),
      week_number: cn("select-none text-[0.75rem] text-muted-foreground", d.week_number),
      day: cn("group/day relative aspect-square h-full w-full select-none p-0 text-center", d.day),
      range_start: cn("rounded-l-[var(--radius-control)] bg-[var(--info-surface)]", d.range_start),
      range_middle: cn("rounded-none", d.range_middle),
      range_end: cn("rounded-r-[var(--radius-control)] bg-[var(--info-surface)]", d.range_end),
      today: cn("rounded-[var(--radius-control)] [&>button]:ring-2 [&>button]:ring-inset [&>button]:ring-[var(--focus-color)] [&>button]:font-bold", d.today),
      outside: cn("text-muted-foreground opacity-60", d.outside),
      disabled: cn("text-muted-foreground opacity-40", d.disabled),
      hidden: cn("invisible", d.hidden),
      ...classNames,
    }}
    components={{
      Root: CalendarRoot,
      Chevron: CalendarChevron,
      DayButton: CalendarDayButton,
      ...components,
    }}
    {...props}
  />;
}

export function CalendarDayButton({ className, day, modifiers, ...props }: React.ComponentProps<typeof DayButton>) {
  const d = getDefaultClassNames();
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => { if (modifiers.focused) ref.current?.focus(); }, [modifiers.focused]);
  const single = modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle;
  return <button ref={ref} type="button"
    data-day={day.date.toLocaleDateString("es-MX")}
    data-selected-single={single || undefined}
    data-range-start={modifiers.range_start || undefined}
    data-range-end={modifiers.range_end || undefined}
    data-range-middle={modifiers.range_middle || undefined}
    className={cn(
      "flex aspect-square size-auto w-full min-w-(--cell-size) flex-col items-center justify-center gap-0.5 rounded-[var(--radius-control)] text-[0.9375rem] font-medium leading-none text-foreground outline-none hover:bg-secondary",
      "focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-[var(--focus-color)]",
      "data-[selected-single]:bg-[var(--brand-navy)] data-[selected-single]:text-[var(--on-navy)] dark:data-[selected-single]:bg-[var(--on-navy-focus)] dark:data-[selected-single]:text-[var(--background)]",
      "data-[range-start]:bg-[var(--brand-navy)] data-[range-start]:text-[var(--on-navy)] data-[range-end]:bg-[var(--brand-navy)] data-[range-end]:text-[var(--on-navy)]",
      "data-[range-middle]:rounded-none data-[range-middle]:bg-[var(--info-surface)] data-[range-middle]:text-foreground [&>span]:text-[0.6875rem] [&>span]:opacity-70",
      d.day,
      className,
    )}
    {...props}
  />;
}
