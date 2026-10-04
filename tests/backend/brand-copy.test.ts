import { expect, test } from "vitest";
import { brandCopy } from "@/lib/brand-copy";

test.each([
  ["[Guía de Mint](https://example.com/Mint/guia)", "[Guía de Fortius](https://example.com/Mint/guia)"],
  ["Mint: https://example.com/?marca=MNT", "Fortius: https://example.com/?marca=MNT"],
  ["Escribe a contacto@Mint.example para contactar a Mint", "Escribe a contacto@Mint.example para contactar a Fortius"],
  ["[MNT](/Mint/guia) y [Mint](../MNT/guia)", "[Fortius](/Mint/guia) y [Fortius](../MNT/guia)"],
  ["Mint: www.Mint.example, /Mint/guia y mailto:contacto@MNT.example", "Fortius: www.Mint.example, /Mint/guia y mailto:contacto@MNT.example"],
  ["MNT-001 / Mint_001. Contrato de Mint.", "MNT-001 / Mint_001. Contrato de Fortius."],
])("refreshes prose while preserving destinations: %s", (source, expected) => {
  expect(brandCopy(source)).toBe(expected);
});
