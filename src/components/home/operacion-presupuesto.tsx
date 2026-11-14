"use client";

import * as React from "react";

const VENTA = [
  { value: "", label: "Cualquiera" },
  { value: "3000000", label: "Hasta $3,000,000 MXN" },
  { value: "8000000", label: "Hasta $8,000,000 MXN" },
  { value: "15000000", label: "Hasta $15,000,000 MXN" },
];

const RENTA = [
  { value: "", label: "Cualquiera" },
  { value: "15000", label: "Hasta $15,000 MXN al mes" },
  { value: "30000", label: "Hasta $30,000 MXN al mes" },
  { value: "60000", label: "Hasta $60,000 MXN al mes" },
];

/*
  Operación y presupuesto del buscador: con «Rentar», el presupuesto pasa a montos mensuales
  (antes ofrecía millones). Sin script se queda con los montos de compra y el formulario envía igual.
  Tipo y zona llegan del servidor y se pintan entre los dos, en el mismo orden de siempre.
*/
export function OperacionPresupuesto({ children }: { children: React.ReactNode }) {
  const [operacion, setOperacion] = React.useState("");
  const [maximo, setMaximo] = React.useState("");
  const opciones = operacion === "renta" ? RENTA : VENTA;
  return (
    <>
      <label><span>Operación</span><select name="op" value={operacion} onChange={(event) => {
        setOperacion(event.target.value);
        setMaximo(""); // un tope de compra no vale como renta mensual, ni al revés
      }}><option value="">Comprar o rentar</option><option value="venta">Comprar</option><option value="renta">Rentar</option></select></label>
      {children}
      <label><span>Presupuesto</span><select name="max" value={maximo} onChange={(event) => setMaximo(event.target.value)}>{opciones.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
    </>
  );
}
