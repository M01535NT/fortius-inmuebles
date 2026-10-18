"use client";

import * as React from "react";
import { CATEGORIA_PUNTO_LABELS, type CategoriaPunto, type Property } from "@/data/propiedades";

/*
  Ubicación y zona (ficha «Escenario»): embed de Google Maps por zona en un
  marco propio, sin API ni ubicación exacta, y lugares cercanos con tiempos
  aproximados en auto, filtrables por categoría cuando el panel las define.
*/
export function PropertyLocation({ property }: { property: Property }) {
  const query = encodeURIComponent(`${property.zona}, Tijuana, Baja California, México`);
  const lugares = property.puntosDeInteres;
  const categorias = Array.from(new Set(lugares.map(lugar => lugar.categoria).filter((c): c is CategoriaPunto => Boolean(c))));
  const [filtro, setFiltro] = React.useState<CategoriaPunto | "todos">("todos");
  const visibles = filtro === "todos" ? lugares : lugares.filter(lugar => lugar.categoria === filtro);

  return (
    <div className="fe-location">
      {categorias.length > 1 && (
        <div className="fe-filter" role="group" aria-label="Filtrar lugares cercanos">
          <button type="button" aria-pressed={filtro === "todos"} onClick={() => setFiltro("todos")}>Todos</button>
          {categorias.map(categoria => <button key={categoria} type="button" aria-pressed={filtro === categoria} onClick={() => setFiltro(categoria)}>{CATEGORIA_PUNTO_LABELS[categoria]}</button>)}
        </div>
      )}
      <div className={"fe-location-grid" + (lugares.length ? "" : " is-map-only")}>
        <figure className="fe-map">
          <iframe src={`https://www.google.com/maps?q=${query}&z=14&output=embed`} title={`Mapa de ${property.zona}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          <figcaption>Zona aproximada · la ubicación exacta se comparte al agendar la visita</figcaption>
        </figure>
        {lugares.length > 0 && (
          <ol className="fe-places" aria-label="Lugares cercanos">
            {visibles.map((lugar, index) => (
              <li key={lugar.lugar} className="fe-card">
                <span className="fe-place-number" aria-hidden="true">{index + 1}</span>
                <span className="fe-place-name"><strong>{lugar.lugar}</strong>{lugar.categoria ? <span>{CATEGORIA_PUNTO_LABELS[lugar.categoria]}</span> : null}</span>
                <span className="fe-place-time">{lugar.minutos} min</span>
              </li>
            ))}
          </ol>
        )}
      </div>
      {lugares.length > 0 && <p className="fe-note">Tiempos aproximados en auto; varían según la hora y el tráfico.</p>}
    </div>
  );
}
