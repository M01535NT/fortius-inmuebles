import { afterEach,expect,it,vi } from 'vitest';
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
const {tasks,propertyStore,taskStore}=vi.hoisted(()=>({tasks:[] as Array<Record<string,unknown>>,propertyStore:{load:vi.fn().mockResolvedValue(undefined)},taskStore:{load:vi.fn().mockResolvedValue(undefined),put:vi.fn()}}));
vi.mock('@/lib/admin/store',async original=>({...await original<typeof import('@/lib/admin/store')>(),db:{propiedades:propertyStore,tareas:taskStore},useCollection:(store:object)=>store===taskStore?tasks:[]}));
import {OperationWorkflowPanel} from '@/components/admin/operation-workflow-panel';
import {emptyWorkflow} from '@/lib/formatos/operation-workflow';
const base={id:'80000000-0000-4000-8000-000000000010',asesor_id:'a1',cliente_id:'c1',version:1,etapa:'captacion' as const,propiedad_slug:null,flujo:emptyWorkflow()};
afterEach(()=>{cleanup();vi.unstubAllGlobals();tasks.length=0;});
it('received paperwork and absent action do not enable stage advancement',()=>{
 vi.stubGlobal('fetch',async()=>Response.json({expedientes:[]}));
 render(<OperationWorkflowPanel expediente={{...base,flujo:{...base.flujo,requisitos:{entrevista:{estado:'recibido',soporte:'Referencia ficticia v1'},titularidad:{estado:'recibido',soporte:'Referencia ficticia v1'}}}}} onSaved={vi.fn()} onDirtyChange={vi.fn()}/>);
 expect((screen.getByRole('button',{name:'Avanzar a Revisión y preparación'}) as HTMLButtonElement).disabled).toBe(true);
 expect(screen.getByText('Agendar una próxima tarea con fecha y responsable.')).toBeTruthy();
});
it('retains evidence and reports a failed save without announcing an advance',async()=>{
 const saved=vi.fn(),dirty=vi.fn();vi.stubGlobal('fetch',async(_url:string,init?:RequestInit)=>init?.method==='PUT'?Response.json({error:'Servicio no disponible'},{status:503}):Response.json({expedientes:[]}));
 render(<OperationWorkflowPanel expediente={base} onSaved={saved} onDirtyChange={dirty}/>);
 const field=screen.getByLabelText('Soporte de Entrevista y objetivo del propietario');
 fireEvent.change(field,{target:{value:'Referencia ficticia v1 conservada'}});
 fireEvent.click(screen.getByRole('button',{name:'Guardar guía'}));
 expect((await screen.findByRole('alert')).textContent).toContain('Servicio no disponible');
 expect((field as HTMLTextAreaElement).value).toBe('Referencia ficticia v1 conservada');expect(saved).not.toHaveBeenCalled();expect(dirty).toHaveBeenCalledWith(true);
});
it('a buyer sees profile and capacity instead of seller title and intermediation',()=>{
 vi.stubGlobal('fetch',async()=>Response.json({expedientes:[]}));
 render(<OperationWorkflowPanel expediente={{...base,flujo:emptyWorkflow('compra')}} onSaved={vi.fn()} onDirtyChange={vi.fn()}/>);
 expect(screen.getByLabelText('Estado de Perfil, necesidades y participantes de la compra')).toBeTruthy();
 expect(screen.getByLabelText('Estado de Presupuesto, recursos y crédito comprobados')).toBeTruthy();
 expect(screen.queryByLabelText('Estado de Identidad, representación y antecedente de propiedad')).toBeNull();
});

it('creates the next action in place while preserving unsaved review evidence',async()=>{
 taskStore.put.mockImplementation(async(value:Record<string,unknown>)=>{tasks.push(value);return value;});
 vi.stubGlobal('fetch',async()=>Response.json({expedientes:[]}));
 render(<OperationWorkflowPanel expediente={base} onSaved={vi.fn()} onDirtyChange={vi.fn()}/>);
 const evidence=screen.getByLabelText('Soporte de Entrevista y objetivo del propietario');
 fireEvent.change(evidence,{target:{value:'Evidencia ficticia sin guardar'}});
 fireEvent.change(screen.getByLabelText('Próxima tarea'),{target:{value:'Solicitar documentación'}});
 fireEvent.change(screen.getByLabelText('Fecha de la próxima tarea'),{target:{value:'2030-12-31'}});
 fireEvent.click(screen.getByRole('button',{name:'Agendar próxima acción'}));
 expect(await screen.findByRole('link',{name:'Solicitar documentación'})).toBeTruthy();
 expect((evidence as HTMLTextAreaElement).value).toBe('Evidencia ficticia sin guardar');
 expect(tasks[0]).toMatchObject({expedienteId:base.id,clienteId:'c1',asesorId:'a1',vence:'2030-12-31',estado:'pendiente'});
});
