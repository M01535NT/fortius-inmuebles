import { apiResponse,assertSameOrigin,readJson } from '@/lib/backend/http';
import { getOcrPages,correctOcrPages } from '@/lib/apps/integrations/evidence';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){return apiResponse(()=>params.then(({id})=>getOcrPages(id,Number(new URL(request.url).searchParams.get('offset')??0))));}
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){return apiResponse(async()=>{assertSameOrigin(request);return correctOcrPages((await params).id,await readJson(request,4*1024*1024));});}
