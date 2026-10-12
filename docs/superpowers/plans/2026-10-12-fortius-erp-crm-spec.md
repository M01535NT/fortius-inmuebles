# Fortius ERP/CRM — alcance del producto y reglas de planificación

Fecha: 12 de octubre de 2026. Estado: **propuesta documental para revisión**. Autorizar este plan no equivale a publicar, aplicar migraciones ni contratar servicios.

## Resultado esperado

El personal puede conducir una operación inmobiliaria desde el primer contacto hasta el cierre y poscierre, con personas, inmueble, responsable, próxima acción, expediente, documentos y hechos financieros relacionados. La dirección puede abrir un indicador y rastrearlo hasta los registros y evidencias que lo componen. El panel se usa e instala en dispositivos compatibles; sus capacidades se prueban por plataforma.

## Base comprobada y límites

- Repositorio: `M01535NT/fortius-inmuebles`; checkout local `/workspace/mnt-inmuebles`.
- Base Git: `main`, `4faaa1234ade05b013994821585c52f9cb6cebd9`. Existen cambios previos sin consolidar; no pertenecen a la elaboración de este plan.
- Next.js 16.3.6, React 19.2.7, TypeScript 6.0.3, Supabase Auth/PostgreSQL/Storage, Zod, pdf-lib, Vitest y Playwright, según `package.json`.
- Sitio público, panel y Route Handlers comparten aplicación. No hay una separación público/admin que deba reproducirse por anticipación.
- Existen prospectos, clientes, asesores, inmuebles, tareas, calendario, expedientes, documentos, cartera comercial y reportes.
- Las colecciones de negocio combinan records JSONB con entidades SQL especializadas. No se ordena migrar todo el núcleo a tablas nuevas.
- `Cliente.tipo` es un papel único; `Property` no expone una relación estructurada de propietarios. Expedientes sí vinculan cliente, asesor e inmueble opcional.
- Hay estados distintos para prospectos, expedientes y oportunidades. Su equivalencia debe aprobarse; no se fusionan por coincidencia de etiqueta.
- La cartera comercial contiene indicadores potenciales y datos propios. No acredita ingreso cobrado ni una contabilidad conciliada.
- La PWA actual empieza en `/`; no se identificó service worker en el código inspeccionado. Instalación real del panel, dispositivos, offline y push no comprobados.
- Lecturas realizadas el 12/10: Supabase proyecto activo; Auth site_url correcto; GitHub Verify del commit base exitoso y main sin protección. Configuración administrativa de Vercel y recuperación integral no verificadas.
- `docs/audit-remediation-2026-10-10.md` distingue correcciones locales de cambios remotos históricos. Su contenido no sustituye una comprobación vigente.

## Alcance base

1. Confiabilidad: recuperación, autenticación, controles de publicación, observabilidad, entornos y permisos.
2. Personas y relaciones: prospectos, clientes, propietarios, compradores, representantes, agentes; organizaciones y varios papeles sin duplicar identidad.
3. Inventario: datos publicables separados de datos internos, propietarios y responsables, evidencias y estado de publicación.
4. Operaciones: expediente como primera referencia operativa, etapas, requisitos, excepciones, tareas y agenda.
5. Comercial: visitas, retroalimentación, ofertas/contraofertas, próximos pasos y vínculo estable con las carteras actuales.
6. Documentos: borrador, revisión, emisión, copia firmada y archivo; trazabilidad por versión y autor.
7. Técnico: levantamientos, fuentes, discrepancias, fotografías y revisiones.
8. Jurídico: requisitos, hallazgos y revisión profesional; el software no reemplaza dictámenes.
9. Financiero: presupuestos, obligaciones, comprobantes, cobros/egresos, comisiones y exportación operativa. Estados financieros certificados, CFDI y conexión bancaria no se presuponen.
10. Cuatro tableros: comercial, financiero, jurídico y técnico, con filtros y detalle de registros.
11. UX: navegación modular, búsqueda, vistas guardadas, formularios por contexto y trabajo diario por rol.
12. PWA: instalación y uso conectado; funciones adicionales de campo evaluadas por separado.
13. Crecimiento: paginación, integridad concurrente, carga de archivos, adopción, documentación y medición.

## Restricciones globales

