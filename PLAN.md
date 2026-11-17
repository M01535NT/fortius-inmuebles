# Fortius — plan de trabajo

Qué falta hacer y cómo va. Las reglas y decisiones están en [`SPEC.md`](SPEC.md) (si algo choca, manda `SPEC.md`); lo terminado y el plan anterior completo, en el [historial](docs/erp-crm/historial-del-plan.md) (sección «Podado del plan el 16/11/2026»).

**Actualizado:** 16 de noviembre de 2026.

## Dónde nos quedamos — 16/11/2026

- El panel de administración se rehace desde los bocetos en `/panel`, por etapas PN-00 a PN-12 (tabla de abajo). El panel viejo (`/admin`) es legado: no se le agrega nada y desaparece en PN-12 ([`LEGADO.md`](docs/diseno/nuevo-panel/LEGADO.md)).
- Todo el trabajo está en la rama `nuevo-panel`, sin publicar. `feat/integracion` quedó integrada en ella el 16/11/2026. Se revisa en localhost: `npm run dev -- --hostname 127.0.0.1 --port 3001`, ruta `/panel`.
- PN-00 y PN-01 están hechas. De PN-03 a PN-10 hay pantallas construidas y comparadas tres veces con el lienzo de bocetos; falta la revisión del titular.
- PN-02 (modelo base y permisos) está escrita y aprobada por el titular (16/11/2026). Sus migraciones y las demás de la rama se aplican al integrar en `main`; hasta entonces varias funciones avisan «no disponible» sin romper la pantalla.
- Lo último publicado en `main` es el PR #76 (14/11/2026): Trámites (TRA-01), el panel viejo desde cero y la paleta del sitio.
- Lint, tipos y pruebas se corren solo antes de integrar a `main`, con el visto bueno del titular.
- **Boceto nuevo aprobado (DEC-68, 16/11/2026):** «Fortius por asuntos» define la estructura (Inicio, Asuntos, Inmuebles, Directorio, Biblioteca, Equipo), la consulta en vivo, los apartados del asunto y el aspecto. [`DECISIONES.md`](docs/diseno/nuevo-panel/DECISIONES.md) se reescribió con eso. Falta planear la reconstrucción de `/panel` contra el boceto: el roadmap PN de abajo describe las pantallas anteriores (revisar: reordenarlo cuando el titular diga por dónde empezar).
- **Funciones aprobadas (DEC-69, 16/11/2026):** apartados propios con vista (lista, tabla, galería, texto) y la lista de funciones de `SPEC.md`, con su orden. AUD-07 quedó como registro de las pantallas anteriores: sus hallazgos no se corrigen uno por uno, sirven de lista de errores a no repetir.
- **La metodología ya no es la columna vertebral (DEC-67, 16/11/2026).** La app debe servir para cualquier caso inmobiliario. El asunto se rediseña con los casos reales del titular ([`casos-reales.md`](docs/diseno/nuevo-panel/casos-reales.md)) antes de seguir con PN-04 y PN-07; de AUD-07, lo que toca al asunto (lista de documentos, avisos, pestañas) espera ese rediseño.

## Te toca a ti

1. **Activar los dos pasos del director** en fortiusinmuebles.com/admin con tu app de códigos y probar una entrada (AUT-01). Es lo único con riesgo real mientras no esté.
2. **Revisar el panel nuevo** en localhost (`/panel`). Lo que siga mal se anota como corrección. El recorrido del asesor del 16/11/2026 ([AUD-07](docs/diseno/nuevo-panel/auditorias/AUD-07-2026-11-16-recorrido-del-asesor.md)) dejó 86 hallazgos sin corregir y cinco choques con lo escrito por decidir.
3. **Decidir cuándo publicar** `nuevo-panel` en `main` (un solo PR en borrador). De eso dependen PN-02, los vencimientos de los asuntos en Agenda, unir duplicados, archivar y los movimientos de Dinero.
4. **Llevar al abogado** el paquete de revisión ([`revision-abogado-2026-11-15.md`](docs/legal/revision-abogado-2026-11-15.md)): formatos 20 al 24, el umbral de 10,000 UMA del 24, la conservación de 10 años del expediente LFPIORPI, «nada frena, solo avisa» en antilavado y promesa, el aviso de privacidad, el registro de tratamiento (PRV-01) y la lectura automática de documentos reales.
5. **Mandar una solicitud de prueba** desde el formulario de fortiusinmuebles.com (COR-21).
6. **Pasar los datos de la empresa** (la persona moral) para los avisos de privacidad.
7. **Decisiones del panel nuevo** (detalle en [`DECISIONES.md`](docs/diseno/nuevo-panel/DECISIONES.md)):
   - si la comisión se anota al firmar o solo al cerrar (AUD-06);
   - si los compradores son clientes y la búsqueda es un asunto (AUD-01, hallazgo 1);
   - si las pestañas de una ficha quedan fuera de la regla del desplegable;
   - ligar una consulta a una ficha que ya existe («Unir con su ficha»): necesita una migración con tu visto bueno;
   - si publicar un inmueble sigue exigiendo la captación completa o pasa a ser aviso (COR-16) (revisar si sigue, tras DEC-61);
   - si «Se logró» se marca directo (revisar si sigue, tras DEC-55);
   - los apartados y la promesa del formato 15, porque la promesa dice que Fortius no custodia la garantía (revisar si sigue, tras DEC-56);
   - el destino de las secciones sin boceto (reportes, blog, contenido, apps, ayuda, papelera, sistema), antes de PN-12.
