// Reemplaza los datos de prueba del panel viejo por datos de prueba nuevos para el panel nuevo (regla del titular, 16/11/2026).
// Pasos (en este orden):
//   node --env-file=.env.local tools/panel-datos-prueba.mjs              → solo cuenta lo que hay (no cambia nada)
//   node --env-file=.env.local tools/panel-datos-prueba.mjs --respaldo   → guarda todo lo que se va a borrar en tmp/
//   tools/panel-datos-prueba-borrar.sql en el editor SQL de Supabase     → borra lo anterior en una sola transacción
//   node --env-file=.env.local tools/panel-datos-prueba.mjs --sembrar    → carga los datos de prueba nuevos
// El borrado va en SQL porque el rol de servidor no tiene permiso sobre todas las tablas (p. ej. lead_conversions).
// No toca asesores, configuración, contenido, blog, personal ni preferencias. No imprime credenciales ni datos personales.
// Solo vale mientras la base tenga datos de prueba (autorización del 17/10/2026); con inventario real, no se usa.
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const PROYECTO = 'https://qkkirjzhviqwvuqjnmei.supabase.co';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (url !== PROYECTO) throw new Error('El destino no es el proyecto de Fortius; no se hace nada.');
if (!key) throw new Error('Falta la credencial de servidor en .env.local.');
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const respaldo = process.argv.includes('--respaldo');
const sembrar = process.argv.includes('--sembrar');

const COLECCIONES = ['clientes', 'leads', 'propiedades', 'tareas', 'eventos', 'notas', 'archivos', 'tramites'];
// De hijos a padres: todas las relaciones de la base frenan el borrado (restrict).
const TABLAS = [
  'signed_copies', 'signature_events', 'integration_pages', 'integration_artifacts', 'integration_jobs',
  'formato_assets', 'formato_emissions', 'formato_drafts', 'app_shares', 'app_run_versions', 'app_runs', 'app_files',
  'ia_lecturas', 'expediente_archivos', 'expediente_datos', 'expediente_actividad', 'interviews', 'lead_conversions',
  'comercial_emissions', 'comercial_revisions', 'comercial_books',
].map((t) => `fortius_inmuebles_${t}`);

const sinPermiso = [];
async function leer(tabla, filtro = (q) => q) {
  const filas = [];
  for (let desde = 0; ; desde += 500) {
    const { data, error } = await filtro(db.from(tabla).select('*')).range(desde, desde + 499);
    if (error?.code === '42501') { sinPermiso.push(tabla); return filas; }
    if (error) throw new Error(`No se pudo leer ${tabla} (${error.code ?? error.message})`);
    filas.push(...data);
    if (data.length < 500) return filas;
  }
}
const porColeccion = (q) => q.in('collection', COLECCIONES);

// 1. Inventario
const inventario = {};
for (const t of TABLAS) inventario[t] = await leer(t);
inventario.fortius_inmuebles_expedientes = await leer('fortius_inmuebles_expedientes');
inventario.fortius_inmuebles_records = await leer('fortius_inmuebles_records', porColeccion);
inventario.fortius_inmuebles_record_references = await leer('fortius_inmuebles_record_references', (q) => q.or(`source_collection.in.(${COLECCIONES}),target_collection.in.(${COLECCIONES})`));
inventario.fortius_inmuebles_record_history = await leer('fortius_inmuebles_record_history', porColeccion);
inventario.fortius_inmuebles_record_revisions = await leer('fortius_inmuebles_record_revisions', porColeccion);
const cuentas = Object.fromEntries(Object.entries(inventario).map(([t, f]) => [t.replace('fortius_inmuebles_', ''), f.length]));
const publicados = inventario.fortius_inmuebles_records.filter((r) => r.collection === 'propiedades' && r.data?.publicada === true).length;
console.log(JSON.stringify({ hay: cuentas, inmueblesPublicadosHoy: publicados, sinPermisoDeLectura: sinPermiso.map((t) => t.replace('fortius_inmuebles_', '')) }, null, 2));

