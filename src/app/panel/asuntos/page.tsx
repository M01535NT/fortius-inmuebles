import { Icono } from "@/components/panel/icons";

/** Sin asunto elegido: en la computadora, el lado derecho invita a elegir uno; en el teléfono solo se ve la lista. */
export default function Asuntos() {
  return (
    <div className="as-in as-elige">
      <Icono nombre="asu" tamano={28} />
      <p className="as-m">Elige un asunto de la lista.</p>
    </div>
  );
}
