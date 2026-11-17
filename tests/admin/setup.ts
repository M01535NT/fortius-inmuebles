/*
  Lo que jsdom no trae y usan Radix y cmdk (DEC-52): medir tamaños, desplazar la opción activa a la
  vista, capturar el puntero y leer «reducir movimiento». Son sustitutos vacíos; el comportamiento real se ve en el navegador.
*/
if (typeof window !== "undefined") {
  window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= function () {};
  Element.prototype.hasPointerCapture ??= function () { return false; };
  Element.prototype.releasePointerCapture ??= function () {};
  Element.prototype.setPointerCapture ??= function () {};
  // «Reducir movimiento» apagado por defecto; las pruebas que lo necesiten lo cambian con su propio stub.
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
}
