import { Icono } from "@/components/panel/icons";
import { Fila, GrupoLista } from "@/components/panel/kit/lista";

/** Herramientas: índice. Cada calculadora es su propia pantalla (crédito para el comprador, comisión para el vendedor). */
export default function Herramientas() {
  return (
    <div className="pn-pagina" style={{ maxWidth: 640 }}>
      <h1 className="pn-h1">Herramientas</h1>
      <p className="pn-sub">Cuentas rápidas para usar con un cliente.</p>
      <div style={{ marginTop: 24 }}>
        <GrupoLista>
          <Fila href="/panel/herramientas/credito" izquierda={<span className="pn-av" aria-hidden style={{ borderRadius: "var(--r-md)" }}><Icono nombre="costos" tamano={18} /></span>} titulo="Crédito hipotecario" subtitulo="Mensualidad, enganche e intereses para el comprador" />
          <Fila href="/panel/herramientas/comision" izquierda={<span className="pn-av" aria-hidden style={{ borderRadius: "var(--r-md)" }}><Icono nombre="precio" tamano={18} /></span>} titulo="Comisión" subtitulo="Comisión con IVA y lo que le queda al propietario" />
        </GrupoLista>
      </div>
    </div>
  );
}
