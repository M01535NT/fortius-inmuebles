import {expect,it} from "vitest";
import {PDFDocument} from "pdf-lib";
import {createHash} from "node:crypto";
import {createComercialPdf} from "@/lib/comercial/pdf";
import {emptyComercialBook,newOpportunity} from "@/lib/comercial/types";
it("archiva resultado, corte, páginas y SHA-256; datos incompletos quedan pendientes",async()=>{const data=emptyComercialBook();data.oportunidades=[newOpportunity("I1","Inmueble")];const p=await createComercialPdf("Cartera sintética",3,data,"2026-10-04");expect(p.result.totals.priorizado).toBeNull();expect(p.result.corte).toBe("2026-10-04");expect(p.sha256).toBe(createHash("sha256").update(p.bytes).digest("hex"));expect((await PDFDocument.load(p.bytes)).getPageCount()).toBeGreaterThan(1);});
