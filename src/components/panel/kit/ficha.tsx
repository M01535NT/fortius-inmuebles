import type { SeccionFicha } from "@/lib/panel/datos/vistas";

/**
 * Ficha de solo lectura: secciones con pares etiqueta y valor. Lo que falta se dice, no se esconde.
 * `vinculos` convierte en vínculo el valor de esas etiquetas (por ejemplo, «Persona» abre su ficha encima del asunto).
 */
export function Ficha({ secciones, vinculos }: { secciones: readonly SeccionFicha[]; vinculos?: Partial<Record<string, { alPulsar: () => void; nombre: string }>> }) {
  return (
    <div className="pn-ficha">
      {secciones.map((s) => (
        <section key={s.titulo}>
          <h3 className="pn-grupo">{s.titulo}</h3>
          <dl className="pn-ficha-dl">
            {s.datos.map((d) => (
              <div key={d.etiqueta}>
                <dt>{d.etiqueta}</dt>
                <dd className={d.falta ? "pn-tono-aviso" : undefined}>
                  {!d.falta && vinculos?.[d.etiqueta] ? (
                    <button type="button" className="pn-vinculo" onClick={vinculos[d.etiqueta]?.alPulsar} aria-label={vinculos[d.etiqueta]?.nombre}>{d.valor}</button>
                  ) : d.valor}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
