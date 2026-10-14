export type AppInput = Record<string, unknown>;
export type AppResult = {
  title: string;
  summary: { label: string; value: string }[];
  sections?: { title: string; text?: string; columns?: string[]; rows?: string[][] }[];
  warnings?: string[];
};
export type AppContext = { expedienteId?: string; inmuebleId?: string; clienteId?: string };
export type AppEditorProps = {
  slug: string; input: AppInput; onChange: (input: AppInput) => void;
  onResult: (result: AppResult) => void; context: AppContext;
  onBusyChange?: (busy: boolean) => void;
};
export type AppRun = { id: string; slug: string; title: string; input: AppInput; result: AppResult | null; context: AppContext; version: number; updatedAt: string };
