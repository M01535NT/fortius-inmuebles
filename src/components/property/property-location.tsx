import type { Property } from "@/data/propiedades";

/*
  Ubicación: mapa siempre visible (embed de Google Maps por zona; se afina a
  la dirección exacta cuando el cliente la cargue) + puntos de interés
  cercanos con tiempos aproximados.
*/
export function PropertyLocation({ property }: { property: Property }) {
  const query = encodeURIComponent(`${property.zona}, Tijuana, Baja California, México`);

  return (
    <div className="mt-12">
      <h2 className="display-soft text-2xl text-foreground">Ubicación y zona</h2>
      <p className="mt-3 max-w-[62ch] text-base leading-relaxed text-muted-foreground">
        El mapa muestra la zona de la propiedad. La ubicación exacta se
        comparte al agendar tu visita.
      </p>

      <div className="mt-5 overflow-hidden rounded-lg border border-border">
        <iframe
          src={`https://www.google.com/maps?q=${query}&z=14&output=embed`}
          title={`Mapa de ${property.zona}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-[300px] w-full md:h-[340px]"
        />
      </div>

      {property.puntosDeInteres.length > 0 ? (
        <div className="mt-6 max-w-[560px]">
          <p className="text-base font-medium text-foreground">A pocos minutos</p>
          <dl className="mt-2">
            {property.puntosDeInteres.map((poi) => (
              <div
                key={poi.lugar}
                className="flex items-baseline justify-between gap-6 border-b border-border py-3"
              >
                <dt className="text-sm text-muted-foreground">{poi.lugar}</dt>
                <dd className="font-mono text-sm text-foreground">
                  {String(poi.minutos).padStart(2, "0")} min
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Tiempos aproximados en auto, según tráfico.
          </p>
        </div>
      ) : null}
    </div>
  );
}
