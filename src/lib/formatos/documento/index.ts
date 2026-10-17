import type { Documento, DocumentoContexto } from "./modelo";
import { planDocumento } from "./plan";
import { intermediacionDocumento } from "./intermediacion";
import { entrevistaDocumento } from "./entrevista";
import { levantamientoDocumento } from "./levantamiento";
import { opinionJuridicaDocumento } from "./opinion-juridica";
import { revisionJuridicaDocumento } from "./revision-juridica";
import { netoDocumento } from "./neto";
import { valorDocumento } from "./valor";
import { compradorDocumento, visitaDocumento } from "./comprador";
import { cierreDocumento, entregaDocumento, reciboDocumento } from "./cierre";
import { LEVANTAMIENTO_TITLES, type LevantamientoId } from "../levantamiento";

/*
  Formatos que ya siguen el diseño de su plantilla. Se agregan uno por uno; los demás
  conservan su PDF anterior y la copia en Word genérica hasta reproducirse.
*/
export const DOCUMENTOS: Partial<Record<string, (data: Record<string, unknown>, contexto?: DocumentoContexto) => Documento>> = {
  "02": entrevistaDocumento,
  ...Object.fromEntries((Object.keys(LEVANTAMIENTO_TITLES) as LevantamientoId[]).map(id => [id, (data: Record<string, unknown>, contexto?: DocumentoContexto) => levantamientoDocumento(id, data, contexto)])),
  "05": revisionJuridicaDocumento,
  "06": opinionJuridicaDocumento,
  "07": valorDocumento,
  "08": netoDocumento,
  "09": intermediacionDocumento,
  "10": planDocumento,
  "12": compradorDocumento,
  "13": visitaDocumento,
  "16": entregaDocumento,
  "17": cierreDocumento,
  "18": reciboDocumento,
};
export const hasDocumento = (id: string) => !!DOCUMENTOS[id];
