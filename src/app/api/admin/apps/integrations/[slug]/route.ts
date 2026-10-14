import { z } from 'zod';
import { apiResponse,assertSameOrigin,readJson } from '@/lib/backend/http';
import { integrationContext } from '@/lib/apps/integrations/core';
import { runIntegration } from '@/lib/apps/integrations/server';
export const runtime='nodejs';
export const maxDuration=300;
export async function POST(request:Request,{params}:{params:Promise<{slug:string}>}){return apiResponse(async()=>{assertSameOrigin(request);const body=z.object({input:z.record(z.string(),z.unknown()),context:integrationContext,idempotencyKey:z.uuid()}).strict().parse(await readJson(request,29*1024*1024));return runIntegration((await params).slug,body.input,body.context,body.idempotencyKey);});}
