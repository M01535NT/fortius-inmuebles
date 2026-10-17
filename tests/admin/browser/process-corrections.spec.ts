import {test,expect} from '@playwright/test';
import {emptyWorkflow} from '../../../src/lib/formatos/operation-workflow';
for(const width of [390,768,1440]) {
 test('captación y rutas propias visibles a '+width,async({page},info)=>{
  test.setTimeout(90000);await page.setViewportSize({width,height:1000});
  const errors:string[]=[];const writes:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const adviser={id:'qa-adviser',nombre:'Asesor sintético',activo:true};
  const routes=['captacion','compra','arrendador','arrendatario','inversion'] as const;
  const clients=routes.map((r,i)=>({id:'person-'+i,nombre:'Persona sintética '+r,tipo:i===0?'propietario':i===4?'inversionista':'comprador',asesorId:adviser.id}));
  const ops=routes.map((r,i)=>({id:'87000000-0000-4000-8000-00000000000'+i,cliente_id:clients[i].id,asesor_id:adviser.id,propiedad_slug:null,folio:'ENSAYO-'+r,operacion:i===4?'inversion':i>=2?'renta':'venta',unidad:'',version:1,etapa:'documentacion',flujo:emptyWorkflow(r)}));
  await page.route('**/api/**',async route=>{
   const req=route.request(),u=new URL(req.url());if(req.method()!=='GET'){writes.push(u.pathname);return route.fulfill({status:405,json:{error:'Ensayo sin escrituras'}});}
   if(u.pathname==='/api/auth/session')return route.fulfill({json:{user:{id:'qa',email:'qa@example.invalid',role:'admin'}}});
   if(u.pathname==='/api/admin/expedientes')return route.fulfill({json:{expedientes:ops,nextOffset:null}});
   if(u.pathname==='/api/admin/mi-asesor')return route.fulfill({json:{asesorId:adviser.id}});
   if(u.pathname==='/api/admin/apps/runs')return route.fulfill({json:{runs:[],nextOffset:null}});
   if(u.pathname==='/api/admin/entrevistas/config')return route.fulfill({json:{administrador:true,asesorId:null}});
   if(u.pathname==='/api/admin/entrevistas')return route.fulfill({json:{entrevistas:[]}});
   if(u.pathname.endsWith('/formatos'))return route.fulfill({json:{documentos:[]}});
   if(u.pathname.endsWith('/actividad'))return route.fulfill({json:{actividad:[]}});
   const data=u.pathname.endsWith('/clientes')?clients:u.pathname.endsWith('/asesores')?[adviser]:[];
   return route.fulfill({json:{records:data.map(v=>({id:v.id,data:v,version:1}))}});
  });
  await page.goto('/admin/operaciones/nueva');
  const seller=page.getByRole('radio',{name:/^Vender su inmueble/});await seller.focus();await page.keyboard.press('Enter');
  await expect(seller).toHaveAttribute('aria-checked','true');
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await expect(page.getByRole('heading',{name:'¿Quién es?'})).toBeVisible();
  await page.getByLabel('Nombre completo').fill('Primer contacto sintético');
  await page.getByLabel(/^Correo/).fill('ensayo@example.invalid');
  await page.getByText('Siguiente acción mientras terminas de capturarlo').click();
  await expect(page.getByLabel('Siguiente acción',{exact:true})).toHaveValue('Terminar la entrevista');
  await page.getByLabel('Siguiente acción',{exact:true}).fill('Entrevistar al titular');
  await page.getByLabel('Fecha de la siguiente acción').fill('2030-12-31');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath('contacto-'+width+'.png'),fullPage:true});
  for(const [i,r] of routes.entries()){
   // La dirección anterior con ?expediente= abre la operación guiada.
   await page.goto('/admin/operaciones?expediente='+ops[i].id);
   await expect(page).toHaveURL(new RegExp('/admin/operaciones/'+ops[i].id));
   await expect(page.getByText(ops[i].folio,{exact:true})).toBeVisible();
   const guide=page.getByRole('region',{name:'Lo que sigue'});await expect(guide).toBeVisible();
   const states=guide.getByRole('radiogroup').first();await expect(states).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await guide.screenshot({path:info.outputPath(r+'-'+width+'.png')});
   await states.getByRole('radio',{name:/Revisado/}).click();
   const sheet=page.getByRole('dialog');await expect(sheet.getByText('Documento fuera del sistema',{exact:true})).toBeVisible();
   const outside=sheet.getByRole('radio',{name:/Documento fuera del sistema/});
   await outside.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));
   expect(await outside.evaluate(e=>{const b=e.getBoundingClientRect();const t=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return e===t||e.contains(t)||!!t?.closest('label')?.contains(e);})).toBe(true);
   await page.screenshot({path:info.outputPath(r+'-revisado-'+width+'.png')});
   await page.keyboard.press('Escape');
   await page.getByRole('tab',{name:'Ajustes'}).click();
   await expect(page.getByRole('combobox',{name:'Decisión',exact:true})).toBeVisible();
   await page.getByRole('combobox',{name:'Decisión',exact:true}).selectOption('pausada');
   await expect(page.getByRole('region',{name:'Contraparte'})).toHaveCount(r==='inversion'?0:1);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await page.screenshot({path:info.outputPath(r+'-ajustes-'+width+'.png')});
   page.once('dialog',d=>void d.accept());
  }
  expect(errors).toEqual([]);expect(writes).toEqual([]);
 });
}
