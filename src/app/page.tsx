import { Entregables } from "@/components/home/entregables";
import { Evaluar } from "@/components/home/evaluar";
import { Hero } from "@/components/home/hero";
import { Metodo } from "@/components/home/metodo";
import { Relato } from "@/components/home/relato";
import { Respuestas } from "@/components/home/respuestas";
import { Zonas } from "@/components/home/zonas";

/*
  Home: one continuous piece for the property owner. Nav and footer live in
  the root layout. Arc: hook (hero) → the problem (relato) → the manifesto →
  the method → the proof (entregables) → objections (respuestas) →
  territory (zonas) → conversion (evaluar).
*/
export default function HomePage() {
  return (
    <main>
      <Hero />
      <Relato />
      <Metodo />
      <Entregables />
      <Respuestas />
      <Zonas />
      <Evaluar />
    </main>
  );
}
