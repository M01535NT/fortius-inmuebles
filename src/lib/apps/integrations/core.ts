import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { ApiError } from '@/lib/backend/http';

export const integrationSlug = z.enum(['ocr','consulta-documental','rutas','firmas']);
export type IntegrationSlug = z.infer<typeof integrationSlug>;
export const integrationContext = z.object({ expedienteId:z.uuid().optional(), inmuebleId:z.string().min(1).max(160).optional(), clienteId:z.string().min(1).max(160).optional() }).strict();
const coordinate = z.object({label:z.string().min(1).max(120),latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180),appointment:z.string().max(80).optional()}).strict();
export const routeInput=z.object({stops:z.array(coordinate).min(2).max(10),optimize:z.boolean().default(false)}).strict();
export const fileInput=z.object({fileName:z.string().min(1).max(160),mimeType:z.enum(['application/pdf','image/jpeg','image/png']),base64:z.string().min(4).max(27962028).optional(),storagePath:z.string().regex(/^[a-f0-9-]+\/[a-f0-9-]+\.(pdf|jpg|png)$/).optional()}).strict().refine(v=>Boolean(v.base64)!==Boolean(v.storagePath),'Proporciona un archivo o una carga privada');
const area=z.object({x:z.number().min(0),y:z.number().min(0),w:z.number().positive(),h:z.number().positive(),page:z.number().int().min(1).max(100)}).strict();
export const signatureInput=z.discriminatedUnion('action',[
 z.object({action:z.literal('template'),name:z.string().min(1).max(160),base64:z.string().min(4).max(27962028).optional(),storagePath:z.string().regex(/^[a-f0-9-]+\/[a-f0-9-]+\.pdf$/).optional(),fields:z.array(z.object({name:z.string().min(1).max(100),type:z.enum(['signature','text','date']),role:z.string().min(1).max(80),required:z.boolean().default(true),areas:z.array(area).min(1).max(100)}).strict()).min(1).max(100)}).strict(),
 z.object({action:z.literal('send'),templateId:z.number().int().positive(),sendEmail:z.literal(true),signers:z.array(z.object({name:z.string().min(1).max(160),email:z.email().max(254),role:z.string().min(1).max(80),fields:z.array(z.object({name:z.string().min(1).max(100),defaultValue:z.string().max(4000),required:z.boolean().optional()}).strict()).max(100).optional()}).strict()).min(1).max(10)}).strict(),
 z.object({action:z.literal('status'),jobId:z.uuid()}).strict(),
]).refine(v=>v.action!=='template'||Boolean(v.base64)!==Boolean(v.storagePath),'Proporciona un PDF o una carga privada');
export const questionInput=z.object({question:z.string().trim().min(3).max(2000)}).strict();
export type IntegrationConfig={budgetCents:number;fixedCents:number;reserveCents:number;fx:number;tax:number;unitUsd:number;priceDate:string};
function required(env:Record<string,string|undefined>,key:string){const val=env[key];if(!val)throw new ApiError(503,`Integración pendiente de configuración: ${key}`);return val;}
function number(env:Record<string,string|undefined>,key:string,min=0,max=1e6){const val=Number(required(env,key));if(!Number.isFinite(val)||val<min||val>max)throw new ApiError(503,`Configuración inválida: ${key}`);return val;}
export function readIntegrationConfig(slug:IntegrationSlug,env:Record<string,string|undefined>=process.env):IntegrationConfig{
 if(env.FORTIUS_APPS_ENABLED!=='true')throw new ApiError(503,'Las integraciones externas todavía no están activadas');
 const priceDate=required(env,'FORTIUS_APPS_PRICE_VERIFIED_AT'); if(!/^\d{4}-\d{2}-\d{2}$/.test(priceDate))throw new ApiError(503,'Falta fecha válida de verificación de tarifas');
 const unitKeys={ocr:'FORTIUS_APPS_OCR_PAGE_USD','consulta-documental':'FORTIUS_APPS_AI_REQUEST_MAX_USD',rutas:'FORTIUS_APPS_ROUTES_USD',firmas:'FORTIUS_APPS_SIGNATURE_MAX_USD'};
 const credentialKeys={ocr:['GOOGLE_DOCUMENT_AI_PROJECT','GOOGLE_DOCUMENT_AI_LOCATION','GOOGLE_DOCUMENT_AI_PROCESSOR','GOOGLE_SERVICE_ACCOUNT_EMAIL','GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY'],'consulta-documental':['OPENAI_API_KEY'],rutas:['GOOGLE_ROUTES_API_KEY'],firmas:['DOCUSEAL_API_KEY','DOCUSEAL_WEBHOOK_SECRET','DOCUSEAL_ARTIFACT_HOSTS']};
 for(const key of credentialKeys[slug])required(env,key);
 return {budgetCents:Math.floor(number(env,'FORTIUS_APPS_BUDGET_MXN',1,2000)*100),fixedCents:Math.ceil(number(env,'FORTIUS_APPS_FIXED_MONTHLY_MXN',0,2000)*100),reserveCents:Math.ceil(number(env,'FORTIUS_APPS_RESERVE_MXN',0,2000)*100),fx:number(env,'FORTIUS_APPS_USD_MXN',0.001,1000),tax:number(env,'FORTIUS_APPS_TAX_RATE',0,1),unitUsd:number(env,unitKeys[slug],0.000001,1000),priceDate};
}
export function maximumCostCents(config:IntegrationConfig,units:number){return new Decimal(config.unitUsd).mul(units).mul(config.fx).mul(new Decimal(1).plus(config.tax)).mul(100).ceil().toNumber();}
export function verifyWebhook(raw:Uint8Array,header:string|null,secret:string,now=Date.now()){
 const match=/^(\d{10})\.([a-f0-9]{64})$/i.exec(header??''); if(!match||Math.abs(now/1000-Number(match[1]))>300)return false;
 const expected=createHmac('sha256',secret).update(`${match[1]}.`).update(raw).digest();const actual=Buffer.from(match[2],'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected);
}
export function validateProviderUrl(raw:string,hosts:string[]){
 let url:URL;try{url=new URL(raw);}catch{throw new ApiError(502,'Dirección del proveedor inválida');}
 if(url.protocol!=='https:'||url.username||url.password||url.port||!hosts.includes(url.hostname)||/^(localhost|\d+\.\d+\.\d+\.\d+)$/.test(url.hostname)||url.hostname.includes(':'))throw new ApiError(502,'Dirección del proveedor no autorizada');return url;
}
export type SourcePage={id:string;file_name:string;version:number;page:number;text:string;job_id?:string};
export const answerSchema=z.object({answer:z.string().max(12000).optional(),citations:z.array(z.object({id:z.string(),quote:z.string().min(1).max(800)}).strict()).max(12)}).strict();
export function validateCitations(answer:z.infer<typeof answerSchema>,pages:SourcePage[]){
 if(!answer.citations.length)throw new ApiError(422,'No se encontró evidencia suficiente para responder con citas verificables');
 return answer.citations.map(citation=>{const page=pages.find(p=>p.id===citation.id&&p.text.includes(citation.quote));if(!page)throw new ApiError(422,'La respuesta no contiene citas verificables; consulta el documento original');return {...page,quote:citation.quote};});
}
