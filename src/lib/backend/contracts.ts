export const COLLECTIONS = ["propiedades", "asesores", "leads", "clientes", "eventos", "tareas", "notas", "posts", "archivos", "contenido", "config"] as const;
export type CollectionName = (typeof COLLECTIONS)[number];
type StaffRole = "admin" | "editor";
export type StaffUser = { id: string; email: string; role: StaffRole; name?: string; avatar?: string };
export type StoredRecord<T = Record<string, unknown>> = { id: string; data: T; version: number; createdAt: string; updatedAt: string };
export type Cliente = {
  id: string; nombre: string; telefono: string; email?: string;
  tipo: "propietario" | "comprador" | "arrendador" | "arrendatario" | "inversionista" | "otro";
  asesorId?: string; notas: string; creadoEl: string; actualizadoEl: string;
  leadId?: string; convertidoEl?: string; convertidoPor?: string;
  /** Datos para el expediente (CSR-02): se escriben una vez aquí y los formatos de todas sus operaciones los toman. */
  curp?: string; rfc?: string; estadoCivil?: string; fechaNacimiento?: string; domicilio?: string; identificacion?: string;
  perfil?: import("@/lib/lead-profile").LeadProfile;
  zona?: string; tipoPropiedad?: string; propiedadSlug?: string; mensaje?: string;
  leadOriginal?: {
    id: string; creadoEl: string;
    notas: { id: string; texto: string; fecha: string }[];
  };
};
