# Fortius — plan de trabajo

Qué falta hacer y cómo va. Las reglas y decisiones están en [`SPEC.md`](SPEC.md); cómo debe ser el panel, en [`DECISIONES.md`](docs/diseno/nuevo-panel/DECISIONES.md). Si algo choca, mandan esos dos. El plan anterior y lo terminado quedaron en el historial de git (hasta el commit `1053449` del 16/11/2026).

**Actualizado:** 16 de noviembre de 2026.

## Dónde nos quedamos

- **El panel se reconstruye contra el boceto aprobado «Fortius por asuntos»** (DEC-68): Inicio, Asuntos, Inmuebles, Directorio, Biblioteca, Herramientas y Equipo. El boceto está en [`boceto-fortius-por-asuntos.html`](docs/diseno/nuevo-panel/boceto-fortius-por-asuntos.html).
- **Ninguna metodología es el centro** (DEC-67). El panel sirve para cualquier caso; se probará contra [`casos-reales.md`](docs/diseno/nuevo-panel/casos-reales.md).
- **Funciones aprobadas** (DEC-69 a DEC-71): apartados propios con vista, la lista de funciones de `SPEC.md`, inmueble siempre con asunto, sección Herramientas y formatos que se llenan por preguntas con datos que van y vienen del asunto.
- Todo el trabajo está en la rama `nuevo-panel`, subida a GitHub, sin publicar. Se revisa en localhost: `npm run dev -- --hostname 127.0.0.1 --port 3001`, ruta `/panel`.
- En `/panel` hay pantallas del diseño anterior (Hoy, Bandeja, Consultas, Trámites, Dinero y otras). Nunca se publicaron: se reemplazan una por una y lo que sobre se retira. Lo que sirve por dentro (base, permisos, folios, formatos, lectura de documentos) se reutiliza.
- En producción sigue el panel viejo (`/admin`), que no se toca hasta el final ([`LEGADO.md`](docs/diseno/nuevo-panel/LEGADO.md)). Lo último publicado en `main` es el PR #76 (14/11/2026).
- Lint, tipos y pruebas se corren solo antes de integrar a `main`, con el visto bueno del titular.

## Te toca a ti

1. **Activar los dos pasos del director** en fortiusinmuebles.com/admin con tu app de códigos y probar una entrada (AUT-01). Es lo único con riesgo real mientras no esté.
2. **Subir tu contenido, con calma:** la plantilla del presupuesto de honorarios, las listas de documentos y los planes de la Biblioteca, y los datos que quieres por cada tipo de inmueble. Mientras, se usa lo del boceto como ejemplo.
3. **Llevar al abogado** el paquete de revisión ([`revision-abogado-2026-11-15.md`](docs/legal/revision-abogado-2026-11-15.md)): formatos 20 al 24, antilavado, aviso de privacidad, registro de tratamiento y lectura automática de documentos reales. También firma electrónica y transcripción de llamadas, si se quieren.
4. **Pasar los datos de la empresa** (la persona moral) para los avisos de privacidad.
5. **Mandar una solicitud de prueba** desde el formulario de fortiusinmuebles.com (COR-21).
6. **Decidir** lo que queda abierto al final de `DECISIONES.md`, cuando la etapa que lo necesita llegue.

El día que cargues el inventario real se sigue [`paso-a-inventario-real.md`](docs/erp-crm/paso-a-inventario-real.md).

## Reconstrucción del panel

Orden propuesto. El primer paso lo confirma o lo cambia con lo que encuentre.