- Conservar identidad Fortius, tipografías internas, contraste claro, animaciones pertinentes y accesibilidad.
- Conservar web pública, SEO, formularios, herramientas financieras, PDFs, inventario, rutas y edición de contenido.
- Conservar propiedades demo; excluir o incluirlas explícitamente en reportes operativos sin eliminarlas.
- Reutilizar componentes y contratos existentes; evitar dependencias nuevas sin una necesidad comprobada.
- Permisos en servidor y PostgreSQL/RLS; ocultar un botón no concede ni revoca acceso.
- Mantener control de versiones y conflictos; no sobrescribir una captura concurrente silenciosamente.
- No copiar datos personales a evidencias, logs, fixtures o documentación. Utilizar registros sintéticos.
- Verificar manuales y normativa vigente al definir reglas jurídicas/fiscales; las reglas requieren responsable y versión.
- No prometer resultados de conversión, rentabilidad, seguridad total, rendimiento ni disponibilidad sin medición.
- Aprobar antes de ejecutar cambios persistidos o infraestructura según el alcance y autorización vigente. La aprobación documental inicial permite trabajar en la implementación autorizada, pero no es autorización de producción.

## Decisiones propuestas y decisiones de negocio pendientes

| ID | Decisión | Tratamiento |
|---|---|---|
| DEC-01 | Mantener un monolito modular Next.js/Supabase | Recomendación técnica base del plan. |
| DEC-02 | Empezar por captación y venta; luego compra y renta | Prioridad propuesta; confirmar antes del primer diseño de operación. |
| DEC-03 | Administrador/asesor actuales conservados; capacidades de coordinación, jurídico, técnico y finanzas | Diseñar matriz; confirmar responsables y visibilidad antes de activar permisos. |
| DEC-04 | Propiedad/persona puede tener varias relaciones; una persona puede tener varios papeles | Aprobar vocabulario y pruebas. La vinculación registrada no certifica titularidad. |
| DEC-05 | Distinguir estados comercial, documental y financiero | Confirmar criterios de avance/cierre, excepciones y responsables. |
| DEC-06 | RPO/RTO, retención y tratamiento de archivos | Proponer opciones según plan real; no asumir umbrales contratados. |
| DEC-07 | Reglas de honorarios, impuestos capturados, monedas y tipo de cambio | Validación por propietario y especialista; no aplicar tasas por defecto. |
| DEC-08 | PWA conectada como primera versión; offline sensible desactivado | Confirmar qué captura de campo se necesita antes de diseñar almacenamiento local. |
| DEC-09 | Qué papel tiene inmobiliaria-os y dónde reside cada dato | Inventario previo a sincronización o reutilización. Sin dependencia productiva demostrada. |
| DEC-10 | Acceso a configuración GitHub/Vercel y entorno aislado | Dependencia externa para verificar publicación/recuperación, no para escribir este plan. |

## Criterios de producto terminado para la primera versión operativa

- Recorrido sintético prospecto → cliente → propietario relacionado → inmueble → expediente → tarea/visita → oferta → cierre documentado, sin registro duplicado provocado por reintentos.
- Persona, inmueble y operación tienen referencias durables. Un cambio de nombre o etiqueta no rompe vínculos.
- Dos asesores y un administrador de prueba ven exactamente su alcance; documentos y cifras sensibles respetan la misma regla.
- Cada tarea que requiere acción tiene responsable, estado y fecha o motivo explícito de ausencia de fecha.
- Recepción documental, revisión, conclusión profesional, firma y pago son hechos diferentes.
- Los cuatro tableros usan fuentes identificadas; sin fuente suficiente muestran pendiente. Su detalle reconcilia el total.
- Importes parciales, monedas y operaciones anuladas no se suman como cobros definitivos. Demo queda visible como dato de prueba.
- La aplicación abre el panel desde la instalación probada; conexión perdida y sesión caducada se entienden sin pérdida silenciosa de captura.
- Migraciones y restauración probadas en destino aislado; publicación con checks y revisión; manual operativo y transferencia completados.

## Capacidad futura condicionada

Arrendamientos recurrentes, proveedores/órdenes de trabajo, portales, correo/calendario externo, WhatsApp Business, CFDI, conciliación bancaria, firma electrónica, IA/RAG y bus de eventos son candidatos. Cada uno necesita caso de uso, fuente de verdad, responsable, costo, alcance legal y prueba de aceptación antes de entrar en ejecución. Las correcciones que hagan falta para cumplir los criterios base sí forman parte del alcance base.

## Evidencias de referencia

- `docs/architecture/as-is/architecture.md`, `docs/architecture/audit/findings.md`, `docs/architecture/to-be/architecture.md`.
- `docs/audit-remediation-2026-10-10.md`, `docs/admin-workspace.md`, `docs/formatos-admin-status.md`.
- `src/lib/backend/contracts.ts`, `src/data/propiedades.ts`, `src/lib/formatos/expediente-operations.ts`, `src/lib/comercial/types.ts`.
- `src/app/admin/reportes/page.tsx`, `src/app/manifest.ts`, `.github/workflows/verify.yml`.

Estado de aceptación de esta especificación: **en revisión por Moisés**. No atribuir una aprobación al silencio.
