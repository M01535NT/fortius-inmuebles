import { describe, expect, it } from "vitest";
import { emptyComercialBook, newOpportunity } from "@/lib/comercial/types";
import { calculateComercial } from "@/lib/comercial/calculate";

function book() { const b = emptyComercialBook(); b.config.modoCorte = "Fijo"; b.config.fechaCorte = "2026-10-04"; return b; }
function row(id = "I1", segmento: "Inmueble" | "Comprador" = "Inmueble") {
  const o = newOpportunity(id, segmento); o.nombre = id; o.valor = 1000000; o.moneda = "MXN"; o.comision = 3;
  o.niveles = segmento === "Inmueble" ? [1, 0, 1, 0] : [1, 1, 1, 0, 0, 0]; o.gestion.operacion = "Venta"; return o;
}
describe("cartera comercial, reglas del original", () => {
  it("resuelve pendientes con la última corrección y conserva el control histórico", () => {
    const b = book(); b.oportunidades = [row()];
    const d1 = { ...{id:"D1",oportunidad:"",nombre:"",aplicabilidad:"Por definir" as const,estado:"Pendiente" as const,fuente:"",fecha:"",responsable:"",observacion:"",anterior:""}, oportunidad: "I1", nombre: "Escritura", aplicabilidad: "Aplica" as const };
    const e1 = { ...{id:"E1",oportunidad:"",fecha:"",actividad:"Otro" as const,detalle:"",importe:null,moneda:"" as const,estado:"Registrado" as const,responsable:"",evidencia:"",base:"Declarado" as const,anterior:""}, oportunidad: "I1" };
    b.documentos = [d1, { ...d1, id: "D2", anterior: "D1", estado: "Verificado", fuente: "Copia cotejada", fecha: "2026-10-04", responsable: "Ana" }];
    b.eventos = [e1, { ...e1, id: "E2", anterior: "E1", detalle: "Visita corregida", fecha: "2026-10-04", responsable: "Ana" }];
    const result = calculateComercial(b);
    expect(result.controles).not.toContain("Hay documentos pendientes");
    expect(result.controles).not.toContain("Hay eventos pendientes");
    expect(result.documentos[0]).toMatchObject({ id: "D1", vigente: false, sustituidoPor: "D2" });
    expect(result.documentos[0].controles).toContain("Pendiente de recepción");
    expect(result.documentos[1]).toMatchObject({ vigente: true, sustituidoPor: null, controles: [] });
    expect(result.eventos).toHaveLength(2);
  });
  it("inicia vacía, sin asumir cotización", () => { const b = emptyComercialBook(); expect(b.oportunidades).toEqual([]); expect(b.config.tc).toBeNull(); expect(b.config.pesosInmueble).toEqual([20,20,50,10]); });
  it("conserva el umbral estricto y bases distintas", () => {
    const b = book(); b.oportunidades = [row(), row("C1", "Comprador")]; let r = calculateComercial(b);
    expect(r.filas.map(o => o.priorizadoMXN)).toEqual([30000,21000]); expect(r.totals.priorizado).toBe(51000);
    b.config.umbral = 70; r = calculateComercial(b); expect(r.filas[0].clasificacion).toBe("Revisar"); expect(r.totals.priorizado).toBe(0);
    b.config.pesosInmueble = [19,21,50,10]; b.config.umbral = 69; expect(calculateComercial(b).filas[0].clasificacion).toBe("Revisar");
  });
  it("no convierte USD sin fecha y fuente válidas ni suma totales incompletos", () => {
    const b = book(); const o = row(); o.moneda = "USD"; b.oportunidades = [o,row("I2")];
    expect(calculateComercial(b).totals.priorizado).toBeNull(); b.config.tc = 16.5; b.config.fechaTc = "2026-10-05"; b.config.fuenteTc = "Referencia";
    expect(calculateComercial(b).filas[0].valorMXN).toBeNull(); b.config.fechaTc = "2026-10-01";
    expect(calculateComercial(b).filas[0].priorizadoMXN).toBe(495000);
  });
  it("peso o nivel pendiente no se convierte en cero; redondea dinero a centavos", () => {
    const b = book(); const o = row(); o.valor = 100.15; o.comision = 2.5; b.oportunidades=[o]; expect(calculateComercial(b).filas[0].potencial).toBe(2.5);
    o.niveles[0] = null; expect(calculateComercial(b).totals.priorizado).toBeNull(); b.config.pesosInmueble=[20,20,40,10]; expect(calculateComercial(b).configuracionErrors).not.toEqual([]);
  });
  it("corte diario no renueva la fecha de TC", () => { const b=book(); b.config.modoCorte="Diario"; b.config.fechaTc="2026-09-01"; expect(calculateComercial(b,"2026-10-07").corte).toBe("2026-10-07"); expect(b.config.fechaTc).toBe("2026-09-01"); });
  it("distingue tarea cancelada y operación cerrada y mantiene orden de alertas", () => {
    const b=book(); const o=row(); b.oportunidades=[o]; const alert=()=>calculateComercial(b).filas[0].alerta;
    expect(alert()).toBe("Sin compromiso"); o.gestion.compromiso="2026-10-03"; expect(alert()).toBe("Vencido");
    o.gestion.compromiso="2026-10-06"; expect(alert()).toBe("Sin responsable"); o.gestion.responsable="Ana"; expect(alert()).toBe("Sin acción");
    o.gestion.accion="Llamar"; expect(alert()).toBe("Próximo"); o.gestion.compromiso="2026-11-01"; expect(alert()).toBe("En plazo");
    o.gestion.tarea="Cancelado"; expect(alert()).toBe("Reprogramar"); expect(calculateComercial(b).totals.abierto).toBe(30000);
    o.gestion.tarea="Completado"; expect(alert()).toBe("Programar siguiente"); o.gestion.etapa="Cerrado perdido"; expect(alert()).toBe("Cerrado"); expect(calculateComercial(b).totals.abierto).toBe(0);
  });
  it("expone relación inválida y riesgo de doble honorario; renta requiere base", () => {
    const b=book(); const o=row(); b.oportunidades=[o,row("C1","Comprador")]; o.gestion.relacionado="X"; expect(calculateComercial(b).filas[0].controles).toContain("Revisar ID relacionado");
    o.gestion.relacionado="C1"; expect(calculateComercial(b).filas[0].controles).toContain("Revisar posible doble honorario"); o.gestion.operacion="Renta"; expect(calculateComercial(b).filas[0].potencial).toBeNull();
  });
  it("ofertas y evidencia comprobada requieren importe y referencia", () => {
    const b=book(); b.oportunidades=[row()]; b.eventos=[{id:"E1",oportunidad:"I1",fecha:"2026-10-04",actividad:"Oferta",detalle:"Oferta",importe:null,moneda:"",estado:"Registrado",responsable:"Ana",evidencia:"",base:"Comprobado",anterior:""}];
    expect(calculateComercial(b).eventos[0].controles).toContain("Oferta sin importe positivo"); expect(calculateComercial(b).eventos[0].controles).toContain("Falta evidencia");
  });
  it("recibido no es verificado y no aplica necesita justificación", () => {
    const b=book(); b.oportunidades=[row()]; b.documentos=[{id:"D1",oportunidad:"I1",nombre:"Escritura",aplicabilidad:"Aplica",estado:"Recibido",fuente:"Referencia",fecha:"2026-10-04",responsable:"Ana",observacion:"",anterior:""}];
    expect(calculateComercial(b).documentos[0].controles).toContain("Pendiente de revisión"); b.documentos[0].aplicabilidad="No aplica";
    expect(calculateComercial(b).documentos[0].controles).toContain("Justificar no aplica"); b.documentos[0].observacion="Motivo"; expect(calculateComercial(b).documentos[0].controles).toEqual([]);
  });
});
