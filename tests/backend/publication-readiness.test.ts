import {beforeEach,expect,it,vi} from 'vitest';
import {ApiError} from '@/lib/backend/http';
const {requireStaff}=vi.hoisted(()=>({requireStaff:vi.fn()}));
vi.mock('@/lib/backend/auth',()=>({requireStaff}));
import {GET} from '@/app/api/admin/propiedades/[slug]/publicacion/route';
import {emptyWorkflow} from '@/lib/formatos/operation-workflow';
const context={params:Promise.resolve({slug:'house-a'})};
const request=()=>new Request('https://panel.test/api/admin/propiedades/house-a/publicacion');
function fixture(expedientes:unknown[],publicada=false){
 const query={select:vi.fn(),eq:vi.fn(),is:vi.fn(),maybeSingle:vi.fn().mockResolvedValue({data:{data:{tipo:'casa',operacion:'venta',publicada}},error:null}),then:(resolve:(v:unknown)=>void)=>Promise.resolve(resolve({data:expedientes,error:null}))};
 for(const fn of [query.select,query.eq,query.is])fn.mockReturnValue(query);requireStaff.mockResolvedValue({client:{from:()=>query}});
}
beforeEach(()=>{requireStaff.mockReset();});
it('keeps publication controls private behind the existing staff session',async()=>{requireStaff.mockRejectedValue(new ApiError(401,'Sesión requerida'));expect((await GET(request(),context)).status).toBe(401);});
it('requires a linked capture operation for a new residential sale publication',async()=>{fixture([]);expect(await(await GET(request(),context)).json()).toMatchObject({permitida:false});});
it('does not withdraw a persisted historical publication just for reading its readiness',async()=>{fixture([],true);expect(await(await GET(request(),context)).json()).toMatchObject({permitida:true,publicacionAnterior:true});});
it('returns readiness without copying private support text into the metadata response',async()=>{
 const flow=emptyWorkflow();for(const k of ['entrevista','titularidad','factibilidad','valor','precio','intermediacion','levantamiento','plan','publicacion'] as const)flow.requisitos[k]={estado:'revisado',soporte:'PRIVADO documento ficticio v1',...(k==='factibilidad'?{vigenteHasta:'2030-12-31'}:{})};
 fixture([{id:'e1',etapa:'comercializacion',flujo:flow}]);const result=await(await GET(request(),context)).json();expect(result).toMatchObject({permitida:true,expedienteId:'e1',faltantes:[]});expect(JSON.stringify(result)).not.toContain('PRIVADO');
});
it('does not allow publication with received or expired feasibility',async()=>{
 const flow=emptyWorkflow();for(const k of ['entrevista','titularidad','factibilidad','valor','precio','intermediacion','levantamiento','plan','publicacion'] as const)flow.requisitos[k]={estado:'revisado',soporte:'Documento ficticio v1',...(k==='factibilidad'?{vigenteHasta:'2020-01-01'}:{})};
 fixture([{id:'e1',etapa:'comercializacion',flujo:flow}]);expect(await(await GET(request(),context)).json()).toMatchObject({permitida:false,faltantes:['Factibilidad documentada y condiciones resueltas']});
 flow.requisitos.factibilidad={estado:'recibido',soporte:'Documento ficticio v1',vigenteHasta:'2030-12-31'};fixture([{id:'e1',etapa:'comercializacion',flujo:flow}]);expect(await(await GET(request(),context)).json()).toMatchObject({permitida:false});
});
