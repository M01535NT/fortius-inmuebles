import type { Documento } from "./modelo";
import { planDocumento } from "./plan";
import { intermediacionDocumento } from "./intermediacion";

/*
  Formatos que ya siguen el diseño de su plantilla. Se agregan uno por uno; los demás
  conservan su PDF anterior y la copia en Word genérica hasta reproducirse.
*/
export const DOCUMENTOS: Partial<Record<string, (data: Record<string, unknown>) => Documento>> = {
  "09": intermediacionDocumento,
  "10": planDocumento,
};
export const hasDocumento = (id: string) => !!DOCUMENTOS[id];
