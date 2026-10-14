import { apiResponse } from '@/lib/backend/http';
import { downloadIntegrationArtifact } from '@/lib/apps/integrations/evidence';
export async function GET(_request:Request,{params}:{params:Promise<{id:string;artifactId:string}>}){let response:Response|undefined;const failure=await apiResponse(async()=>{const p=await params;response=await downloadIntegrationArtifact(p.id,p.artifactId);return {ok:true};});return response??failure;}
