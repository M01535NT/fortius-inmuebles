"use client";
import { useEffect, useState } from "react";

import { leerBiblioteca, type ClaseBiblioteca, type Guia } from "@/lib/panel/biblioteca";

/** Las guías se leen una vez por visita y se comparten entre el asunto y la Biblioteca. */
let guardadas: Promise<Guia[]> | null = null;
const avisados = new Set<() => void>();

export function olvidarGuias() {
  guardadas = null;
  for (const f of avisados) f();
}

export function useGuias(clase?: ClaseBiblioteca): Guia[] | null {
  const [guias, setGuias] = useState<Guia[] | null>(null);
  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    const otra = () => setVuelta((n) => n + 1);
    avisados.add(otra);
    return () => { avisados.delete(otra); };
  }, []);
  useEffect(() => {
    let vivo = true;
    guardadas ??= leerBiblioteca().catch((e: unknown) => { guardadas = null; throw e; });
    guardadas.then((g) => { if (vivo) setGuias(g); }, () => { if (vivo) setGuias([]); });
    return () => { vivo = false; };
  }, [vuelta]);
  return guias && clase ? guias.filter((g) => g.clase === clase) : guias;
}
