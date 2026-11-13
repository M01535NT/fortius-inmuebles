import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { ApiError, apiResponse, assertSameOrigin, databaseError, readJson } from "@/lib/backend/http";
import { putRecord } from "@/lib/backend/repository";
import { operationalDate } from "@/lib/admin/operational-date";
import { addDays } from "@/lib/admin/today";
import { inheritedExceptions, isOwnerRoute, type OperationWorkflow } from "@/lib/formatos/operation-workflow";

/*
  COR-24 (12/11/2026): alta del inventario que un asesor trae con contrato ya firmado. Solo el
  director. Crea el propietario, la operación ligada al inmueble con la marca «heredado», la
  entrevista, el levantamiento y el plan cubiertos por excepción (COR-20), y una tarea para
  regularizar; la deja en verificación. Titularidad, factibilidad, valor, precio, contrato y
  publicación se revisan después en la operación, como en cualquier captación (decisión del
  titular, 12/11/2026). La base vuelve a validar cada paso.
*/
const input = z.object({
  propiedadSlug: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/),
  propietario: z.object({ nombre: z.string().trim().min(3).max(160), telefono: z.string().trim().max(40).refine(v => v.replace(/\D/g, "").length >= 7, "Escribe el teléfono del propietario") }).strict(),
  desde: z.iso.date(),
  motivo: z.string().trim().min(10).max(1000),
}).strict();

const FIELDS = "id,cliente_id,asesor_id,propiedad_slug,folio,operacion,unidad,etapa,fecha_objetivo,checklist,flujo,version,created_at,updated_at";

export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { client, user } = await requireStaff();
    if (user.role !== "admin") throw new ApiError(403, "El inventario heredado lo da de alta el director");
    const data = input.parse(await readJson(request));
    const today = operationalDate();
    if (data.desde > today) throw new ApiError(400, "La fecha del contrato no puede ser futura");

    const property = await client.from("fortius_inmuebles_records").select("data").eq("collection", "propiedades").eq("id", data.propiedadSlug).maybeSingle();
    if (property.error) databaseError(property.error);
    const listing = property.data?.data as { titulo?: string; operacion?: string; asesorId?: string } | undefined;
    if (!listing) throw new ApiError(404, "Inmueble no encontrado");
    if (!listing.asesorId) throw new ApiError(400, "Asigna el asesor del inmueble antes de darlo de alta");
    const operacion = listing.operacion === "renta" ? "renta" : "venta";
    const ruta: OperationWorkflow["ruta"] = operacion === "renta" ? "arrendador" : "captacion";

    const open = await client.from("fortius_inmuebles_expedientes").select("id,flujo").eq("propiedad_slug", data.propiedadSlug).is("deleted_at", null);
    if (open.error) databaseError(open.error);
    if ((open.data ?? []).some(e => { const f = e.flujo as OperationWorkflow | null; return !!f && isOwnerRoute(f.ruta) && f.estado !== "descartada"; }))
      throw new ApiError(409, "Este inmueble ya tiene una operación del propietario");

    const clienteId = `cli-${crypto.randomUUID()}`, taskId = `tarea-${crypto.randomUUID()}`;
    const cliente = {
      id: clienteId, nombre: data.propietario.nombre, telefono: data.propietario.telefono, tipo: operacion === "renta" ? "arrendador" : "propietario",
      asesorId: listing.asesorId, propiedadSlug: data.propiedadSlug, notas: `Inventario heredado: contrato desde el ${data.desde}.`, creadoEl: today, actualizadoEl: today,
    };
    const requisitos = Object.fromEntries(inheritedExceptions(ruta).map(key => [key, { estado: "pendiente", soporte: "", excepcion: { motivo: data.motivo } }]));
    const flujo = { version: 1, ruta, estado: "activa", motivo: "", requisitos, heredado: { desde: data.desde } };
    // Avanzar pide una próxima tarea con fecha del asesor: la de regularizar.
    const tarea = {
      id: taskId, titulo: "Regularizar inventario heredado", categoria: "documentacion", estado: "pendiente", prioridad: "alta", vence: addDays(today, 7),
      descripcion: "Subir el contrato firmado y registrar la firma; que el director revise titularidad, factibilidad, valor y precio antes de publicar.",
      clienteId, asesorId: listing.asesorId, propiedadSlug: data.propiedadSlug, pasos: [], creadoEl: today, actualizadoEl: today,
    };

    // B10 / C-16: las cuatro escrituras en una sola transacción de la base; si una falla, no queda nada suelto.
    const atomica = await client.rpc("fortius_inmuebles_alta_heredado", { p_slug: data.propiedadSlug, p_cliente_id: clienteId, p_cliente: cliente, p_operacion: operacion, p_flujo: flujo, p_tarea_id: taskId, p_tarea: tarea });
    if (!atomica.error) return { expediente: atomica.data };
    if (atomica.error.code === "PT409") throw new ApiError(409, "Este inmueble ya tiene una operación del propietario");
    if (atomica.error.code !== "PGRST202" && atomica.error.code !== "42883") databaseError(atomica.error);

    // La función todavía no existe en esta base (migración sin aplicar): los pasos de antes.
    await putRecord(client, "clientes", clienteId, { version: null, data: cliente });
    const created = await client.from("fortius_inmuebles_expedientes").insert({ cliente_id: clienteId, asesor_id: listing.asesorId, propiedad_slug: data.propiedadSlug, operacion, unidad: "", flujo }).select(FIELDS).single();
    if (created.error) databaseError(created.error);
    await putRecord(client, "tareas", taskId, { version: null, data: { ...tarea, expedienteId: created.data.id } });
    const advanced = await client.rpc("fortius_inmuebles_update_operation", {
      p_id: created.data.id, p_version: created.data.version, p_stage: "documentacion", p_date: null, p_checklist: created.data.checklist ?? {},
      p_flow: created.data.flujo, p_slug: null, p_property_specified: false,
    });
    if (advanced.error) databaseError(advanced.error);
    return { expediente: advanced.data ?? created.data };
  }, 201);
}
