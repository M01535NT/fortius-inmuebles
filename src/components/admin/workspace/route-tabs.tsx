"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TabPanel, Tabs } from "@/components/admin/kit";

/** Pestañas de una sección guardadas en ?tab=; la primera es la predeterminada. */
export function RouteTabs<K extends string>({ label, idPrefix, tabs }: { label: string; idPrefix: string; tabs: Array<{ id: K; label: string; render: () => React.ReactNode }> }) {
  const params = useSearchParams(), router = useRouter(), pathname = usePathname();
  const requested = params.get("tab");
  const active = tabs.find(tab => tab.id === requested) ?? tabs[0];
  function change(id: K) {
    router.replace(id === tabs[0].id ? pathname : `${pathname}?tab=${id}`, { scroll: false });
  }
  return <div className="flex min-w-0 flex-col gap-5">
    <Tabs idPrefix={idPrefix} label={label} value={active.id} onChange={change} items={tabs.map(({ id, label }) => ({ id, label }))} />
    <TabPanel idPrefix={idPrefix} id={active.id} className="min-w-0">{active.render()}</TabPanel>
  </div>;
}
