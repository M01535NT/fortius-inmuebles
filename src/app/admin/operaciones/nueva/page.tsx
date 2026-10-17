"use client";
import * as React from "react";
import { NewOperationWizard } from "@/components/admin/intake/wizard";

export default function NuevaOperacionPage() {
  return <React.Suspense fallback={null}><NewOperationWizard /></React.Suspense>;
}
