import {afterEach,beforeEach,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
const {session}=vi.hoisted(()=>({session:vi.fn()}));vi.mock("@/lib/admin/store",async original=>({...await original<typeof import("@/lib/admin/store")>(),useSession:session}));
import Page from "@/app/admin/control-comercial/page";
import {emptyComercialBook,newOpportunity} from "@/lib/comercial/types";
const id="61000000-0000-4000-8000-000000000003";
const b=()=>({id,nombre:"Cartera de prueba",version:1,data:{...emptyComercialBook(),oportunidades:[newOpportunity("I1","Inmueble")]},created_at:"2026-10-04",updated_at:"2026-10-04"});
beforeEach(()=>{session.mockReturnValue({role:"admin"});vi.stubGlobal("fetch",vi.fn(async(url:string)=>Response.json(url.endsWith(id)?{cartera:b(),emisiones:[],revisiones:[{version:1}]}:{carteras:[b()]})));});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it("consumes the portfolio deep link once and does not reload after saving",async()=>{
 window.history.replaceState(null,"","/admin/control-comercial?cartera="+id);
 try {
  render(<Page/>);
  await screen.findByText(/Versión guardada 1/);
  fireEvent.change(screen.getByLabelText("Nombre de cartera"),{target:{value:"Nueva versión"}});
  vi.mocked(fetch).mockResolvedValueOnce(Response.json({cartera:{...b(),nombre:"Nueva versión",version:2}}));
  fireEvent.click(screen.getByRole("button",{name:"Guardar cartera"}));
  await screen.findByText(/Versión guardada 2/);
  expect(vi.mocked(fetch).mock.calls.filter(([url,init])=>String(url).endsWith(id)&&!init?.method)).toHaveLength(1);
  expect((screen.getByLabelText("Nombre de cartera") as HTMLInputElement).value).toBe("Nueva versión");
 } finally {window.history.replaceState(null,"","/");}
});
it("editor no solicita datos globales",()=>{session.mockReturnValue({role:"editor"});render(<Page/>);expect(screen.getByText(/requiere acceso de administrador/i)).toBeTruthy();expect(fetch).not.toHaveBeenCalled();});
it("carga servidor, guarda campos y conserva captura ante conflicto; no emite cambios sin guardar",async()=>{
 render(<Page/>);fireEvent.change(await screen.findByLabelText("Cartera"),{target:{value:id}});await screen.findByText(/Versión guardada 1/);fireEvent.click(screen.getByRole("button",{name:"Oportunidades"}));fireEvent.click(screen.getByRole("button",{name:/I1/}));fireEvent.change(screen.getByLabelText("Nombre de la oportunidad"),{target:{value:"Captura pendiente"}});
 expect((screen.getByRole("button",{name:"Emitir PDF"}) as HTMLButtonElement).disabled).toBe(true);
 vi.mocked(fetch).mockResolvedValueOnce(Response.json({error:"La cartera cambió"},{status:409}));fireEvent.click(screen.getByRole("button",{name:"Guardar cartera"}));await screen.findByText("La cartera cambió");expect((screen.getByLabelText("Nombre de la oportunidad") as HTMLInputElement).value).toBe("Captura pendiente");
 vi.mocked(fetch).mockResolvedValueOnce(Response.json({cartera:{...b(),version:2,data:{...b().data,oportunidades:[{...b().data.oportunidades[0],nombre:"Captura pendiente"}]}}}));fireEvent.click(screen.getByRole("button",{name:"Guardar cartera"}));await waitFor(()=>expect(screen.getByText(/Versión guardada 2/)).toBeTruthy());
 const last=vi.mocked(fetch).mock.calls.at(-1)!;expect(JSON.parse(String(last[1]?.body)).data.oportunidades[0].nombre).toBe("Captura pendiente");
});
