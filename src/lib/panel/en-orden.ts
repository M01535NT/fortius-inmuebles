/**
 * Guardados en fila: cada uno espera al anterior y sale con la versión más reciente (la que devolvió el guardado
 * anterior), así dos cambios seguidos no chocan entre sí. Si uno falla (por ejemplo, 409 porque otra persona guardó
 * antes), los que esperaban detrás se descartan: se habían preparado sobre lo que ya no es, y la pantalla recarga.
 */
export function guardadosEnOrden<T>(leer: () => T | null, poner: (x: T) => void) {
  let cola: Promise<void> = Promise.resolve();
  let tanda = 0;
  return function guardar<C>(
    preparar: (actual: T) => C,
    mandar: (actual: T, cambio: C) => Promise<T>,
    alFallar: (e: unknown) => Promise<void> | void,
  ): Promise<boolean> {
    const mia = tanda;
    const paso = cola.then(async () => {
      const actual = leer();
      if (!actual || mia !== tanda) return false;
      try {
        poner(await mandar(actual, preparar(actual)));
        return true;
      } catch (e) {
        tanda += 1;
        await alFallar(e);
        return false;
      }
    });
    cola = paso.then(() => undefined, () => undefined);
    return paso;
  };
}
