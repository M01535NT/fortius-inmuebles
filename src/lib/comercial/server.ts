import "server-only";
import { requireStaff } from "@/lib/backend/auth";
import { ApiError,databaseError } from "@/lib/backend/http";
import type { ComercialBookData } from "./types";
export async function requireCommercialAdmin() { const session=await requireStaff();if(session.user.role!=="admin")throw new ApiError(403,"El control comercial requiere acceso de administrador");return session; }
export async function checkCommercialReferences(client:Awaited<ReturnType<typeof requireStaff>>["client"],data:ComercialBookData) {
 const ids=[...new Set(data.oportunidades.map(o=>o.gestion.expediente).filter(Boolean))];
 for(let i=0;i<ids.length;i+=100){const chunk=ids.slice(i,i+100);const r=await client.from("mnt_expedientes").select("id").in("id",chunk);if(r.error)databaseError(r.error);if(r.data?.length!==chunk.length)throw new ApiError(400,"Un expediente vinculado no existe");}
}
