import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppWorkspace } from "@/components/admin/apps/workspace";
const mocks=vi.hoisted(()=>({api:vi.fn(),confirm:vi.fn(),search:new URLSearchParams()}));
vi.mock("@/lib/admin/store",()=>({apiRequest:mocks.api,loadAllDossiers:async()=>(await mocks.api("/api/admin/expedientes?limit=200&offset=0")).expedientes,useSession:()=>({id:"test-admin"}),errorMessage:(e:Error)=>e.message,uploadFile:vi.fn()}));
vi.mock("next/navigation",()=>({useSearchParams:()=>mocks.search}));
vi.mock("@/components/admin/workspace/confirm",()=>({confirmAction:mocks.confirm}));
vi.mock("@/components/admin/apps/document-editor",()=>({DocumentEditor:()=>null}));
const saved={id:"test-run",slug:"conversor",title:"Trabajo de prueba",input:{category:"area",amount:"100",from:"m2",to:"ft2"},result:null,context:{},version:1,updatedAt:"2026-10-13"};
beforeEach(()=>{mocks.confirm.mockResolvedValue(true);mocks.api.mockImplementation(async(url:string)=>url.includes("expedientes")?{expedientes:[],nextOffset:null}:{runs:[],nextOffset:null});});
afterEach(()=>{cleanup();vi.clearAllMocks();});
it("muestra la conversión en pantalla sin ofrecer PDF ni pedir guardado previo",async()=>{
 render(<AppWorkspace slug="conversor"/>);
 fireEvent.change(screen.getByLabelText("Cantidad"),{target:{value:"100"}});
 fireEvent.click(screen.getByRole("button",{name:"Convertir"}));
 expect(screen.getByRole("region",{name:"Resultado"}).textContent).toContain("1,076.39104167 ft²");
 expect(screen.queryByRole("button",{name:"Descargar PDF"})).toBeNull();
 await waitFor(()=>expect(mocks.api).toHaveBeenCalled());
 expect(mocks.api.mock.calls.every(call=>call[1]!=="POST")).toBe(true);
});
it("mantiene el filtro del historial mientras finaliza una restauración",async()=>{
 let finish!:()=>void;const pending=new Promise<void>(resolve=>{finish=resolve;});
 let removed=true;
 mocks.api.mockImplementation(async(url:string,method?:string)=>{
  if(url.includes("expedientes"))return{expedientes:[],nextOffset:null};
  if(method==="PATCH"){await pending;removed=false;return{run:saved};}
  return{runs:url.includes("deleted=true")&&removed?[saved]:[],nextOffset:null};
 });
 render(<AppWorkspace slug="conversor"/>);
 fireEvent.click(screen.getByRole("button",{name:"Mis trabajos"}));
 fireEvent.click(screen.getByRole("button",{name:"Ver eliminados"}));
 fireEvent.click(await screen.findByRole("button",{name:"Restaurar"}));
 await waitFor(()=>expect(screen.getByRole<HTMLButtonElement>("button",{name:"Ver activos"}).disabled).toBe(true));
 fireEvent.click(screen.getByRole("button",{name:"Ver activos"}));
 expect(screen.getByRole("heading",{name:"Eliminados"})).toBeTruthy();
 await act(async()=>finish());
 await waitFor(()=>expect(screen.getByRole<HTMLButtonElement>("button",{name:"Ver activos"}).disabled).toBe(false));
 expect(screen.queryByRole("button",{name:"Restaurar"})).toBeNull();
});
