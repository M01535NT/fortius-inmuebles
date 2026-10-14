import { apiResponse,readBody } from '@/lib/backend/http';
import { handleSignatureWebhook } from '@/lib/apps/integrations/evidence';
export const runtime='nodejs';
export const maxDuration=300;
export async function POST(request:Request){return apiResponse(async()=>handleSignatureWebhook(await readBody(request,1024*1024),request.headers.get('x-docuseal-signature')));}
