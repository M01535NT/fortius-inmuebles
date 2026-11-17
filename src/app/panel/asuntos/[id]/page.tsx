import { Suspense } from "react";

import { DetalleAsunto } from "@/components/panel/asunto/detalle";

export default async function Asunto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <DetalleAsunto key={id} id={id} />
    </Suspense>
  );
}
