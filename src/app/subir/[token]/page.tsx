import type { Metadata } from "next";

import { SubirDocumentos } from "./subir-documentos";
import "./subir.css";

/*
  La liga para que el cliente suba sus documentos (SPEC.md, sección 8). No se indexa ni se comparte:
  el enlace llega por WhatsApp de su asesor y vence a los 14 días. La lista de lo que falta la da la ruta /api/subir/[token].
*/
export const metadata: Metadata = {
  title: "Sube tus documentos",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default async function SubirPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <main className="subir">
      <SubirDocumentos token={token} />
    </main>
  );
}
