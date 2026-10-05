import { expect,it } from "vitest";
import { emptyComercialBook,newOpportunity } from "@/lib/comercial/types";
import { comercialDataSchema,validateComercialTransition } from "@/lib/comercial/schema";
it("rechaza dos correcciones del mismo anterior y admite una cadena única",()=>{
 const b=emptyComercialBook();const d={...{id:"D1",oportunidad:"",nombre:"",aplicabilidad:"Por definir" as const,estado:"Pendiente" as const,fuente:"",fecha:"",responsable:"",observacion:"",anterior:""},oportunidad:"I1"};
 b.documentos=[d,{...d,id:"D2",anterior:"D1"},{...d,id:"D3",anterior:"D1"}];
 expect(comercialDataSchema.safeParse(b).success).toBe(false);
 b.documentos[2].anterior="D2";expect(comercialDataSchema.safeParse(b).success).toBe(true);
});
it("guarda desconocidos como null y rechaza números no binarios/IDs repetidos",()=>{
 const b=emptyComercialBook(); b.oportunidades=[newOpportunity("I1","Inmueble")]; expect(comercialDataSchema.parse(b).oportunidades[0].valor).toBeNull();
 b.oportunidades[0].niveles[0]=2; expect(comercialDataSchema.safeParse(b).success).toBe(false); b.oportunidades[0].niveles[0]=null; b.oportunidades.push({...b.oportunidades[0]}); expect(comercialDataSchema.safeParse(b).success).toBe(false);
});
it("no permite quitar/reasignar oportunidades ni alterar eventos/documentos guardados",()=>{
 const b=emptyComercialBook(); b.oportunidades=[newOpportunity("I1","Inmueble")]; const next=structuredClone(b); next.oportunidades=[]; expect(validateComercialTransition(b,next)).not.toEqual([]);
 next.oportunidades=[{...b.oportunidades[0],segmento:"Comprador"}]; expect(validateComercialTransition(b,next)).not.toEqual([]);
 b.eventos=[{id:"E1",oportunidad:"I1",fecha:"",actividad:"Otro",detalle:"Dato",importe:null,moneda:"",estado:"Registrado",responsable:"",evidencia:"",base:"Declarado",anterior:""}]; const n=structuredClone(b); n.eventos[0].detalle="Cambio"; expect(validateComercialTransition(b,n)).not.toEqual([]);
 const valid=structuredClone(b); valid.eventos.push({...b.eventos[0],id:"E2",anterior:"E1",detalle:"Corrección"}); expect(validateComercialTransition(b,valid)).toEqual([]);
 valid.eventos[1].anterior="E2"; expect(comercialDataSchema.safeParse(valid).success).toBe(false);
});
