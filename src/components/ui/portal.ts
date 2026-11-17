"use client";
import * as React from "react";

/*
  Los colores del panel viven en `.admin-root` (claro y oscuro). Por eso los menús, paneles y
  ventanas de Radix se montan dentro de esa raíz y no directo en <body>: así heredan los tokens,
  la letra y el tema sin repetirlos (DEC-52). Fuera del panel (pruebas) se usa <body>.
*/
const noSubscribe = () => () => undefined;
const findRoot = () => document.querySelector<HTMLElement>(".admin-root") ?? document.body;
export function usePanelContainer(): HTMLElement | undefined {
  return React.useSyncExternalStore(noSubscribe, findRoot, () => undefined);
}
