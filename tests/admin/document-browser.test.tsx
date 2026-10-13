import * as React from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import DocumentsPage from "@/app/admin/documentos/page";
const row={id:"doc",expedienteId:"exp",folio:"EXP-2026",formatoId:"18",version:3,actualizadoEl:"2026-10-13T18:00:00Z"};
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
test("document browser shows metadata and opens the exact dossier and document",async()=>{
  vi.stubGlobal("fetch",async()=>Response.json({documentos:[row],total:1,nextOffset:null}));
  render(<DocumentsPage/>);
  const link=await screen.findByRole("link",{name:/Abrir documento.*EXP-2026/});
  expect(link.getAttribute("href")).toBe("/admin/expedientes?expediente=exp&documento=doc#exp-documentos");
  expect(screen.getByText(/Borrador v3/)).toBeTruthy();
});
test("folio search applies to server pagination and format filtering",async()=>{
  const requests:string[]=[];
  vi.stubGlobal("fetch",async(url:string)=>{requests.push(url);return Response.json({documentos:[],total:0,nextOffset:null});});
  render(<DocumentsPage/>);
  await screen.findByText("No hay documentos con estos criterios.");
  fireEvent.change(screen.getByLabelText("Buscar por folio"),{target:{value:"EXP 26"}});
  fireEvent.change(screen.getByLabelText("Formato"),{target:{value:"18"}});
  fireEvent.submit(screen.getByRole("button",{name:"Buscar documentos"}).closest("form")!);
  await waitFor(()=>expect(requests.at(-1)).toContain("folio=EXP+26"));
  expect(requests.at(-1)).toContain("formato=18");
});
test("failed document lookup remains an error with retry, never a false empty state",async()=>{
  let failure=true;
  vi.stubGlobal("fetch",async()=>failure?Response.json({error:"No se pudieron consultar los documentos"},{status:503}):Response.json({documentos:[row],total:1,nextOffset:null}));
  render(<DocumentsPage/>);
  await screen.findByRole("alert");
  expect(screen.queryByText("No hay documentos con estos criterios.")).toBeNull();
  failure=false;fireEvent.click(screen.getByRole("button",{name:"Reintentar"}));
  expect(await screen.findByRole("link",{name:/Abrir documento.*EXP-2026/})).toBeTruthy();
});
