import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError, databaseError } from '@/lib/backend/http';
/** Claims provenance under the caller JWT before any privileged byte access. */
export async function readAppUpload(client:SupabaseClient,service:SupabaseClient,userId:string,storagePath:string,expedienteId?:string):Promise<Blob>{
 if(!storagePath.startsWith(`${userId}/`))throw new ApiError(403,'Carga privada ajena');
 const claim=await client.rpc('fortius_apps_claim_upload',{p_path:storagePath,p_expediente:expedienteId??null});
 if(claim.error)databaseError(claim.error);
 const downloaded=await service.storage.from('fortius-inmuebles-private').download(storagePath);
 if(downloaded.error||!downloaded.data)throw new ApiError(503,'Archivo privado no disponible');
 if(downloaded.data.size>20*1024*1024)throw new ApiError(413,'Máximo 20 MB por archivo');
 return downloaded.data;
}
