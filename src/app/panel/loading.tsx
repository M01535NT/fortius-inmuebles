import { Cargando } from "@/components/panel/kit/estados";

export default function CargandoPanel() {
  return (
    <div className="pn-pagina">
      <Cargando lineas={4} etiqueta="Cargando la pantalla" />
    </div>
  );
}
