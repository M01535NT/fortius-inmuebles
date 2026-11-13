"use client";

import { useEffect } from "react";
import { AlertTriangle } from "@/components/admin/icons";
import { Button, ButtonLink, Card } from "@/components/admin/kit";

/*
  Error dentro del panel (SIM-11, C30): con el estilo del panel y sin detalles técnicos.
  El menú del panel sigue visible porque este límite queda dentro de su layout.
*/
export default function AdminError({ error, retry, reset }: { error: unknown; retry?: () => void; reset?: () => void }) {
  useEffect(() => {
    console.error("[panel] No se pudo mostrar la página.", (error as { digest?: string } | null)?.digest ?? "");
  }, [error]);
  const again = retry ?? reset;
  return <Card panel className="mx-auto mt-6 flex w-full max-w-xl flex-col items-start gap-4 p-6 sm:p-8" role="alert" aria-labelledby="admin-error-title">
    <AlertTriangle size={28} aria-hidden="true" className="text-[var(--alert)]" />
    <h1 id="admin-error-title" className="text-2xl font-semibold">No pudimos abrir esta página.</h1>
    <p className="text-muted-foreground">Tus datos están a salvo. Vuelve a intentarlo; si sigue igual, regresa a Hoy y abre la página más tarde.</p>
    <div className="flex flex-wrap gap-3">
      {again && <Button variant="primary" onClick={() => again()}>Reintentar</Button>}
      <ButtonLink href="/admin">Volver a Hoy</ButtonLink>
    </div>
  </Card>;
}