| Etapa | Qué entrega | Estado |
| --- | --- | --- |
| **0 · Inventario y base** | Qué se reutiliza, qué se rehace y qué se retira. Modelo de datos del boceto y sus migraciones nuevas. | Pendiente. |
| **1 · Cimientos** | Colores, letra, íconos y piezas comunes del boceto; menú lateral y barra del teléfono. | Pendiente. |
| **2 · Asuntos** | Lista y ficha con apartados que se agregan y se quitan. | Pendiente. |
| **3 · Consulta en vivo** | Captura durante la llamada que abre el asunto; solicitudes del sitio en Inicio. | Pendiente. |
| **4 · Inmuebles** | Lista y ficha completa: ficha técnica por tipo, fotos, video, 360, planos, ubicación y publicar. | Pendiente. |
| **5 · Apartados a fondo** | Plan, Documentos, Opinión jurídica, Honorarios y apartados propios con vista de lista, tabla, galería y texto. | Pendiente. |
| **6 · Documentos y Herramientas** | Formatos por preguntas, con datos que van y vienen del asunto; opinión de valor, ISR, gastos y contratos sueltos. | Pendiente. |
| **7 · Directorio y Biblioteca** | Personas con su asunto; listas y planes que se copian a un asunto. | Pendiente. |
| **8 · Inicio** | Por atender, hoy, esta semana, lo que se espera de otros y por cobrar. | Pendiente. |
| **9 · Equipo y asesor** | Vista del director y vista del asesor, con la visibilidad en la base. | Pendiente. |
| **10 · Funciones de la lista** | Las de orden 1 y 2 de `SPEC.md` que no hayan entrado en las etapas anteriores. | Pendiente. |
| **11 · Retiro** | Quitar las pantallas anteriores de `/panel` y, al final, el panel viejo `/admin`. | Pendiente. |

## Migraciones escritas sin aplicar

Son veinte, escritas para el diseño anterior; ninguna está aplicada (comprobado contra la base el 16/11/2026: la última aplicada es `20261114300000_restaurar_contactos`). **No se integran tal cual** (DEC-70). En la etapa 0 se reemplazan por las del modelo nuevo y estas se borran. Se rescata lo que sirva, sobre todo de `pn02_*` (varias personas con papel por asunto, quién lo lleva, historial, permisos), `nada_frena_solo_avisa`, `sin_frenos_de_proceso` y `pn_inmuebles_direccion_exacta`. Las 101 ya aplicadas no se tocan.

Archivos: `20261114400000_documentos_sin_operacion`, `20261115100000_prospecto_con_sus_tareas`, `20261115200000_nada_frena_solo_avisa`, `20261115210000_guias_por_tipo`, `20261116090000` a `20261116090600_pn02_*` (siete), `20261116090700_pn06_cola_de_la_bandeja`, `20261116091000_pn06_quitar_imagen_y_copia_firmada`, `20261116100000_sin_frenos_de_proceso`, `20261116110000_tramites_sin_frenos`, `20261116120000_pn08_movimientos_de_dinero`, `20261116130000_tramites_por_tipo`, `20261116140000_hora_de_la_tarea`, `20261116145000_pn_inmuebles_direccion_exacta` y `20261116150000_pn03_unir_personas`.

## Pendientes fuera del panel

- **AUT-01:** activar y probar los dos pasos del director; ensayar recuperación e invitación con una cuenta de prueba.
- **OBS-01:** repetir la prueba de alertas desde producción con un error controlado.
- **REC-01:** repetir el ensayo de restauración con un archivo subido y revisar la limpieza diaria de archivos. La copia diaria corre desde el 13/11.
- **ENV-01:** inventario de entornos y retiro del proyecto antiguo, sin ejecutarlo hasta aprobación; falta decidir el backend de pruebas.
- **PRV-01:** matriz de tratamiento de datos aprobada por el abogado ([registro](docs/erp-crm/privacy/data-processing-register.md)).
- **Cuentas y permisos del equipo** desde el panel: el titular las necesita desde el primer día (etapa 9).
- **COR-21:** comprobar que la solicitud de prueba del sitio llegue al panel.
- **Avisos de privacidad:** el responsable es la persona moral; faltan sus datos.
- **`npm audit`:** 3 avisos altos de una cadena solo de desarrollo (zod 3 dentro de lighthouse); corregirla pide subir lighthouse de versión mayor.
