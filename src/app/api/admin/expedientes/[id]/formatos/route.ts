import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, databaseError, readJson } from "@/lib/backend/http";
import { draftCreate } from "@/lib/formatos/schemas";
import { prefillFormato } from "@/lib/formatos/intake-prefill";
import type { OperationalInterview } from "@/lib/intake/interview";
import { calcularValor } from "@/lib/formatos/valor";
import { llenarDesdeDatos } from "@/lib/formatos/datos-expediente";
import { leerDatos } from "@/lib/backend/expediente-datos";

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  return apiResponse(async () => {
    const id = z.uuid().parse((await context.params).id);
    const { client } = await requireStaff();
    const parent = await client.from("fortius_inmuebles_expedientes").select("id").eq("id", id).is("deleted_at", null).maybeSingle();
    if (parent.error) databaseError(parent.error);
    if (!parent.data) throw new ApiError(404, "Expediente no encontrado");
    const { data, error } = await client.from("fortius_inmuebles_formato_drafts").select("id,expediente_id,formato_id,data,version,created_at,updated_at").eq("expediente_id", id).order("created_at", { ascending: false });
    if (error) databaseError(error);
    return { documentos: data ?? [] };
  });
}

export async function POST(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = z.uuid().parse((await context.params).id);
    const { client } = await requireStaff();
    const input = draftCreate.parse(await readJson(request));
    if (input.formatoId === "03") throw new ApiError(409, "El formato 03 se trabaja en Control comercial, como cartera global");
    const parent = await client.from("fortius_inmuebles_expedientes").select("id,cliente_id,asesor_id,propiedad_slug,folio,unidad,operacion,flujo").eq("id",id).is("deleted_at",null).maybeSingle();
    if(parent.error)databaseError(parent.error);
    if(!parent.data)throw new ApiError(404,"Expediente no encontrado");
    const exp=parent.data;
    async function record(collection:string,key:string|null) {
      if(!key)return undefined;
      const result=await client.from("fortius_inmuebles_records").select("data").eq("collection",collection).eq("id",key).maybeSingle();
      if(result.error)databaseError(result.error);
      return result.data?.data;
    }
    const [persona,asesor,inmueble,interviews]=await Promise.all([record("clientes",exp.cliente_id),record("asesores",exp.asesor_id),record("propiedades",exp.propiedad_slug),client.from("fortius_inmuebles_interviews").select("id,version,intencion,respuestas").eq("expediente_id",id).eq("estado","completada").order("completed_at",{ascending:false}).limit(1)]);
    if(interviews.error)databaseError(interviews.error);
    const proposed=prefillFormato(input.formatoId,{expediente:exp,persona,asesor,inmueble,entrevista:interviews.data?.[0] as OperationalInterview|undefined});
    // Recibo 18: número automático, folio del expediente y consecutivo de sus recibos (nadie lo inventa).
    if(input.formatoId==="18"){
      const previos=await client.from("fortius_inmuebles_formato_drafts").select("id",{count:"exact",head:true}).eq("expediente_id",id).eq("formato_id","18");
      if(previos.error)databaseError(previos.error);
      proposed.numeroRecibo=`${exp.folio}-R${String((previos.count??0)+1).padStart(2,"0")}`;
    }
    let valorSeed: Record<string,string|number>={};
    if(input.valorReferencia) {
      if(input.formatoId!=="08")throw new ApiError(400,"La referencia 07 se incorpora al formato 08");
      const source=await client.from("fortius_inmuebles_formato_drafts").select("id,expediente_id,formato_id,data,version").eq("id",input.valorReferencia.id).eq("expediente_id",id).maybeSingle();
      if(source.error)databaseError(source.error);
      const opinion=source.data;
      if(!opinion||opinion.expediente_id!==id||opinion.formato_id!=="07"||opinion.version!==input.valorReferencia.version)throw new ApiError(409,"La opinión seleccionada cambió o no pertenece al expediente");
      const value=calcularValor(opinion.data);
      if(value.concluido===null)throw new ApiError(409,"La opinión todavía no tiene valor concluido: completa sus enfoques y pesos");
      valorSeed={referencia07:`Opinión ${opinion.id} · versión ${opinion.version}`,fecha07:opinion.data.fechaValor,precioSugerido07:value.concluido,precioBase:"sugerido07",moneda:"MXN"};
    }
    // Datos del expediente ya confirmados: llenan lo que la propuesta dejó vacío (nunca la reemplazan).
    // Si no se pueden leer, el formato nace igual con su propuesta.
    let confirmados: Awaited<ReturnType<typeof leerDatos>>["datos"]={};
    try{confirmados=(await leerDatos(client,id)).datos;}catch{/* sin datos del expediente */}
    const base={...proposed,...input.data,...valorSeed};
    const seeded=draftCreate.parse({formatoId:input.formatoId,data:{...base,...llenarDesdeDatos(input.formatoId,base,confirmados).patch}});
    const { data, error } = await client.from("fortius_inmuebles_formato_drafts").insert({ expediente_id: id, formato_id: input.formatoId, data: seeded.data }).select("id,expediente_id,formato_id,data,version,created_at,updated_at").single();
    if (error) databaseError(error);
    return { documento: data };
  }, 201);
}
