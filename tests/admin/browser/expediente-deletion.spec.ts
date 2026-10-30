import {test,expect} from "@playwright/test";
for(const width of [390,1440]){
 test("eliminar y restaurar una operación a "+width+"px",async({page},testInfo)=>{
  await page.setViewportSize({width,height:844});
  let removed=false,version=1;
  const exp={id:"51000000-0000-4000-8000-000000000010",cliente_id:"qa-client",asesor_id:"qa-adviser",folio:"EXP-PRUEBA",operacion:"venta",unidad:"",propiedad_slug:null,etapa:"captacion"};
  await page.route("**/api/**",async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.pathname==="/api/auth/session")return route.fulfill({json:{user:{id:"qa",email:"qa@example.invalid",role:"admin"}}});
   if(req.method()==="DELETE" || req.method()==="PATCH"){
    expect(req.postDataJSON()).toEqual({version});removed=req.method()==="DELETE";version++;
    return route.fulfill({json:{expediente:{...exp,version,deleted_at:removed?"2026-10-05T05:30:00Z":null}}});
   }
   if(req.method()!=="GET")return route.fulfill({status:405,json:{error:"Prueba sin escrituras"}});
   if(url.pathname==="/api/admin/expedientes")return route.fulfill({json:{expedientes:(url.searchParams.get("estado")==="eliminados")===removed?[{...exp,version,deleted_at:removed?"2026-10-05T05:30:00Z":null}]:[],nextOffset:null}});
   if(url.pathname.endsWith("/formatos"))return route.fulfill({json:{documentos:[]}});
   if(url.pathname==="/api/admin/entrevistas")return route.fulfill({json:{entrevistas:[]}});
   return route.fulfill({json:{records:[]}});
  });
  await page.goto("/admin/operaciones/"+exp.id+"?tab=ajustes");
  await page.getByRole("button",{name:"Eliminar operación",exact:true}).click();
  const dialog=page.getByRole("dialog");
  await expect(dialog).toContainText("Puedes restaurarla");
  await dialog.getByRole("button",{name:"Cancelar",exact:true}).click();
  expect(removed).toBe(false);
  await page.getByRole("button",{name:"Eliminar operación",exact:true}).click();
  await page.getByRole("dialog").getByRole("button",{name:"Eliminar",exact:true}).click();
  await expect(page.getByText("Esta operación está eliminada")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button",{name:"Restaurar operación",exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"Crear y abrir",exact:true})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath("operacion-eliminada-"+width+".png"),fullPage:true});
  await page.goto("/admin/operaciones?eliminadas=1");
  await expect(page.getByRole("button",{name:"Restaurar EXP-PRUEBA"})).toBeVisible();
  await page.goto("/admin/operaciones/"+exp.id);
  await page.getByRole("button",{name:"Restaurar operación",exact:true}).click();
  await expect(page.getByRole("main").getByRole("status").first()).toContainText("Operación restaurada");
  await page.getByRole("tab",{name:/^Expediente/}).click();
  await expect(page.getByRole("button",{name:"Crear y abrir",exact:true})).toBeVisible();
 });
}
