import type { LetterheadAssets } from '../letterhead';

export type ReportTable = {
  columns: {
    label: string;
    weight?: number;
    align?: "left" | "right";
    numeric?: boolean;
  }[];
  rows: string[][];
};
type ReportSection = {
  title: string;
  lines?: string[];
  table?: ReportTable;
  links?: { label: string; url: string }[];
  newPage?: boolean;
};
export type ReportOverview = {
  primary: { label: string; value: string; note: string };
  metrics: { label: string; value: string }[];
  pending: string[];
  balance?: {
    principal: number;
    actual: { month: number; balance: number }[];
    baseline: { month: number; balance: number }[];
  };
  breakdown: { label: string; amount: number }[];
};
export type FinancialReport = {
  title: string;
  subtitle?: string;
  issuedAt?: string;
  overview?: ReportOverview;
  sections: ReportSection[];
  appendix?: { title: string; note: string; table: ReportTable };
};
export type ReportAssets = LetterheadAssets & {
  regular: Uint8Array;
  bold: Uint8Array;
  mono: Uint8Array;
};
