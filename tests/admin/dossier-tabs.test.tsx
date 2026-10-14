import * as React from "react";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {afterEach,expect,test,vi} from "vitest";
import {DossierTabs} from "@/components/admin/workspace/dossier-tabs";
afterEach(cleanup);
test("dossier tabs support keyboard focus and disable navigation while saving",()=>{
 const change=vi.fn();const view=render(<DossierTabs value="all" onChange={change} disabled={false}/>);
 fireEvent.keyDown(screen.getByRole("tab",{name:"Vista avanzada"}),{key:"ArrowRight"});
 expect(change).toHaveBeenCalledWith("summary");expect(document.activeElement).toBe(screen.getByRole("tab",{name:"Siguiente paso"}));
 view.rerender(<DossierTabs value="summary" onChange={change} disabled/>);
 expect(screen.getAllByRole("tab").every(tab=>(tab as HTMLButtonElement).disabled)).toBe(true);
});
