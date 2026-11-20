"use client";
import { useCatalogos } from "@/components/panel/datos/catalogos";
import { Icono } from "@/components/panel/icons";
import { Boton } from "@/components/panel/kit/boton";
import { Seleccion } from "@/components/panel/ui/select";
import { iniciales } from "@/lib/panel/asuntos/api";
import type { Coincidencia } from "@/lib/panel/consulta/api";

/**
 * Aviso de persona repetida (SPEC.md, sección 4): si quien llama se parece a una ficha del Directorio, la hoja lo dice
 * junto a sus datos, con por qué coincide y los asuntos que el servidor deja ver. Nunca impide seguir.
 *
 * La elección va en una lista desplegable y no en botones: son tres estados reales («Sin decidir», «Es la misma»,
 * «Es otra persona»), y quedarse sin decidir también vale (el asunto se abre como antes). Con varias fichas, la misma
 * lista nombra a cada una.
 */
export type Eleccion = { ficha: string | null; vistas: string[] };

const OTRA = "otra";
const POR: Record<Coincidencia["por"][number], string> = { telefono: "teléfono", correo: "correo", nombre: "nombre" };
const unir = (l: string[]) => (l.length < 2 ? l.join("") : `${l.slice(0, -1).join(", ")} y ${l[l.length - 1]}`);

/** La elección que sigue en pie con estas fichas: la elegida sigue entre ellas o, si fue «otra», no apareció ninguna nueva. */
export function eleccionVigente(eleccion: Eleccion | null, fichas: Coincidencia[]): Eleccion | null {
  if (!eleccion || !fichas.length) return null;
  if (eleccion.ficha === null) return fichas.every((f) => eleccion.vistas.includes(f.id)) ? eleccion : null;
  return fichas.some((f) => f.id === eleccion.ficha) ? eleccion : null;
}

const llave = (id: string) => `fortius-panel-consulta-ficha:${id}`;
export function leerEleccion(id: string): Eleccion | null {
  try { const t = localStorage.getItem(llave(id)); return t ? (JSON.parse(t) as Eleccion) : null; } catch { return null; }
}
export function guardarEleccion(id: string | null, e: Eleccion | null) {
  if (!id) return;
  try { if (e) localStorage.setItem(llave(id), JSON.stringify(e)); else localStorage.removeItem(llave(id)); } catch { /* sin almacenamiento: queda en pantalla */ }
}

/** `conFicha`: la consulta empezó desde una ficha del Directorio; «Es otra persona» la conserva en vez de crear otra. */
export function FichaParecida({ fichas, eleccion, alElegir, conFicha = false }: {
  fichas: Coincidencia[]; eleccion: Eleccion | null; alElegir: (e: Eleccion | null) => void; conFicha?: boolean;
}) {
  const cat = useCatalogos();
  if (!fichas.length) return null;
  const vigente = eleccionVigente(eleccion, fichas);

  if (vigente) {
    const elegida = fichas.find((f) => f.id === vigente.ficha);
    return (
      <div className="cs-par cs-par-hecho" role="status">
        <Icono nombre={elegida ? "ok" : "users"} tamano={15} aria-hidden />
        <span className="cs-par-dice">{elegida ? <>Se usa la ficha de <b>{elegida.nombre}</b></> : conFicha ? "Se queda la ficha con que empezó la consulta" : "Se crea una ficha nueva"}</span>
        <Boton variante="fantasma" className="cs-par-cambiar" onClick={() => alElegir(null)}>Cambiar</Boton>
      </div>
    );
  }

  const varias = fichas.length > 1;
  const opciones = [
    ...fichas.map((f) => ({ valor: f.id, etiqueta: varias ? `Es ${f.nombre}` : "Es la misma persona" })),
    { valor: OTRA, etiqueta: "Es otra persona" },
  ];
  const vistas = fichas.map((f) => f.id);

  return (
    <section className="cs-par" aria-labelledby="cs-par-t">
      <div className="cs-par-t" id="cs-par-t">
        <Icono nombre="alerta" tamano={15} aria-hidden />
        {varias ? `Ya hay ${fichas.length} fichas parecidas` : "Ya hay una ficha parecida"}
      </div>
      <ul className="cs-par-l">
        {fichas.map((f) => {
          const dato = f.por.includes("telefono") ? f.telefono : f.por.includes("correo") ? f.correo : null;
          return (
            <li key={f.id} className="cs-par-it">
              <span className="as-av" aria-hidden>{iniciales(f.nombre)}</span>
              <div className="cs-par-c">
                <span className="cs-par-n"><b>{f.nombre}</b>{f.fallecida ? <span className="cs-par-f">Fallecida</span> : null}</span>
                <small>Coincide por {unir(f.por.map((p) => POR[p]))}{dato ? ` · ${dato}` : ""}</small>
                {f.asuntos.length ? (
                  <ul className="cs-par-as" aria-label={`Asuntos de ${f.nombre}`}>
                    {f.asuntos.map((a) => (
                      <li key={a.id}>
                        <span className="as-num">{a.folio}</span>{a.nombre}
                        <span className="cs-par-va"> · {cat.etiqueta("en_que_va", a.en_que_va)}{a.papel ? ` · ${cat.etiqueta("papel", a.papel).toLowerCase()}` : ""}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="cs-par-elige">
        <label htmlFor="cs-par-quien">Quien llama</label>
        <Seleccion id="cs-par-quien" valor="" vacio="Sin decidir" opciones={opciones}
          alElegir={(v) => { if (v) alElegir({ ficha: v === OTRA ? null : v, vistas }); }} />
      </div>
    </section>
  );
}