8. **Decidir cuando llegue su momento:** recorrido propio de la renta (DEC-02), vocabulario de papeles de una persona (DEC-04), custodia y retención de copias (DEC-06) y el backend de pruebas (ENV-01 c). El texto de cada una está en `SPEC.md`.

El día que cargues el inventario real se sigue [`paso-a-inventario-real.md`](docs/erp-crm/paso-a-inventario-real.md).

## Panel nuevo (PN) — roadmap

Qué hace cada pantalla: [`DECISIONES.md`](docs/diseno/nuevo-panel/DECISIONES.md). Reglas: RP-100 a RP-108 en `SPEC.md`. Auditorías de lógica: `docs/diseno/nuevo-panel/auditorias/`. Todo está en `nuevo-panel`, sin publicar.

| Etapa | Qué entrega | Estado |
| --- | --- | --- |
| **PN-00 · Cimientos y aislamiento** | Ruta `/panel`, sistema de diseño claro y oscuro, íconos y logo, menú que se ordena arrastrando, aislamiento del panel viejo. | Hecha. |
| **PN-01 · Kit y armazón** | Componentes base, «Buscar o crear» con Ctrl K, atajos, arrastrar y soltar, muestrario en `/panel/kit`. | Hecha, con revisión de teclado y accesibilidad. Falta la revisión del titular. |
| **PN-02 · Modelo base y permisos** | Asuntos con personas (con papel) e inmuebles, miembros, `pendientes`, historial con actor, responsable y creador en todo, folios reservados, notas internas, RLS. | Migraciones escritas, ensayadas y corregidas con AUD-04; aprobadas por el titular. Se aplican al integrar en `main`. |
| **PN-03 · Personas e Inmuebles** | Fichas maestras, búsqueda, aviso de duplicado, compartir inmueble. | Alta, edición, propietario, llaves, fotos, textos, publicar, archivar, persona moral y unir duplicados construidos. Unir y archivar esperan PN-02. |
| **PN-04 · Asuntos, Hoy y Agenda** | Asuntos con documentos, notas y actividad; Hoy y Agenda como vistas de pendientes. | Construidos con lectura y escritura. Faltan el título libre, varias personas con papel y los vencimientos de los asuntos en Agenda, que llegan con PN-02. |
| **PN-05 · Consultas** | Cola de quienes escriben, respuesta lista, persona y asunto desde la consulta. | Construida. Falta «Unir con su ficha» (migración por aprobar). Bandeja y Consultas siguen separadas (DEC-60). |
| **PN-06 · Archivos y Formatos** | Bandeja con destino elegido a mano; Formatos con captura sobre el documento. | Construidas. La cola de la Bandeja en el servidor y quitar imagen o copia firmada esperan sus migraciones. La lectura automática sigue sin activar. |
| **PN-07 · Guías y Trámites** | Trámites como asuntos con guía; cancelación de hipoteca. | Trámites completo según el boceto. Faltan las demás guías, que esperan confirmar sus pasos con fuente oficial, y que el trámite sea un asunto (PN-02). |
| **PN-08 · Dinero** | Te deben, por entregar, historial, recibos, movimientos. | Construido con movimientos, apartados con comprobante y gastos; los movimientos esperan su migración. |
| **PN-09 · Herramientas y Configuración** | Calculadoras de crédito, comisión y costos de cierre; perfil, apariencia, avisos, equipo. | Construidas. Faltan invitar de verdad, quitar acceso, roles por persona y guardar tema y avisos en el servidor. |
| **PN-10 · Rol de asesor** | Las mismas pantallas con «solo lo mío», asignación y reparto de comisión. | Filtro «Lo lleva» y «Pasar a otro asesor» hechos. Falta probar con una cuenta de asesor y el reparto de comisión. |
| **PN-11 · Equipo (chat)** | Temas, mensajes directos, menciones, no leídos. | Pendiente, al final por decisión del titular. |
| **PN-12 · Cambio y retiro del panel viejo** | `/panel` pasa a `/admin` y se retira el código viejo. | Pendiente. Antes, decidir el destino de las secciones sin boceto. |

