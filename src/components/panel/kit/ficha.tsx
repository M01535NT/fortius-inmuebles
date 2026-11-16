import type { SeccionFicha } from "@/lib/panel/datos/vistas";

/** Ficha de solo lectura: secciones con pares etiqueta y valor. Lo que falta se dice, no se esconde. */
export function Ficha({ secciones }: { secciones: readonly SeccionFicha[] }) {
  return (
    <div className="pn-ficha">
      {secciones.map((s) => (
        <section key={s.titulo}>
          <h3 className="pn-grupo">{s.titulo}</h3>
          <dl className="pn-ficha-dl">
            {s.datos.map((d) => (
              <div key={d.etiqueta}>
                <dt>{d.etiqueta}</dt>
                <dd className={d.falta ? "pn-tono-aviso" : undefined}>{d.valor}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
