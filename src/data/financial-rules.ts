// Published values are preserved, including discontinuities. See docs/financial-method.md.
export const FINANCIAL_VERSION = "2026.10.04";
export const FINANCIAL_REVIEW_DATE = "2026-10-04";
export const MUNICIPALITIES = {
  tijuana: "Tijuana",
  rosarito: "Playas de Rosarito",
  tecate: "Tecate",
  ensenada: "Ensenada",
} as const;
export type Municipality = keyof typeof MUNICIPALITIES;
type Bracket = readonly [
  lower: string,
  upper: string | null,
  fixed: string,
  percent: string,
];
const congress =
  "https://www.congresobc.gob.mx/Documentos/ProcesoParlamentario/Leyes/TOMO_II/";
export const ACQUISITION_RULES: Record<
  Municipality,
  {
    url: string;
    article: string;
    unit: "MXN" | "UMA";
    surcharge: string;
    brackets: Bracket[];
  }
> = {
  tijuana: {
    url: congress + "20251230_LEYINGRESOTIJUANA2026-3.PDF",
    article: "Artículo 8",
    unit: "UMA",
    surcharge: "0",
    brackets: [
      ["0.01", "7070.89", "0", "1.500"],
      ["7070.90", "14141.78", "123.74", "1.853"],
      ["14141.79", "21212.66", "282.83", "2.206"],
      ["21212.67", "28283.55", "477.28", "2.559"],
      ["28283.56", "35354.43", "707.08", "2.912"],
      ["35354.44", "42425.32", "972.24", "3.265"],
      ["42425.33", "49496.20", "1272.75", "3.318"],
      ["49496.20", "56567.09", "1608.62", "3.971"],
      ["56567.10", "63637.98", "1979.84", "4.324"],
      ["63637.99", null, "2386.42", "4.677"],
    ],
  },
  rosarito: {
    url: congress + "20251230_LEYINGRESOROSARITO2026.PDF",
    article: "Artículo 9",
    unit: "MXN",
    surcharge: "0",
    brackets: [
      ["0.01", "500000", "0", "1.50"],
      ["500000.01", "1000000", "7500", "2.00"],
      ["1000000.01", "1600000", "17500", "2.50"],
      ["1600000.01", "2600000", "32500", "3.00"],
      ["2600000.01", "3800000", "62500", "3.50"],
      ["3800000.01", "5200000", "104500", "4.00"],
      ["5200000.01", "6800000", "160500", "4.50"],
      ["6800000.01", null, "232500", "5.00"],
    ],
  },
  tecate: {
    url: congress + "20251230_LEYINGRESOTECATE2026.PDF",
    article: "Artículo 18",
    unit: "MXN",
    surcharge: "0",
    brackets: [
      ["0.01", "1000000", "0", "2.00"],
      ["1000000.01", "1250000", "20000", "2.50"],
      ["1250000.01", "1500000", "26250", "3.00"],
      ["1500000.01", "2000000", "33750", "3.50"],
      ["2000000.01", "3000000", "51250", "4.00"],
      ["3000000.01", "5000000", "91250", "4.50"],
      ["5000000.01", null, "160500", "5.00"],
    ],
  },
  ensenada: {
    url: congress + "20251230_LEYINGRESOENSENADA2026.PDF",
    article: "Artículo 4",
    unit: "MXN",
    surcharge: "0.25",
    brackets: [
      ["0.01", "500000", "0", "1.25"],
      ["500000.01", "1000000", "6250", "1.75"],
      ["1000000.01", "1600000", "15000", "2.25"],
      ["1600000.01", "2600000", "28500", "2.75"],
      ["2600000.01", "3800000", "56000", "3.25"],
      ["3800000.01", "5000000", "95000", "3.75"],
      ["5000000.01", "6800000", "140000", "4.25"],
      ["6800000.01", "8600000", "216500", "4.75"],
      ["8600000.01", "10600000", "302000", "5.25"],
      ["10600000.01", null, "407000", "5.75"],
    ],
  },
};
export const FINANCIAL_SOURCES = {
  registration: {
    url: congress + "20260618_LEYINGRESOSESTADO2026.PDF",
    article: "Artículos 12 y 13",
    validFrom: "2026-06-18",
    ownership: "12398.60",
    mortgage: "11877.34",
    analysis: "395.02",
    notice: "295.30",
  },
  fiscalBase: {
    url: congress + "20241104_LEYHAMUN.PDF",
    article: "Artículo 75 BIS B",
  },
  uma2026: {
    url: "https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2026/uma/uma2026.pdf",
    daily: "117.31",
  },
  uma2025: {
    url: "https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2025/uma/uma2025.pdf",
    daily: "113.14",
  },
  isr: {
    url: "https://www.sat.gob.mx/minisitio/NormatividadRMFyRGCE/documentos2026/rmf/anexos/Anexo-8-RMF-2026_DOF-28122025.pdf",
    article: "Anexo 8, A.I",
  },
  incomeLaw: {
    url: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LISR.pdf",
    article: "Artículos 121, 124, 126 y 127",
  },
  cat: { url: "https://www.banxico.org.mx/CAT/" },
};
export const SELLER_ISR_BRACKETS: Bracket[] = [
  ["0.01", "10135.11", "0", "1.92"],
  ["10135.12", "86022.11", "194.59", "6.40"],
  ["86022.12", "151176.19", "5051.37", "10.88"],
  ["151176.20", "175735.66", "12140.13", "16.00"],
  ["175735.67", "210403.69", "16069.64", "17.92"],
  ["210403.70", "424353.97", "22282.14", "21.36"],
  ["424353.98", "668840.14", "67981.92", "23.52"],
  ["668840.15", "1276925.98", "125485.07", "30.00"],
  ["1276925.99", "1702567.97", "307910.81", "32.00"],
  ["1702567.98", "5107703.92", "444116.23", "34.00"],
  ["5107703.93", null, "1601862.46", "35.00"],
];