if (respaldo) {
  // Respaldo recuperable (tmp/ está ignorado por git). Las tablas sin permiso de lectura las respalda el respaldo completo del titular.
  await mkdir(new URL('../tmp/', import.meta.url), { recursive: true });
  const nombre = `datos-prueba-anteriores-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  await writeFile(new URL(`../tmp/${nombre}`, import.meta.url), JSON.stringify(inventario));
  console.log(`Respaldo guardado en tmp/${nombre}.`);
}
if (!sembrar) process.exit(0);
// La carga puede ir antes del borrado: el script SQL solo borra lo creado antes del corte en que se cargó lo nuevo.
console.log(`Corte para el borrado: ${new Date().toISOString()}`);

// 4. Datos de prueba nuevos, todos marcados como ejemplo
const ahora = new Date();
const dia = (d) => new Date(ahora.getTime() + d * 864e5).toISOString().slice(0, 10);
const iso = ahora.toISOString();
const asesores = (await leer('fortius_inmuebles_records', (q) => q.eq('collection', 'asesores'))).map((r) => r.id);
const asesor = (i) => asesores[i % Math.max(asesores.length, 1)] ?? '';

const personas = [
  ['Ana Ejemplo Ruiz', 'propietario', '6640001001', 'whatsapp', 'Enviarle el borrador del contrato', 1],
  ['Bruno Ejemplo Soto', 'comprador', '6640001002', 'llamada', 'Mandarle opciones en Playas', 0],
  ['Carla Ejemplo Mena', 'arrendador', '6640001003', 'whatsapp', 'Confirmar fotos del departamento', 3],
  ['Diego Ejemplo Lara', 'arrendatario', '6640001004', 'correo', 'Pedirle sus comprobantes de ingresos', -1],
  ['Elena Ejemplo Paz', 'inversionista', '6640001005', 'whatsapp', 'Revisar rendimiento del local', 7],
  ['Fernando Ejemplo Gil', 'propietario', '6640001006', 'llamada', '', null],
].map(([nombre, tipo, telefono, canal, accion, d]) => ({
  id: randomUUID(), nombre, tipo, telefono, notas: 'Persona de ejemplo para revisar el panel.', creadoEl: iso, actualizadoEl: iso,
  perfil: { canalPreferido: canal, ...(accion ? { proximaAccion: accion } : {}), ...(d !== null ? { proximoContacto: dia(d) } : {}) },
}));
const base = { amenidades: [], puntosDeInteres: [], destacada: false, creditoDisponible: true, demo: true, codigo: '' };
const inmuebles = [
  { titulo: 'Casa de ejemplo en Playas', tipo: 'casa', operacion: 'venta', zona: 'Playas de Tijuana', monto: 3450000, img: '/hero/casa-playa.webp', publicar: true, ficha: { recamaras: 3, banos: 2, construccionM2: 180, terrenoM2: 160 } },
  { titulo: 'Departamento de ejemplo en Zona Río', tipo: 'departamento', operacion: 'renta', zona: 'Zona Río', monto: 18500, img: '/hero/interior-depa.webp', publicar: true, ficha: { recamaras: 2, banos: 2, construccionM2: 95 } },
  { titulo: 'Local de ejemplo en plaza', tipo: 'local', operacion: 'renta', zona: 'Otay', monto: 25000, img: '/hero/interior-plaza.webp', publicar: true, ficha: { construccionM2: 70 } },
  { titulo: 'Nave de ejemplo en Tijuana', tipo: 'bodega', operacion: 'venta', zona: 'El Florido', monto: 0, img: '/hero/nave-tijuana.webp', publicar: false, ficha: { construccionM2: 900, terrenoM2: 1500 } },
  { titulo: 'Casa de ejemplo en captación', tipo: 'casa', operacion: 'venta', zona: 'Otay', monto: 2650000, img: null, publicar: false, ficha: { recamaras: 3, banos: 1 } },
].map((x, i) => {
  const slug = `ejemplo-${x.tipo}-${randomUUID().slice(0, 6)}`;
  return { slug, ...base, titulo: x.titulo, tipo: x.tipo, operacion: x.operacion, zona: x.zona, direccionAproximada: x.zona, ficha: x.ficha,
    precio: x.monto ? { modalidad: 'publico', monto: x.monto, moneda: 'MXN', ...(x.operacion === 'renta' ? { periodo: 'mensual' } : {}) } : { modalidad: 'consulta' },
    descripcion: [`${x.titulo}. Inmueble de ejemplo para revisar el panel; no es una oferta vigente.`],
    galeria: x.img ? [{ src: x.img, alt: `${x.titulo} (ejemplo)` }] : [],
    estado: x.img ? 'disponible' : 'evaluacion', publicada: false, publicadaEl: '', asesorId: asesor(i) };
  // La base exige la captación completa para publicar (COR-16): se cargan sin publicar; se publican desde el panel cuando su asunto lo permita.
});
// Propietarios ligados
personas[0].propiedadSlug = inmuebles[0].slug;
personas[2].propiedadSlug = inmuebles[1].slug;
personas[5].propiedadSlug = inmuebles[4].slug;

const consultas = [
  ['Gabriela Ejemplo', 'sitio', 'nuevo', 'Me interesa la casa en Playas, ¿sigue disponible?', -0.05],
  ['Héctor Ejemplo', 'whatsapp', 'nuevo', '¿Aceptan crédito Infonavit?', -0.2],
  ['Irene Ejemplo', 'llamada', 'contactado', 'Busca departamento en renta cerca de Zona Río.', -2],
  ['Jorge Ejemplo', 'sitio', 'contactado', 'Pregunta por el local en Otay.', -4],
].map(([nombre, canal, estado, mensaje, d]) => ({
  id: randomUUID(), nombre, canal, estado, origen: canal === 'sitio' ? 'sitio' : 'manual', mensaje, notas: [], telefono: '664 000 0000',
  creadoEl: new Date(ahora.getTime() + d * 864e5).toISOString(),
}));
const tareas = [
  ['Enviar borrador del contrato de intermediación', 1, 'captacion', 0],
  ['Agendar visita con Bruno', 0, 'visitas', 1],
  ['Pedir escritura al propietario', -2, 'documentacion', 0],
  ['Tomar fotos del departamento', 3, 'comercializacion', 2],
].map(([titulo, d, categoria, p]) => ({ id: randomUUID(), titulo, vence: dia(d), estado: 'pendiente', categoria, prioridad: 'normal', descripcion: '', pasos: [], creadoEl: iso, actualizadoEl: iso, asesorId: asesor(p), clienteId: personas[p].id }));

const insertar = async (collection, filas, id = (f) => f.id) => {
  const { error } = await db.from('fortius_inmuebles_records').insert(filas.map((data) => ({ collection, id: id(data), data })));
  if (error) throw new Error(`No se pudieron cargar ${collection} (${error.code}: ${error.message}).`);
};
await insertar('propiedades', inmuebles, (f) => f.slug);
await insertar('clientes', personas);
await insertar('leads', consultas);

// Asuntos (expedientes) ligados a persona e inmueble; las tareas se cuelgan de ellos.
const asuntos = [
  { cliente_id: personas[0].id, propiedad_slug: inmuebles[0].slug, operacion: 'venta', flujo: null, i: 0 },
  { cliente_id: personas[2].id, propiedad_slug: inmuebles[1].slug, operacion: 'renta', flujo: null, i: 1 },
  { cliente_id: personas[1].id, propiedad_slug: null, operacion: 'venta', flujo: null, i: 0 },
];
const creados = [];
for (const a of asuntos) {
  const { data, error } = await db.from('fortius_inmuebles_expedientes').insert({ cliente_id: a.cliente_id, asesor_id: asesor(a.i) || 'asesor-01', propiedad_slug: a.propiedad_slug, operacion: a.operacion, unidad: 'Ejemplo' }).select('id').single();
  if (error) throw new Error(`No se pudo crear un asunto de ejemplo (${error.code ?? error.message}).`);
  creados.push(data.id);
}
tareas[0].expedienteId = creados[0]; tareas[2].expedienteId = creados[0];
tareas[1].expedienteId = creados[2]; tareas[3].expedienteId = creados[1];
await insertar('tareas', tareas);

console.log(JSON.stringify({ cargado: { personas: personas.length, inmuebles: inmuebles.length, publicados: inmuebles.filter((x) => x.publicada).length, consultas: consultas.length, asuntos: creados.length, tareas: tareas.length } }, null, 2));
