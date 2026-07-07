import { Compromisos } from "@/components/home/compromisos";
import { Destacadas } from "@/components/home/destacadas";
import { Entregables } from "@/components/home/entregables";
import { Evaluar } from "@/components/home/evaluar";
import { Hero } from "@/components/home/hero";
import { Herramientas } from "@/components/home/herramientas";
import { Metodo } from "@/components/home/metodo";
import { MetodoHorizontal } from "@/components/home/metodo-horizontal";
import { Relato } from "@/components/home/relato";
import { Respuestas } from "@/components/home/respuestas";
import { Segmentos } from "@/components/home/segmentos";
import { Zonas } from "@/components/home/zonas";
import { ESPECTACULAR } from "@/data/motion-config";

/*
  Home: one continuous piece for the property owner. Nav and footer live in
  the root layout. Arc: hook (hero) → the problem (relato) → the manifesto →
  the method → the proof (entregables) → inventory doors (destacadas,
  segmentos) → objections (respuestas) → tools (herramientas) → territory
  (zonas) → honest promise (compromisos) → conversion (evaluar).
  MOTION_MODE (src/data/motion-config.ts) decide la variante del Método.
*/
export default function HomePage() {
  return (
    <main>
      <Hero />
      <Relato />
      {ESPECTACULAR ? <MetodoHorizontal /> : <Metodo />}
      <Entregables />
      <Destacadas />
      <Segmentos />
      <Respuestas />
      <Herramientas />
      <Zonas />
      <Compromisos />
      <Evaluar />
    </main>
  );
}
