// Synthetic records shared by responsive regression tests and the local visual preview.
export const longLeadName = "Cliente de prueba con nombre y apellidos extensos para comprobar la vista móvil";
export const longPropertyTitle = "Casa de prueba con terraza y espacios amplios para familias en Playas de Tijuana";
export function mobilePanelData(day = "2026-09-22"): Record<string, Record<string, unknown>[]> {
  const timestamp = day + "T19:00:00Z";
  return {
    propiedades: [{
      slug: "audit-casa", codigo: "MNT-PRUEBA-001", titulo: longPropertyTitle,
      tipo: "casa", operacion: "venta", precio: { modalidad: "publico", monto: 12850000, moneda: "MXN" },
      zona: "Playas de Tijuana", direccionAproximada: "Ubicación ficticia", descripcion: ["Inmueble ficticio para pruebas."],
      ficha: { terrenoM2: 320, construccionM2: 385, recamaras: 4, banos: 4.5, estacionamientos: 2, antiguedad: "6 años" },
      amenidades: ["Terraza"], galeria: [{ src: "/hero/casa-playa.webp", alt: "Foto demo" }],
      asesorId: "asesor-prueba", creditoDisponible: true, puntosDeInteres: [], destacada: true,
      estado: "disponible", publicadaEl: day, demo: true, publicada: true, documentos: [],
    }],
    asesores: [{ id: "asesor-prueba", nombre: "Asesor de prueba", cargo: "Asesor", iniciales: "AP", activo: true }],
    leads: Array.from({ length: 7 }, (_, i) => ({
      id: "lead-prueba-" + i, nombre: i ? "Cliente ficticio " + i : longLeadName,
      telefono: "0000000000", origen: "manual", estado: i ? "nuevo" : "en-evaluacion",
      creadoEl: timestamp, notas: [],
    })),
    clientes: [{ id: "cliente-prueba", nombre: longLeadName, telefono: "0000000000", email: "cliente@example.invalid", tipo: "comprador", creadoEl: timestamp, actualizadoEl: timestamp }],
    tareas: [{ id: "tarea-prueba", titulo: "Revisar documentos del inmueble y confirmar siguientes pasos con el propietario", descripcion: "Tarea ficticia para comprobar la interfaz.", categoria: "documentacion", estado: "en-curso", prioridad: "alta", vence: day, asesorId: "asesor-prueba", pasos: [{ id: "paso-1", texto: "Confirmar expediente", hecho: false }], historial: [] }],
    eventos: Array.from({ length: 8 }, (_, i) => ({
      id: "evento-" + i, titulo: "Visita de prueba al inmueble con un título largo para comprobar el calendario " + i,
      fecha: day, hora: "23:59", tipo: "visita",
    })),
    posts: [{ id: "post-prueba", titulo: "Artículo de ejemplo para probar el panel", slug: "prueba", estado: "borrador", contenido: "Texto ficticio", resumen: "Resumen", actualizadoEl: timestamp }],
    notas: [{ id: "nota-prueba", titulo: "Seguimiento ficticio de la operación", texto: "Texto de prueba", actualizadoEl: timestamp }],
    archivos: [],
  };
}

export function panelRecords(data: ReturnType<typeof mobilePanelData>, name: string) {
  return (data[name] ?? []).map((row, index) => ({
    id: row.id ?? row.slug ?? String(index), version: 1, data: row,
    createdAt: "2026-09-22T19:00:00Z", updatedAt: "2026-09-22T19:00:00Z",
  }));
}
