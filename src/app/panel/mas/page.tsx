import { ListaMas } from "@/components/panel/mas";

export const metadata = { title: "Más" };

export default function Mas() {
  return (
    <div className="pn-pagina">
      <h1 className="pn-h1">Más</h1>
      <ListaMas />
    </div>
  );
}