## Pendientes fuera del panel

- **AUT-01:** activar y probar los dos pasos del director; ensayar recuperación e invitación con una cuenta de prueba.
- **OBS-01:** repetir la prueba de alertas desde producción con un error controlado.
- **REC-01:** repetir el ensayo de restauración con un archivo de la Bandeja y revisar la limpieza diaria de archivos. La copia diaria corre desde el 13/11.
- **ENV-01:** inventario de entornos y retiro del proyecto antiguo, sin ejecutarlo hasta aprobación; falta decidir el backend de pruebas.
- **PRV-01:** matriz de tratamiento de datos aprobada por el abogado ([registro](docs/erp-crm/privacy/data-processing-register.md)); incluye dónde se guardan los archivos que esperan destino en la Bandeja.
- **SEG-01 y USR-01:** permisos por función y cuentas del equipo desde el panel; el titular las necesita desde el primer día (se construyen en PN-09 y PN-10).
- **COR-21:** comprobar que la solicitud de prueba del sitio llegue al panel con su plazo.
- **Avisos de privacidad:** el responsable es la persona moral; faltan sus datos.
- **Revisión del abogado:** el paquete de [`revision-abogado-2026-11-15.md`](docs/legal/revision-abogado-2026-11-15.md); sin su visto bueno nada de eso se usa con clientes reales.
- **TRA-01:** confirmar con el primer caso real que el Registro acepte la carta de Infonavit tal cual.
- **`npm audit`:** 3 avisos altos de una cadena solo de desarrollo (zod 3 dentro de lighthouse); corregirla pide subir lighthouse de versión mayor.
- **FLX-02 y FLX-03** (panel viejo, en `feat/integracion`): faltaba la revisión del titular (revisar si sigue, ahora que el panel viejo es legado).
- **Suite de navegador del panel viejo:** el 14/11 dio 20 fallas ajenas a LV-10, por corregir antes del PR (revisar si sigue).
- **Después de empezar a operar:** las entregas del backlog anterior (clientes, venta, dinero, tableros, escala, extensiones y la etapa para otras inmobiliarias, en pausa) quedan en el historial; el titular elige qué sigue según el uso real.

## Migraciones escritas sin aplicar

**Decisión del 16/11/2026 (DEC-70):** estas veinte se escribieron para el diseño anterior y ninguna está aplicada (comprobado contra la base: la última aplicada es `20261114300000_restaurar_contactos`). No se integran tal cual. Al diseñar el modelo de datos del boceto se reemplazan por migraciones nuevas y estas se borran; se rescata lo que siga sirviendo, sobre todo de `pn02_*` (varias personas con papel por asunto, responsable, historial, permisos), `nada_frena_solo_avisa`, `sin_frenos_de_proceso` y `pn_inmuebles_direccion_exacta`. Las 101 ya aplicadas no se tocan.

Se aplican solas al integrar en `main`: `20261114400000_documentos_sin_operacion`, `20261115100000_prospecto_con_sus_tareas`, `20261115200000_nada_frena_solo_avisa`, `20261115210000_guias_por_tipo`, `20261116090000` a `20261116090600_pn02_*` (siete), `20261116090700_pn06_cola_de_la_bandeja`, `20261116091000_pn06_quitar_imagen_y_copia_firmada`, `20261116100000_sin_frenos_de_proceso`, `20261116110000_tramites_sin_frenos`, `20261116120000_pn08_movimientos_de_dinero`, `20261116130000_tramites_por_tipo`, `20261116140000_hora_de_la_tarea`, `20261116145000_pn_inmuebles_direccion_exacta` y `20261116150000_pn03_unir_personas`.
