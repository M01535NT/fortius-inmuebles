import Link from "next/link";

import { Icono } from "@/components/panel/icons";
import { Vacio } from "@/components/panel/kit/estados";

import "./bandeja.css";

/**
 * La Bandeja llega en un paso posterior: su tabla todavía no existe en la base y la pantalla de antes guardaba en el panel
 * provisional. Aquí no se lee nada; solo se dice dónde subir archivos mientras tanto. La pantalla completa sigue en
 * `components/panel/bandeja/pantalla.tsx` para retomarla.
 */
export default function Bandeja() {
  return (
    <div className="bj-pronto">
      <h1 className="pn-h1">Bandeja</h1>
      <Vacio
        icono="descargar"
        titulo="La Bandeja llega en un paso posterior"
        texto="Por ahora, los archivos se suben desde Documentos del asunto."
        accion={<Link href="/panel/asuntos" className="pn-btn pn-btn-secundario" style={{ gap: 8 }}><Icono nombre="asu" tamano={18} />Ir a Asuntos</Link>}
      />
    </div>
  );
}
