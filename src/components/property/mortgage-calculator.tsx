"use client";
import { MortgagePlanner } from "@/components/tools/mortgage-planner";
// Preserve the property-detail integration; USD listings require an explicit FX quote.
export function MortgageCalculator(props: {
  precio: number;
  moneda: "MXN" | "USD";
  precioEditable?: boolean;
}) {
  return <MortgagePlanner {...props} />;
}
