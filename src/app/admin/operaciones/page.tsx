"use client";
import * as React from "react";
import { OperationsBoard } from "@/components/admin/operation/board";

export default function OperacionesPage() {
  return <React.Suspense fallback={null}><OperationsBoard /></React.Suspense>;
}
