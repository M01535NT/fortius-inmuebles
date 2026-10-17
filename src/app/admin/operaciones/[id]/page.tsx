"use client";
import * as React from "react";
import { useParams } from "next/navigation";
import { OperationScreen } from "@/components/admin/operation/screen";

export default function OperacionPage() {
  const { id } = useParams<{ id: string }>();
  return <React.Suspense fallback={null}><OperationScreen key={id} id={id} /></React.Suspense>;
}
