"use client";
import * as React from "react";
import { ContactsScreen } from "@/components/admin/contacts/contacts";

export default function ContactosPage() {
  return <React.Suspense fallback={null}><ContactsScreen /></React.Suspense>;
}
