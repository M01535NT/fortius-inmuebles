import { Compromisos } from "@/components/home/compromisos";
import { Destacadas } from "@/components/home/destacadas";
import { Entregables } from "@/components/home/entregables";
import { Evaluar } from "@/components/home/evaluar";
import { Hero } from "@/components/home/hero";
import { Herramientas } from "@/components/home/herramientas";
import { Metodo } from "@/components/home/metodo";
import { Relato } from "@/components/home/relato";
import { Respuestas } from "@/components/home/respuestas";
import { Segmentos } from "@/components/home/segmentos";
import { Zonas } from "@/components/home/zonas";

/*
  Home: one continuous piece for the property owner. Nav and footer live in
  the root layout. Arc: hook (hero) → the problem (relato) → the manifesto →
  the method → the proof (entregables) → inventory doors (destacadas,
  segmentos) → objections (respuestas) → tools (herramientas) → territory
  (zonas) → honest promise (compromisos) → conversion (evaluar).
  El Método es SIEMPRE vertical (decisión 7-jul-2026: el horizontal pinned
  se probó y se descartó; la vertical con rail es la mejor versión).
*/
export default function HomePage() {
  return (
    <main>
      <Hero />
      <Relato />
      <Metodo />
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
