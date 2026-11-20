import "@/components/panel/asunto/asunto.css";
import "@/components/panel/asunto/vistas.css";

/** Mientras abre una pantalla: el marco del modelo visual (barra de 52 px vacía) y las líneas de carga debajo. */
export default function CargandoPanel() {
  return (
    <div className="as-vista">
      <div className="as-vbar" aria-hidden />
      <div className="as-cargando" aria-busy="true" aria-label="Cargando la pantalla"><span /><span /><span /><span /></div>
    </div>
  );
}
