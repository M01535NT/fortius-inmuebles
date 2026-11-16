import Link from "next/link";

import { Gesto, Icono } from "@/components/panel/icons";
import { BARRA_TELEFONO, CONFIGURACION, SECCIONES } from "@/lib/panel/secciones";

export const metadata = { title: "Más" };

export default function Mas() {
  const resto = [...SECCIONES.filter((s) => !(BARRA_TELEFONO as readonly string[]).includes(s.slug)), CONFIGURACION];
  return (
    <div className="pn-pagina">
      <h1 className="pn-h1">Más</h1>
      <div className="pn-tarjeta" style={{ marginTop: 16, overflow: "hidden" }}>
        {resto.map((s) => (
          <Link key={s.slug} href={s.ruta} style={{ display: "flex", alignItems: "center", gap: 14, minHeight: 64, padding: "10px 16px", borderTop: "1px solid var(--border)" }}>
            <Icono nombre={s.icono} tamano={24} />
            <span style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 600 }}>{s.nombre}</span>
              <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{s.resumen}</span>
            </span>
            <Gesto nombre="derecha" tamano={16} />
          </Link>
        ))}
      </div>
    </div>
  );
}
