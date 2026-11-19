import { CATALOGOS, type Catalogo, type Catalogos, type ClaveCatalogo, type Significado } from "./catalogos-contrato";

/**
 * Los catálogos con los valores con que empezó el panel: los mismos que carga la base
 * (supabase/migrations/20261118200000_panel_14_catalogos.sql). Solo se usan si la base no responde, para que nada se
 * frene: las listas desplegables, abrir un asunto y el informe siguen con lo de siempre. Si se cambia esa carga, se
 * cambia aquí también.
 */

type Definicion = [nombre: string, ayuda: string, orden: number, fijo: boolean, significado_nombre: string | null, significados: Significado[], padre: ClaveCatalogo | null, en_pantalla: boolean];
/** [clave, etiqueta, orden, significado, padre, de_sistema] */
type Valor = [string, string, number, string | null, string | null, boolean];

const s = (pares: [string, string][]): Significado[] => pares.map(([clave, etiqueta]) => ({ clave, etiqueta }));

const DEFINICIONES: Record<ClaveCatalogo, Definicion> = {
  tipo_asunto: ["Tipos de asunto", "La naturaleza del caso.", 10, false, null, [], null, false],
  subtipo_asunto: ["Subtipos sugeridos", "Se sugieren según el tipo; también se escribe uno libre.", 20, false, null, [], "tipo_asunto", false],
  encargo: ["Encargos", "Qué le encargaron a Fortius en el asunto.", 30, false, null, [], null, true],
  en_que_va: ["En qué va un asunto", "El panel depende de esta lista: se renombra, no se le quitan ni agregan valores.", 40, true, null, [], null, true],
  resultado_cierre: ["Resultados de cierre", "Con qué resultado se cierra un asunto.", 50, false, "Cuenta como",
    s([["logrado", "Se logró"], ["no_logrado", "No se logró"]]), null, true],
  motivo_no_procede: ["Motivos de «no procede»", "Por qué una consulta no se volvió asunto.", 60, false, null, [], null, false],
  papel: ["Papeles de las personas", "El papel de cada persona en un asunto. Su lado es el grupo en que sale en Personas.", 70, false, "De qué lado",
    s([["busca", "Quien nos busca"], ["cliente", "Dueños y herederos"], ["otro", "Del otro lado"], ["apoyo", "Quienes ayudan"]]), null, true],
  fuente: ["Fuentes de llegada", "Por dónde llegó la consulta.", 80, false, null, [], null, true],
  estado_tarea: ["Cómo va una tarea", "El panel depende de esta lista: se renombra, no se le quitan ni agregan valores.", 90, true, null, [], null, true],
  quien_tarea: ["Quién hace una tarea", "De quién depende una tarea del plan.", 95, false, null, [], null, true],
  tipo_inmueble: ["Tipos de inmueble", "Qué es el inmueble.", 100, false, "Sale en el sitio como",
    s([["casa", "Casa"], ["departamento", "Departamento"], ["terreno", "Terreno"], ["local", "Local comercial"], ["oficina", "Oficina"], ["nave-industrial", "Nave o bodega"], ["plaza", "Plaza o conjunto"]]), null, true],
  regimen: ["Regímenes del inmueble", "Cómo está la propiedad del inmueble.", 110, false, null, [], null, false],
  funcion_equipo: ["Funciones del equipo", "Lo que hace cada persona del equipo, además de ser director o asesor.", 120, false, null, [], null, false],
};

