import { apiResponse } from '@/lib/backend/http';
import { getIntegrationJob } from '@/lib/apps/integrations/server';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){return apiResponse(()=>params.then(({id})=>getIntegrationJob(id)));}
