"use client";
import { useParams } from "next/navigation";

import { InformeParaElCliente } from "@/components/panel/informe/informe";

/** El informe para el cliente de un asunto, a pantalla completa: a un lado qué lleva, al otro la hoja. */
export default function Pagina() {
  const { id } = useParams<{ id: string }>();
  return <InformeParaElCliente key={id} asuntoId={id} />;
}