const VALORES: Record<ClaveCatalogo, Valor[]> = {
  tipo_asunto: [
    ["venta", "Venta", 10, null, null, false], ["cesion_derechos", "Cesión de derechos", 20, null, null, false],
    ["litigio", "Litigio", 30, null, null, false], ["renta_administracion", "Renta y administración", 40, null, null, false],
    ["rehabilitacion_proyectos", "Rehabilitación y proyectos", 50, null, null, false], ["investigacion_consulta", "Investigación y consulta", 60, null, null, false],
    ["servicios_gestiones", "Servicios y gestiones", 70, null, null, false], ["otro", "Otro", 80, null, null, false],
  ],
  subtipo_asunto: [
    ["litigiosos", "Litigiosos", 10, null, "cesion_derechos", false], ["adjudicatarios", "Adjudicatarios", 20, null, "cesion_derechos", false],
    ["rescision_contrato", "Rescisión de contrato", 30, null, "litigio", false], ["desahucio", "Desahucio", 40, null, "litigio", false],
    ["cancelacion_hipoteca", "Cancelación de hipoteca", 50, null, "servicios_gestiones", false],
  ],
  encargo: [
    ["revisar", "Revisar", 10, null, null, true], ["comercializar", "Comercializar", 20, null, null, true],
    ["tramitar", "Tramitar", 30, null, null, true], ["asesorar", "Asesorar", 40, null, null, true],
  ],
  en_que_va: [
    ["estudio", "En estudio", 10, null, null, true], ["propuesta", "Propuesta", 20, null, null, true], ["en_marcha", "En marcha", 30, null, null, true],
    ["por_cobrar", "Por cobrar", 40, null, null, true], ["cerrado", "Cerrado", 50, null, null, true],
  ],
  resultado_cierre: [
    ["se_logro", "Se logró", 10, "logrado", null, true], ["no_se_dio", "No se dio", 20, "no_logrado", null, true],
    ["no_procede", "No procede", 30, "no_logrado", null, false], ["desistio", "Desistió", 40, "no_logrado", null, false],
  ],
  motivo_no_procede: [
    ["fuera_de_giro", "No es de lo que hacemos", 10, null, null, false], ["sin_papeles", "No hay papeles para hacerlo", 20, null, null, false],
    ["no_quiso", "No quiso seguir", 30, null, null, false], ["sin_respuesta", "Ya no contestó", 40, null, null, false], ["otro", "Otro", 50, null, null, false],
  ],
  papel: [
    ["contacto", "Contacto", 10, "busca", null, true], ["propietario", "Propietario", 20, "cliente", null, true],
    ["titular", "Titular", 30, "cliente", null, false], ["heredero", "Heredero", 40, "cliente", null, false],
    ["copropietario", "Copropietario", 50, "cliente", null, false], ["comprador", "Comprador", 60, "otro", null, false],
    ["vendedor", "Vendedor", 70, "cliente", null, false], ["inquilino", "Inquilino", 80, "otro", null, false],
    ["inversionista", "Inversionista", 90, "otro", null, false], ["contraparte", "Contraparte", 100, "otro", null, false],
    ["apoderado", "Apoderado", 110, "apoyo", null, false], ["abogado", "Abogado", 120, "apoyo", null, false],
    ["notaria", "Notaría", 130, "apoyo", null, false], ["banco", "Banco", 140, "apoyo", null, false],
  ],
  fuente: [
    ["llamada", "Llamada", 10, null, null, true], ["whatsapp", "WhatsApp", 20, null, null, false], ["en_persona", "En persona", 30, null, null, false],
    ["referido", "Referido", 40, null, null, false], ["redes", "Redes", 50, null, null, false], ["cliente_anterior", "Cliente anterior", 60, null, null, false],
    ["sitio", "Sitio", 70, null, null, true], ["otro", "Otro", 80, null, null, false],
  ],
  estado_tarea: [
    ["pendiente", "Por hacer", 10, null, null, true], ["hecha", "Hecha", 20, null, null, true],
    ["no_aplica", "No aplica", 30, null, null, true], ["no_se_puede", "No se puede todavía", 40, null, null, true],
  ],
  quien_tarea: [
    ["fortius", "Fortius", 10, null, null, true], ["cliente", "El cliente", 20, null, null, true], ["abogado", "El abogado", 30, null, null, false],
    ["notaria", "La notaría", 40, null, null, false], ["otro", "Otra persona", 50, null, null, false],
  ],
  tipo_inmueble: [
    ["casa", "Casa", 10, "casa", null, false], ["departamento", "Departamento", 20, "departamento", null, false],
    ["terreno", "Terreno", 30, "terreno", null, false], ["local", "Local", 40, "local", null, false],
    ["oficina", "Oficina", 50, "oficina", null, false], ["nave_bodega", "Nave o bodega", 60, "nave-industrial", null, false],
    ["plaza_conjunto", "Plaza o conjunto", 70, "plaza", null, false],
  ],
  regimen: [
    ["escriturado", "Escriturado", 10, null, null, false], ["ejidal", "Ejidal", 20, null, null, false], ["posesion", "Posesión", 30, null, null, false],
    ["sucesion", "En sucesión", 40, null, null, false], ["fideicomiso", "Fideicomiso", 50, null, null, false],
  ],
  funcion_equipo: [["abogado", "Abogado", 10, null, null, false], ["valuador", "Valuador", 20, null, null, false]],
};

/** Los catálogos de inicio, en orden. Sus valores no tienen identificador de la base: no se pueden cambiar desde aquí. */
export const CATALOGOS_INICIALES: Catalogo[] = CATALOGOS.map((clave) => {
  const [nombre, ayuda, orden, fijo, significado_nombre, significados, padre, en_pantalla] = DEFINICIONES[clave];
  return {
    clave, nombre, ayuda, orden, fijo, significado_nombre, significados, padre, en_pantalla,
    valores: VALORES[clave].map(([v, etiqueta, o, significado, padreValor, de_sistema]) => ({
      id: `inicial-${clave}-${v}`, clave: v, etiqueta, orden: o, activo: true, significado, padre: padreValor,
      de_sistema, inicial: true, etiqueta_inicial: etiqueta, version: 1,
    })),
  };
}).sort((a, b) => a.orden - b.orden);

export const MAPA_INICIAL: Catalogos = Object.fromEntries(CATALOGOS_INICIALES.map((c) => [c.clave, c])) as Catalogos;
