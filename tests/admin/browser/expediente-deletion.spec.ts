import {test,expect} from "@playwright/test";
for(const width of [390,1440]){
 test("eliminar y restaurar expediente a "+width+"px",async({page},testInfo)=>{
  await page.setViewportSize({width,height:844});
  let removed=false,version=1;
  const exp={id:"51000000-0000-4000-8000-000000000010",cliente_id:"qa-client",asesor_id:"qa-adviser",folio:"EXP-PRUEBA",operacion:"venta",unidad:"",propiedad_slug:null};
  await page.route("**/api/**",async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.pathname==="/api/auth/session")return route.fulfill({json:{user:{id:"qa",email:"qa@example.invalid",role:"admin"}}});
   if(req.method()==="DELETE" || req.method()==="PATCH"){
    expect(req.postDataJSON()).toEqual({version});removed=req.method()==="DELETE";version++;
    return route.fulfill({json:{expediente:{...exp,version,deleted_at:removed?"2026-10-05T05:30:00Z":null}}});
   }
   if(url.pathname==="/api/admin/expedientes")return route.fulfill({json:{expedientes:(url.searchParams.get("estado")==="eliminados")===removed?[{...exp,version,deleted_at:removed?"2026-10-05T05:30:00Z":null}]:[]}});
   if(url.pathname.endsWith("/formatos"))return route.fulfill({json:{documentos:[]}});
   return route.fulfill({json:{records:[]}});
  });
  await page.goto("/admin/expedientes");
  await page.getByRole("button",{name:/EXP-PRUEBA/}).click();
  page.once("dialog",dialog=>dialog.dismiss());
  await page.getByRole("button",{name:"Eliminar expediente",exact:true}).click();
  expect(removed).toBe(false);
  page.once("dialog",dialog=>dialog.accept());
  await page.getByRole("button",{name:"Eliminar expediente",exact:true}).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("Expediente eliminado");
  await page.reload();
  await expect(page.getByRole("button",{name:/EXP-PRUEBA/})).toHaveCount(0);
  await page.getByRole("button",{name:"Eliminados",exact:true}).click();
  await page.getByRole("button",{name:/EXP-PRUEBA/}).click();
  await expect(page.getByRole("button",{name:"Crear borrador",exact:true})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath("expediente-eliminado-"+width+".png"),fullPage:true});
  await page.getByRole("button",{name:"Restaurar expediente",exact:true}).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("Expediente restaurado");
  await page.getByRole("button",{name:"Activos",exact:true}).click();
  await page.getByRole("button",{name:/EXP-PRUEBA/}).click();
  await expect(page.getByRole("button",{name:"Crear borrador",exact:true})).toBeVisible();
 });
}
