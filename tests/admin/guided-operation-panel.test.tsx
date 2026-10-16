import { afterEach,expect,it,vi } from 'vitest';
import { cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react';
const {tasks,propertyStore,taskStore}=vi.hoisted(()=>({tasks:[] as Array<Record<string,unknown>>,propertyStore:{load:vi.fn().mockResolvedValue(undefined)},taskStore:{load:vi.fn().mockResolvedValue(undefined),put:vi.fn()}}));
vi.mock('@/lib/admin/store',async original=>({...await original<typeof import('@/lib/admin/store')>(),db:{propiedades:propertyStore,tareas:taskStore},useCollection:(store:object)=>store===taskStore?tasks:[]}));
import {OperationWorkflowPanel} from '@/components/admin/operation-workflow-panel';
import {emptyWorkflow} from '@/lib/formatos/operation-workflow';
const base={id:'80000000-0000-4000-8000-000000000010',asesor_id:'a1',cliente_id:'c1',version:1,etapa:'captacion' as const,propiedad_slug:null,flujo:emptyWorkflow()};
afterEach(()=>{cleanup();vi.unstubAllGlobals();tasks.length=0;});
it('received paperwork and absent action do not enable stage advancement',()=>{
 vi.stubGlobal('fetch',async()=>Response.json({expedientes:[]}));
 render(<OperationWorkflowPanel expediente={{...base,flujo:{...base.flujo,requisitos:{entrevista:{estado:'recibido',soporte:'Referencia ficticia v1'},titularidad:{estado:'recibido',soporte:'Referencia ficticia v1'}}}}} onSaved={vi.fn()} onDirtyChange={vi.fn()}/>);
 expect((screen.getByRole('button',{name:'Avanzar a Verificación y precio'}) as HTMLButtonElement).disabled).toBe(true);
 expect(screen.getByText('Agendar una próxima tarea con fecha y responsable.')).toBeTruthy();
});
it('retains evidence and reports a failed save without announcing an advance',async()=>{
 const saved=vi.fn(),dirty=vi.fn();vi.stubGlobal('fetch',async(_url:string,init?:RequestInit)=>init?.method==='PUT'?Response.json({error:'Servicio no disponible'},{status:503}):Response.json({expedientes:[]}));
 render(<OperationWorkflowPanel expediente={base} onSaved={saved} onDirtyChange={dirty}/>);
 fireEvent.click(screen.getByText('Requisitos para avanzar'));
 const field=screen.getByLabelText('Soporte de Entrevista y objetivo del propietario');
 fireEvent.change(field,{target:{value:'Referencia ficticia v1 conservada'}});
 fireEvent.click(screen.getByRole('button',{name:'Guardar guía'}));
 expect((await screen.findByRole('alert')).textContent).toContain('Servicio no disponible');
 expect((field as HTMLTextAreaElement).value).toBe('Referencia ficticia v1 conservada');expect(saved).not.toHaveBeenCalled();expect(dirty).toHaveBeenCalledWith(true);
});
it('a buyer sees profile and capacity instead of seller title and intermediation',()=>{
 vi.stubGlobal('fetch',async()=>Response.json({expedientes:[]}));
 render(<OperationWorkflowPanel expediente={{...base,flujo:emptyWorkflow('compra')}} onSaved={vi.fn()} onDirtyChange={vi.fn()}/>);
 expect(screen.getByLabelText('Estado de Perfil, necesidades y participantes del encargo')).toBeTruthy();
 expect(screen.queryByLabelText('Estado de Presupuesto, recursos y crédito comprobados')).toBeNull();
 expect(screen.queryByLabelText('Estado de Identidad, representación y antecedente de propiedad')).toBeNull();
});

it('creates the next action in place while preserving unsaved review evidence',async()=>{
 taskStore.put.mockImplementation(async(value:Record<string,unknown>)=>{tasks.push(value);return value;});
 vi.stubGlobal('fetch',async()=>Response.json({expedientes:[]}));
 render(<OperationWorkflowPanel expediente={base} onSaved={vi.fn()} onDirtyChange={vi.fn()}/>);
 fireEvent.click(screen.getByText('Requisitos para avanzar'));
 const evidence=screen.getByLabelText('Soporte de Entrevista y objetivo del propietario');
 fireEvent.change(evidence,{target:{value:'Evidencia ficticia sin guardar'}});
 fireEvent.change(screen.getByLabelText('Próxima tarea'),{target:{value:'Solicitar documentación'}});
 fireEvent.change(screen.getByLabelText('Fecha de la próxima tarea'),{target:{value:'2030-12-31'}});
 fireEvent.click(screen.getByRole('button',{name:'Agendar próxima acción'}));
 expect(await screen.findByRole('link',{name:'Solicitar documentación'})).toBeTruthy();
 expect((evidence as HTMLTextAreaElement).value).toBe('Evidencia ficticia sin guardar');
 expect(tasks[0]).toMatchObject({expedienteId:base.id,clienteId:'c1',asesorId:'a1',vence:'2030-12-31',estado:'pendiente'});
});
it('shows the captured house and does not ask to assign inventory during early captación',()=>{
 vi.stubGlobal('fetch',async()=>Response.json({expedientes:[]}));
 render(<OperationWorkflowPanel expediente={{...base,etapa:'documentacion'}} onSaved={vi.fn()} onDirtyChange={vi.fn()}/>);
 expect(screen.getByText(/se vincula explícitamente un inmueble existente/)).toBeTruthy();
 expect(screen.getByText('Vincular un inmueble que ya existe')).toBeTruthy();
 expect(screen.getByRole('combobox',{name:'Inmueble de esta operación'}).closest('details')?.open).toBe(false);
});
it('asks to capture the house before negotiation when none exists',()=>{
 vi.stubGlobal('fetch',async()=>Response.json({expedientes:[]}));
 render(<OperationWorkflowPanel expediente={{...base,etapa:'comercializacion'}} onSaved={vi.fn()} onDirtyChange={vi.fn()}/>);
 expect(screen.getByText('Captura los datos del inmueble.')).toBeTruthy();
});

it('offers only the opposite rent route and labels its participant correctly',async()=>{
 const peers=[
 {id:'peer-tenant',folio:'RENTA-TENANT',operacion:'renta',cliente_id:'c2',propiedad_slug:'p1',flujo:emptyWorkflow('arrendatario')},
 {id:'peer-sale',folio:'VENTA-BUYER',operacion:'venta',cliente_id:'c3',propiedad_slug:'p1',flujo:emptyWorkflow('compra')},
 {id:'peer-invest',folio:'INVERSION',operacion:'inversion',cliente_id:'c4',propiedad_slug:'p1',flujo:emptyWorkflow('inversion')},
 {id:'peer-owner',folio:'RENTA-OWNER',operacion:'renta',cliente_id:'c5',propiedad_slug:'p1',flujo:emptyWorkflow('arrendador')}
 ];
 vi.stubGlobal('fetch',async()=>Response.json({expedientes:peers,entrevistas:[],documentos:[]}));
 render(<OperationWorkflowPanel expediente={{...base,operacion:'renta',propiedad_slug:'p1',flujo:emptyWorkflow('arrendador')}} onSaved={vi.fn()} onDirtyChange={vi.fn()}/>);
 await waitFor(()=>expect(screen.getByRole('option',{name:'RENTA-TENANT · Arrendatario'})).toBeTruthy());
 expect(screen.queryByRole('option',{name:/VENTA-BUYER|INVERSION|RENTA-OWNER/})).toBeNull();
});

const reviewedFixture={estado:'revisado' as const,soporte:'Revisión ficticia',evidencia:{tipo:'externa' as const,referencia:'Carpeta ficticia v1',fecha:'2026-10-10',responsable:'Revisor ficticio',resultado:'Sin observaciones'},vigenteHasta:'2099-12-31'};
const verifiedFixture={...emptyWorkflow(),requisitos:{titularidad:reviewedFixture,factibilidad:reviewedFixture,valor:reviewedFixture,precio:reviewedFixture},resolucion:{tipo:'aceptada' as const,fecha:'2026-10-12',motivo:'Encargo aceptado',siguienteAccion:'Firmar intermediación',fechaSiguiente:'2026-10-20'}};
it('shows the six sale phases and keeps contract capture locked until verification ends',()=>{
 vi.stubGlobal('fetch',async()=>Response.json({expedientes:[]}));
 const view=render(<OperationWorkflowPanel expediente={{...base,etapa:'documentacion'}} onSaved={vi.fn()} onDirtyChange={vi.fn()}/>);
 const steps=screen.getByRole('list',{name:'Etapas del proceso de venta'});
 expect(steps.textContent).toContain('Verificación y precio');expect(steps.textContent).toContain('Cierre y entrega');
 expect(screen.getByText(/Completa primero «Verificación y precio»/)).toBeTruthy();
 expect(screen.getByLabelText('Estado de Intermediación formalizada y autorización').matches(':disabled')).toBe(true);
 expect(screen.getByLabelText('Estado de Opinión de valor y fuentes').matches(':disabled')).toBe(false);
 view.unmount();
 render(<OperationWorkflowPanel expediente={{...base,etapa:'documentacion',flujo:verifiedFixture}} onSaved={vi.fn()} onDirtyChange={vi.fn()}/>);
 expect(screen.getByRole('listitem',{current:'step'}).textContent).toContain('Contrato y preparación');
 expect(screen.queryByText(/Completa primero «Verificación y precio»/)).toBeNull();
 expect(screen.getByLabelText('Estado de Intermediación formalizada y autorización').matches(':disabled')).toBe(false);
});
it('flags an overdue monthly owner report while the property is promoted',async()=>{
 vi.stubGlobal('fetch',async(url:string)=>String(url).includes('informe-propietario')?Response.json({runs:[{id:'r2',title:'Borrador sin resultado',updatedAt:'2000-02-01T18:00:00Z',result:null,context:{}},{id:'r1',title:'Informe ficticio',updatedAt:'2000-01-10T18:00:00Z',result:{title:'Informe'},context:{}}]}):Response.json({expedientes:[],runs:[]}));
 render(<OperationWorkflowPanel expediente={{...base,etapa:'comercializacion',flujo:verifiedFixture}} onSaved={vi.fn()} onDirtyChange={vi.fn()}/>);
 expect(await screen.findByText('Informe vencido desde 10/02/2000. Último preparado el 10/01/2000.')).toBeTruthy();
 expect(screen.getByRole('link',{name:'Preparar informe del mes'}).getAttribute('href')).toContain('/admin/apps/informe-propietario?expedienteId=');
 expect(screen.getByRole('region',{name:'Visitas y ofertas del inmueble'})).toBeTruthy();
});
it('a buyer keeps its own route steps',()=>{
 vi.stubGlobal('fetch',async()=>Response.json({expedientes:[]}));
 render(<OperationWorkflowPanel expediente={{...base,flujo:emptyWorkflow('compra')}} onSaved={vi.fn()} onDirtyChange={vi.fn()}/>);
 expect(screen.getByRole('list',{name:'Pasos de la operación'}).textContent).toContain('Perfil y capacidad');
 expect(screen.queryByRole('region',{name:'Informe al propietario'})).toBeNull();
});
