# Modelo de datos del panel por asuntos

Detalle técnico de la etapa 0 de `PLAN.md`, para el agente que construya las etapas siguientes. Manda `SPEC.md`; si este documento lo contradice, se corrige este.

**Estado (17/11/2026):** autorizado por el titular el 16/11/2026.

- Las 20 migraciones sin aplicar del diseño anterior se borraron (quedan en el historial de git).
- Escritos los bloques 1 a 4 (sección 5): `20261116200000_panel_01_folios_y_comunes.sql`, `20261116200100_panel_02_asuntos_y_apartados.sql`, `20261116200200_panel_03_personas.sql` y `20261116200300_panel_04_plan_y_tareas.sql`. Sin aplicar: se aplican solos al integrar en `main`.
- Escrito para la etapa 3 (17/11/2026) `20261116200400_panel_05_consulta.sql`: el núcleo de inmuebles (`inmuebles`, `asunto_inmuebles`, `crear_inmueble`, `puede_ver_inmueble`), el núcleo de documentos (`asunto_documentos`, `documento_archivos`, `cargas_por_acomodar`), `consultas` con `abrir_asunto_desde_consulta` y `consulta_a_contacto`, y las llaves foráneas pendientes de los bloques 3 y 4. El bloque 4 admite además `origen = 'consulta'` en tareas.
- Escrito para la etapa 4 (17/11/2026) `20261117100000_panel_06_inmuebles.sql`: `inmueble_medios`, `inmueble_precios` (con su disparador), la llave de `portada_id`, el enlace público, `copiar_inmueble` («Agregar otro igual»), `inmuebles_publicos()` y su entrada en `public_records('propiedades')`.
- Diferencias con la sección 4.4: en `inmueble_medios` la columna se llama `tipo` (no `clase`), el pie es `alt`, quitar marca `retirado_el` (el archivo se queda, así que no hace falta `public_files_in_use`) y `url` va siempre (la pública si se subió; `path` solo en lo subido). `inmueble_precios` guarda también el precio y la moneda de antes, y el motivo llega en la columna `inmuebles.motivo_precio`, que el disparador vacía. Se agregó `inmuebles.mapa` (enlace privado). El enlace público es el folio en minúsculas y nace al publicar por primera vez. La proyección se suma al principio de `public_records` (no `union all`): misma forma, sin fotos no sale, `asesorId` va vacío y un compartido sale «en colaboración».
- Quedan para su etapa: solicitudes del sitio y avisos personales (etapa 8); Biblioteca (etapa 7).
- Escrito para la etapa 5 (17/11/2026) `20261117200000_panel_07_apartados.sql`, que junta los bloques 7, 8, 9 y las ligas del cliente del 6: `situacion_puntos`, `opiniones` y `opinion_puntos`; `presupuestos` (con la tarea de seguimiento al enviarlo), `presupuesto_conceptos` y `cobros`; `interesados`, `interesado_inmuebles` y `ofertas` (la llave pendiente de `tareas.interesado_id`); `ligas_cliente`; y `continuar_asunto`. Sin aplicar: se aplica solo al integrar en `main`.
- Escrito para la etapa 6 (17/11/2026) `20261117300000_panel_08_documentos_y_herramientas.sql`: `trabajos` (un formato por preguntas o una cuenta de Herramientas, en un asunto o suelto; reemplaza la idea de reutilizar `app_runs`, que está ligada a los expedientes viejos), la columna `asunto_documentos.trabajo_id` y `inmueble_datos_legales` (folio real, clave catastral, escritura y demás datos privados que piden los contratos). Sin aplicar: se aplica solo al integrar en `main`.
- Diferencias con las secciones 4.5 a 4.9: todas las tablas nuevas usan un solo disparador de alcance, `guard_del_asunto`, en lugar de uno por tabla; en `situacion_puntos` el dato va en `valor` (jsonb) para admitir sí/no, número o texto; la liga del cliente guarda solo la huella del enlace y cuenta lo subido (tope de 60); `interesado_inmuebles` lleva también `asunto_id` para que la permisión se lea sin unir tablas; `continuar_asunto` copia los renglones y el servidor copia los archivos. Todavía no hay custodias, reparto de comisión ni la vista de lo que falta cobrar (etapas 8 a 10). La consulta del asunto trae además el enlace público (`slug`) de sus inmuebles, para mandar la ficha a un interesado.
- Diferencias con la sección 4.11: los datos de siempre se quedan en `consultas.datos` y Situación los lee de ahí hasta que exista `situacion_puntos` (etapa 5); el canal de la consulta es una lista fija (`llamada`, `whatsapp`, `en_persona`, `sitio`, `otro`).

---

## 1. Punto de partida

### La base hoy

- **101 migraciones aplicadas**, la última `20261114300000_restaurar_contactos`.
- Había **20 migraciones sin aplicar** (de `20261114400000` a `20261116150000`), escritas para el diseño anterior. Se borraron; ver la sección 6.
- **31 tablas**, todas con RLS. Solo datos de prueba.
- La tabla `fortius_inmuebles_records` es un almacén genérico en jsonb por colección: `posts` (27), `clientes` (23), `tareas` (22), `propiedades` (16), `leads` (16), `archivos` (7), `eventos` (3), `asesores` (2), `notas`, `contenido`, `config`, `tramites` (1 cada una). La validan `validate_record`, `validate_task`, `validate_tramite` y muchas guardas de proceso.
- `fortius_inmuebles_expedientes` es el «asunto» del panel provisional: exige `cliente_id`, `operacion` y `etapa`, y carga guardas del flujo guiado (`guard_guided_operation`, `guard_expediente_lifecycle`, `guard_initial_gate`, etc.).
- El sitio público lee los inmuebles **solo** por la función `fortius_inmuebles_public_records(p_collection)` (`src/lib/backend/public.ts`). Esa función es la frontera de lo publicado.
- Buckets: `fortius-inmuebles-public` (público, fotos del sitio), `-private`, `-expedientes`, `-staging`, `-comercial` y `fortius-app-integrations` (todos privados).
- Funciones de permiso: `is_admin()` (director con segundo paso), `is_staff()` (director o asesor), `current_asesor_id()`, `can_access_expediente()`, `can_access_client_id()`.
- Folios: `EXP-` se calcula con el máximo de `expedientes.folio`; `FORTIUS-` con el máximo de `propiedades.codigo` en `records` y en su historial. Los dos usan el candado `pg_advisory_xact_lock(781023)`.

### El código del panel hoy

- No tiene acciones de servidor: todo es cliente que llama a `/api/admin/*`, y esas rutas usan `src/lib/backend/`.
- Ya habla con tablas que **no existen en la base** (`asunto_personas`, `asunto_inmuebles`, `historial`, `pendientes`, `movimientos`, `bandeja`): son de las migraciones sin aplicar; la pantalla usa un respaldo cuando la ruta responde `disponible:false`.

---

## 2. Decisión de fondo

**El panel nuevo usa tablas propias, relacionales, y no reutiliza `expedientes` ni las colecciones de `records` para asuntos, personas, tareas, consultas ni trámites.**

Por qué:

1. El panel provisional debe seguir igual hasta la etapa 11. Sus guardas de proceso viven en `expedientes` y en `records`; meter el modelo nuevo ahí obliga a reescribirlas o a que frenen lo que el SPEC dice que solo avisa.
2. El SPEC pide cosas que el jsonb genérico no cuida bien: un inmueble siempre ligado a un asunto, el papel de cada persona por asunto, la moneda en cada cantidad, el historial de precio, tareas con dependencia y repetición.
3. Ya se decidió que el panel nuevo empieza con datos nuevos; no hay que convivir con los registros viejos.

Lo que **sí** se comparte con lo existente:

- **Cuentas y roles:** `staff` y `adviser_accounts`, y las funciones `is_admin()` e `is_staff()`. Director = `role 'admin'`; asesor = `role 'editor'`.
- **El sitio público:** se amplía `public_records('propiedades')` para que devuelva también los inmuebles nuevos publicados, con la **misma forma** de datos. El código del sitio no cambia.
- **Folios:** un libro único de folios reservados (rescatado de las migraciones sin aplicar) que parte del máximo actual de `EXP-` y `FORTIUS-`. Los folios nuevos nunca chocan con los viejos ni se reutilizan.
- **Formatos y PDF:** `formato_drafts`, `formato_emissions`, `formato_assets` y `signed_copies` siguen siendo el motor. Se les agrega `asunto_id` opcional (hoy cuelgan de `expediente_id`).
- **Herramientas:** `app_runs` y `app_run_versions` ya son «trabajos sueltos»; se les agrega `asunto_id` opcional.
- **Lectura de documentos:** `ia_lecturas` y su reserva de saldo se reutilizan; se agrega `documento_archivo_id`.
- **Preferencias:** `user_preferences` guarda favoritos, recientes y vistas guardadas.
- **Límites y respaldo:** `rate_limits`, la copia diaria y los buckets.

Responsable de cada cosa: **`uuid` del usuario (`staff.user_id`)**, no el texto `asesor_id` del panel viejo. Así la RLS compara directo con `auth.uid()`. La ficha `asesores` de `records` se sigue usando solo para nombre y datos de contacto, por `adviser_accounts`.

Prefijo de tablas: `fortius_inmuebles_` como las demás. Abajo se omite.

---

## 3. Reglas comunes a todas las tablas nuevas

- `id uuid` por defecto `gen_random_uuid()`.
- `version bigint` con disparador que la sube; si el cliente manda una versión vieja, error `PT409` (se conserva el conflicto 409).
- `created_at`, `updated_at`, `creado_por uuid default auth.uid()`.
- **Borrado recuperable:** `deleted_at`, `deleted_by`. Nada se borra de golpe; «Deshacer» limpia `deleted_at`.
- **Historial automático:** un disparador por tabla anota en `historial` cada alta, cambio (con los campos que cambiaron) y borrado, con el actor en sesión.
- **Ejemplo:** `es_ejemplo boolean default false` en asuntos, personas, inmuebles y consultas. La pantalla lo muestra.
- **Nada frena:** ninguna tabla nueva rechaza un cambio por falta de un dato, un documento o un paso. Solo rechaza lo que es protección: permisos, versión vieja, datos inválidos (formato, largo, moneda), privacidad de lo publicado y registros que solo se agregan.
- **Dinero:** `numeric(14,2)` y siempre junto a `moneda text check (moneda in ('MXN','USD'))`. No hay sumas entre monedas en la base; las vistas agrupan por moneda.
- **Escritura:** las rutas del servidor validan entrada, sesión, rol y alcance, y escriben con la sesión del usuario para que la RLS también lo cuide. Lo que toca varias tablas a la vez (abrir asunto desde la consulta, continuar en un asunto nuevo, unir personas, cerrar) va en una función `security definer` de una sola transacción.

---

## 4. Las tablas

### 4.1 Visibilidad

```
puede_ver_asunto(p_asunto uuid) → boolean
  is_admin()
  or (is_staff() and exists asunto activo con responsable_id = auth.uid())
  or (is_staff() and exists asunto_miembros activo con usuario_id = auth.uid())
```

- Todo lo que cuelga de un asunto (personas del asunto, inmuebles, documentos, plan, dinero, apartados, historial) se ve si se ve el asunto.
- **Personas:** se ven si `is_admin()`, si `responsable_id = auth.uid()` o si están en un asunto que se ve.
- **Inmuebles:** se ven si se ve alguno de sus asuntos. Lo publicado lo ve cualquiera en el sitio, por la proyección pública, no por la tabla.
- **Consultas, contactos y solicitudes:** el director todo; el asesor lo que tiene asignado.
- **Biblioteca:** la lee todo el equipo; la escribe el director.
- Lo que un asesor ve de lo de otro asesor está por decidir (SPEC, sección 18). Mientras tanto: **nada**, salvo que se le comparta (`asunto_miembros`).

### 4.2 Asuntos

**`asuntos`**

| Columna | Tipo | Nota |
| --- | --- | --- |
| `folio` | text único | `EXP-000031`, lo pone la base desde el libro de folios. Inmutable |
| `nombre` | text 1–160 | Se puede cambiar |
| `encargos` | text[] no vacío | Subconjunto de `revisar`, `comercializar`, `tramitar`, `asesorar` |
| `en_que_va` | text | `estudio`, `propuesta`, `en_marcha`, `por_cobrar`, `cerrado` |
| `en_espera` | boolean | Con `espera_motivo` y `espera_hasta date`. Mientras está en espera, no cuenta como atrasado |
| `resultado` | text | `se_logro` / `no_se_dio`, con `motivo_cierre`. Obligatorio solo si `en_que_va = 'cerrado'` (es integridad, no proceso) |
| `cerrado_el` | timestamptz | |
| `capto_id`, `vendio_id` | uuid → staff | Se anotan al cerrar; con ellos se calcula el reparto |
| `responsable_id` | uuid → staff | Lo cambia el director |
| `viene_de` | uuid → asuntos | «Continuar en un asunto nuevo» |
| `consulta_id` | uuid → consultas | De qué consulta nació |
| `situacion` | text | «Lo que se sabe», libre |

- Reabrir = volver `en_que_va` a otro valor y limpiar `resultado`.
- Cambiar `en_que_va`, `responsable_id` o la espera queda en `historial` con su texto en palabras.
- Las propuestas «¿Pasar a En marcha?» y «¿Cerrar el asunto?» las hace la pantalla; la base nunca cambia `en_que_va` sola.

**`asunto_miembros`** (rescatada): asesores que colaboran, con su `porcentaje` opcional y `retirado_el`. El responsable no va aquí.

**`apartados`**

| Columna | Nota |
| --- | --- |
| `asunto_id` | |
| `clave` | `personas`, `inmueble`, `interesados`, `situacion`, `documentos`, `opinion`, `honorarios`, `plan`, `historial` o `propio` |
| `visible` | Quitar = `false`; lo capturado se conserva |
| `orden` | |
| `nombre`, `icono` | Solo en los propios |
| `vista` | `lista`, `tabla`, `galeria`, `texto` (solo propios). Cambiar la vista no toca las filas |
| `columnas` | jsonb: `[{clave, nombre, tipo: texto|numero|dinero|fecha|si_no|lista, opciones?}]` |
| `texto` | Para la vista texto |
| `biblioteca_id` | Si vino de la Biblioteca |

- Único `(asunto_id, clave)` salvo `propio`.
- Personas, Plan e Historial se crean siempre y no se pueden ocultar.
- Los demás se crean al abrir el asunto según `encargos`: `comercializar` → Inmueble e Interesados; `revisar` → Situación, Documentos y Opinión jurídica; `tramitar` → Inmueble y Documentos; `asesorar` → Situación, Documentos y Honorarios. Honorarios va en todos salvo que se quite. La tabla exacta vive en `src/lib/panel/` y se ajusta sin migración.

**`apartado_filas`** (apartados propios): `apartado_id`, `datos jsonb` (llaves = `columnas.clave`), `hecho boolean` (vista lista), `foto_path` (vista galería, bucket privado), `orden`. Al cambiar de vista se leen las mismas filas.

### 4.3 Personas

**`personas`**

| Columna | Nota |
| --- | --- |
| `clase` | `persona`, `empresa`, `institucion` |
| `nombre` | Cómo se le dice |
| `representante_id` | → personas, para empresas e instituciones |
| `fallecida` | Sin teléfono ni botones de contacto (la pantalla los apaga; la base no exige teléfono) |
| `telefonos` | jsonb `[{pais:'+1', numero:'6195550142', etiqueta}]`; se guarda también `telefono_normal` (solo dígitos con clave) para buscar duplicados |
| `correo` | |
| `no_contactar` | Apaga llamar y escribir en todas las pantallas |
| `canal` | Por dónde llegó |
| `volver_a_llamar` | date, para contactos sin asunto; aparece en Inicio |
| `responsable_id` | uuid → staff |
| `nota` | |

- Duplicados: índice no único sobre `telefono_normal` y `lower(correo)`. La pantalla avisa y ofrece usar la misma ficha; la base no lo impide.
- **Cliente** no es columna: se calcula (tiene un contrato con Fortius en estado firmado en algún asunto). Antes, prospecto.

**`persona_datos_legales`** (1 a 1, aparte para que ninguna lista los traiga por accidente): `persona_id`, `nombre_completo`, `estado_civil` (texto: las opciones salen de la plantilla del titular), `curp`, `rfc`, `identificacion` (tipo y número), `domicilio` jsonb, `nacionalidad`, `ocupacion`, `version`. Misma RLS que la persona. La pantalla muestra CURP y RFC ocultos; nunca salen en la API pública, Storage público, HTML ni PDF que no sea un formato del asunto.

**`asunto_personas`**: `asunto_id`, `persona_id`, `papel`, `inmueble_id` opcional (el inquilino del local 5), `nota`, `principal`, `retirado_el`. Papeles del SPEC: `contacto`, `propietario`, `titular`, `heredero`, `copropietario`, `comprador`, `vendedor`, `inquilino`, `inversionista`, `contraparte`, `apoderado`, `abogado`, `notaria`, `banco` (apoderado y banco, titular 16/11/2026). Único `(asunto_id, persona_id, papel, inmueble_id)`. La llave foránea de `inmueble_id` llega en el bloque 4.

**`persona_uniones`** (rescatada): registro de fichas unidas, sin cadenas. La función `unir_personas` (rescatada y reescrita) pasa asuntos, tareas, interesados y consultas a la ficha que se queda, en una transacción, solo el director, con 409.

### 4.4 Inmuebles

**`inmuebles`**

| Columna | Nota |
| --- | --- |
| `folio` | `FORTIUS-000011`, del libro de folios. Inmutable |
| `slug` | Para el sitio. Único entre inmuebles nuevos y `propiedades` de `records` |
| `nombre` | |
| `tipo` | `casa`, `departamento`, `terreno`, `local`, `oficina`, `nave_bodega`, `plaza_conjunto` |
| `operacion` | `venta`, `renta` |
| `conjunto_id` | → inmuebles de tipo `plaza_conjunto` |
| `unidades_total` | Solo en conjuntos; las libres se calculan de sus unidades |
| `precio`, `moneda` | |
| `estado` | `libre`, `apartado`, `rentado`, `vendido`, `retirado` |
| `ficha` | jsonb con los datos propios del tipo (la lista de campos por tipo vive en `src/lib/panel/` y se valida en el servidor; el titular la ajusta sin migración) |
| `colonia`, `ciudad`, `referencias` | Públicos |
| `direccion_exacta` | Privada |
| `mostrar_direccion` | Interruptor; apagado por omisión |
| `lat`, `lng` | |
| `descripcion` | Para el sitio |
| `publicado`, `publicado_el`, `publicado_por` | Guardar no publica |
| `compartido`, `inmobiliaria` | Inmueble de otra inmobiliaria: el sitio no muestra datos del dueño |
| `portada_id` | → inmueble_medios |

**`asunto_inmuebles`**: `asunto_id`, `inmueble_id`, `estado` en ese asunto, `cerrado_el`, `resultado`, `retirado_el`. Así un asunto lleva varios inmuebles, cada uno con su cierre, y «Continuar en un asunto nuevo» liga el mismo inmueble sin copiarlo ni cambiar su folio.

- **Un inmueble siempre pertenece a un asunto:** no hay `insert` directo; se crea con la función `crear_inmueble`, que crea o recibe el asunto y la liga en la misma transacción. Un disparador impide quitar la última liga activa (es integridad, no proceso).

**`inmueble_precios`** (solo se agrega): `inmueble_id`, `precio`, `moneda`, `motivo`, `actor_id`, `created_at`. Un disparador la llena cada vez que cambia `precio` o `moneda`; el motivo llega en la misma escritura.

**`inmueble_medios`**: `inmueble_id`, `clase` (`foto`, `video`, `recorrido_360`), `path` (bucket público) o `url` (enlace), `orden`, `pie`, `deleted_at`. Se reutiliza `public_files_in_use` para no borrar del bucket lo que el sitio usa.

**Planos y permisos** no son tabla propia: son documentos del asunto con `inmueble_id` (sección 4.6).

**Proyección pública:** `public_records('propiedades')` agrega con `union all` los inmuebles con `publicado`, sin borrar y no compartidos-sin-autorizar, en la misma forma jsonb que hoy (`slug`, `titulo`, `tipo`, `operacion`, `precio`, `zona`, `direccionAproximada`, `galeria`, `ficha`, etc.). `direccionAproximada` = colonia y referencias; solo con `mostrar_direccion` lleva la dirección exacta (regla rescatada de `pn_inmuebles_direccion_exacta`). La moneda entra en la proyección; el sitio la muestra cuando lo adapte la etapa 4.

### 4.5 Interesados

**`interesados`**: `asunto_id` (el de la comercialización), `persona_id`, `solicitud_id` (si llegó por el sitio), `estado` (`nuevo`, `en_contacto`, `visito`, `oferto`, `descartado`), `nota`.

**`interesado_inmuebles`**: `interesado_id`, `inmueble_id`. Uno o varios locales.

**Visitas:** son tareas del plan con `clase = 'visita'`, `interesado_id`, `inmueble_id`, día y hora. Así salen solas en Inicio.

**`ofertas`**: `interesado_id`, `inmueble_id`, `monto`, `moneda`, `fecha`, `respuesta` (`por_responder`, `aceptada`, `rechazada`, `contraoferta`), `contraoferta_monto`, `nota`.

### 4.6 Documentos

**`asunto_documentos`** (la única lista de documentos del asunto; no se llama `documentos` porque ese nombre lo usa una ruta vieja del provisional, ver sección 6)

| Columna | Nota |
| --- | --- |
| `asunto_id` | |
| `nombre`, `grupo` | `grupo` agrupa en pantalla (del inmueble, de la persona, del crédito…) |
| `estado` | `falta`, `recibido`, `no_aplica` |
| `entrega_persona_id` / `entrega_papel` | Quién lo entrega: una persona del asunto o un papel (`vendedor`, `comprador`, `fortius`…) |
| `de_persona_id`, `inmueble_id` | De quién o de qué inmueble es |
| `vence_el`, `avisar_dias` | El aviso sale en Inicio |
| `origen` | `consulta`, `biblioteca`, `manual`, `formato`, `herramienta`, `cliente` |
| `paso` | `borrador`, `revisado`, `firmado` (para los hechos aquí o los contratos); cada cambio con su actor en historial |
| `formato_draft_id`, `emision_id`, `app_run_id` | Si se hizo con un formato o una herramienta |
| `es_contrato`, `es_recibo` | Para «cliente = firmó contrato» y para Honorarios |

**`documento_archivos`**: `documento_id`, `path` (bucket `fortius-inmuebles-expedientes`), `nombre_original`, `mime`, `byte_length`, `sha256`, `subido_por`, `por_cliente boolean`, `deleted_at`. Un documento puede tener varios archivos (frente y reverso, versión firmada). Un documento emitido no cambia: si los datos cambian, se emite otra versión.

**`ligas_cliente`**: liga para que el cliente suba sus documentos (y después vea su avance). `asunto_id`, `token_hash`, `expira_el`, `revocada`, `creado_por`. Mismo patrón que `app_shares`.

**`cargas_por_acomodar`** (rescata la cola de la Bandeja): archivos que entraron con «Subir varios» o en la consulta y esperan renglón. `usuario_id`, `path` (staging), `asunto_id` o `consulta_id` opcional, `estado` (`por_acomodar`, `acomodado`, `descartado`). Dónde caen los archivos sin asunto está por decidir (SPEC 18); esta tabla sirve para cualquiera de las dos respuestas.

### 4.7 Situación y opinión jurídica

**`situacion_puntos`**: `asunto_id`, `clase` (`hecho`, `por_averiguar`), `clave` (`que_quiere`, `de_quien`, `tipo_inmueble`, `colonia`, `ocupacion`, `escritura`, `adeudos` o libre), `valor`, `texto`, `tarea_id` (cuando se volvió tarea), `resuelto_el`. Así «sin sucesión» e «invadida» quedan como hechos del caso, no como nota.

**`opiniones`**: `asunto_id` (única activa por asunto), `resultado` (`factible`, `factible_con_observaciones`, `no_factible`), `analisis`, `emitida_el`, `emitida_por`, `documento_id` (si se emite en PDF).

**`opinion_puntos`**: `opinion_id`, `texto`, `quien` (`fortius`, `cliente`, `abogado`, `notaria`, `otro`), `tarea_id`.

Las tres salidas del «no factible» son acciones de la pantalla (cobrar el estudio, cerrar, poner en espera), no columnas.

### 4.8 Plan

**`plan_etapas`**: `asunto_id`, `nombre`, `orden`, `biblioteca_id` y `biblioteca_version` (de dónde se copió). Varias etapas pueden estar abiertas a la vez; no hay columna de «etapa actual».

**`tareas`**

| Columna | Nota |
| --- | --- |
| `asunto_id` | Opcional: hay tareas de un contacto sin asunto o de una consulta |
| `etapa_id` | Opcional |
| `persona_id`, `consulta_id`, `interesado_id`, `inmueble_id`, `documento_id` | Ligas opcionales |
| `clase` | `tarea`, `llamada`, `visita`, `firma`, `cita`, `seguimiento`, `cobro` |
| `titulo`, `detalle` | |
| `quien` | `fortius`, `cliente`, `abogado`, `notaria`, `otro`; con `quien_persona_id` opcional |
| `responsable_id` | uuid → staff (por omisión, quien la escribe) |
| `fecha`, `hora`, `duracion_min` | La hora exige día |
| `estado` | `pendiente`, `hecha`, `no_aplica`, `no_se_puede` |
| `motivo` | Para `no_aplica` y `no_se_puede` |
| `espera_a` | → tareas (dependencia; no bloquea, solo se muestra) |
| `repetir` | jsonb `{cada: 'semana'|'mes'|..., hasta?}`; al marcarla hecha se crea la siguiente |
| `volver_a_preguntar` | date. Si `quien <> 'fortius'`, un disparador la pone por omisión (fecha + 3 días, o hoy + 3 si no hay fecha) |
| `pospuesta` | contador |
| `hecha_el`, `hecha_por` | |
| `origen` | `manual`, `biblioteca`, `opinion`, `situacion`, `sistema`, `linea` |
| `orden` | |

- «Lo que sigue» del asunto = la tarea pendiente más próxima (vista `asunto_siguiente`). Si no hay, la pantalla lo dice.
- «Esperando a otros» = tareas pendientes con `quien <> 'fortius'`, ordenadas por días desde su creación o su último «Recordarle».
- El seguimiento del presupuesto a los tres días es una tarea con `origen 'sistema'` creada al marcarlo enviado.

### 4.9 Dinero

**`presupuestos`**: `asunto_id`, `numero` (versión), `estado` (`borrador`, `enviado`, `aceptado`, `rechazado`), `enviado_el`, `vigente_hasta`, `documento_id`, `nota`.

**`presupuesto_conceptos`**

| Columna | Nota |
| --- | --- |
| `presupuesto_id` | |
| `clase` | `honorario` (de Fortius) o `tercero` (notaría, abogado, impuestos, derechos) |
| `concepto` | |
| `monto`, `moneda` | |
| `porcentaje`, `base_inmueble_id` | Honorario sobre el precio final; `monto` queda vacío hasta conocer el precio |
| `paga_persona_id` | Quién paga, cuando hay varios clientes |
| `inmueble_id` | De qué inmueble es |
| `tercero` | A quién se le paga, si es gasto de terceros |

**`cobros`**: `asunto_id`, `concepto_id` opcional, `paga_persona_id`, `inmueble_id`, `monto`, `moneda`, `forma` (`efectivo`, `transferencia`, `cheque`, `tarjeta`, `otro`), `fecha`, `recibo_documento_id`, `nota`. «Hacer recibo» crea el documento con el formato de recibo ya lleno.

**`custodias`** (el «apartado» de dinero que recibe Fortius; rescatado de `pn08_movimientos`): `asunto_id`, `inmueble_id`, `monto`, `moneda`, `recibido_el`, `de_persona_id`, `comprobante_path` (bucket privado), `entregado_el`, `entregado_a_persona_id`. En pantalla se llama «apartado»; en la base, `custodias`, para no confundirlo con los apartados del asunto.

**Reparto de comisión:** vista `comision_reparto` que, con `capto_id` y `vendio_id` del asunto y lo cobrado por concepto `honorario`, da 25 % y 25 %, o 50 % si es la misma persona. No se guarda; se calcula.

**Vistas para Inicio y Equipo:** `por_cobrar` (presupuesto aceptado menos cobrado, por asunto, inmueble y moneda).

### 4.10 Historial, decisiones, comentarios y avisos

**`historial`** (solo se agrega; rescatada): `entidad` (`asunto`, `persona`, `inmueble`, `tarea`, `documento`, `cobro`, `consulta`, …), `entidad_id`, `asunto_id`, `clase` (`cambio`, `nota`, `decision`, `comentario`, `aviso`, `sistema`), `resumen`, `detalle jsonb` (campos cambiados, por qué), `menciones uuid[]`, `actor_id`, `actor_tipo` (`usuario`, `sistema`, `publico`), `created_at`.

- **Decisión:** `clase 'decision'` con quién, cuándo y por qué en `detalle`.
- **Aviso:** cuando alguien sigue adelante con algo faltante, se anota «se publicó sin fotos», con quién y cuándo (regla rescatada de «nada frena, solo avisa»). Lo escribe la ruta del servidor, no un freno.
- Notas y comentarios no se editan; se corrigen con otra entrada.
- Solo se escribe por la función `anotar_historial` (el actor es quien está en sesión) o por los disparadores.

**`avisos_personales`**: un lugar con todo lo que te mencionaron o asignaron. `usuario_id`, `clase` (`mencion`, `asignacion`, `vencimiento`, `solicitud`), `ref_tabla`, `ref_id`, `asunto_id`, `leido_el`. Lo llenan disparadores sobre `historial.menciones`, `tareas.responsable_id`, `asuntos.responsable_id` y `solicitudes.asignada_a`.

### 4.11 Consultas, contactos y solicitudes del sitio

**`consultas`** (se guarda sola mientras se escribe)

| Columna | Nota |
| --- | --- |
| `quien_nombre`, `quien_telefonos`, `quien_correo`, `canal` | Antes de que exista la persona |
| `persona_id` | Si ya se eligió o se creó la ficha |
| `que_pasa` | Texto libre |
| `datos` | jsonb con los datos de siempre (qué quiere, de quién es, tipo, colonia, quién ocupa, escritura, qué debe) |
| `otras_personas` | jsonb `[{nombre, papel, telefono, fallecida}]` hasta abrir el asunto |
| `documentos_pedir` | jsonb `[{nombre, grupo, entrega_papel, quitado}]` |
| `estado` | `abierta`, `asunto`, `contacto`, `no_procede` |
| `motivo` | Para «no procede» |
| `asunto_id` | Al abrir el asunto |
| `solicitud_id` | Si vino del sitio |
| `responsable_id` | |

- «Abrir asunto» = función `abrir_asunto_desde_consulta`: en una transacción crea o reutiliza personas, crea el asunto con su folio, liga personas con papel, crea el inmueble si se describió, convierte `documentos_pedir` en `asunto_documentos`, pasa los adjuntos de `cargas_por_acomodar` a sus documentos (marcados recibidos), convierte los datos de siempre en `situacion_puntos` y crea el primer plan (de la Biblioteca o el de ejemplo).
- «Guardar como contacto» crea la persona con `volver_a_llamar` y deja la consulta en `contacto`.

**`solicitudes`** (lo que llega del sitio)

- El formulario público **no cambia**: sigue entrando por `capture_lead` a `records/leads`, con su límite de intentos.
- Un disparador nuevo sobre `records` (solo `collection = 'leads'`, solo al insertar) copia la solicitud a `solicitudes`: `lead_id`, `nombre`, `telefono`, `correo`, `mensaje`, `inmueble_id` (resuelto por `propiedadSlug` contra `inmuebles.slug`), `recibida_el`, `asignada_a`, `asignada_el`, `consulta_id`, `estado` (`por_atender`, `asignada`, `atendida`, `descartada`).
- Si trae `inmueble_id`, el mismo disparador anota al interesado en el asunto de ese inmueble (crea la persona si no existe por teléfono o correo).
- El panel provisional sigue viendo sus `leads` igual. Al retirar el provisional (etapa 11), `capture_lead` escribe directo en `solicitudes` y el disparador se quita.

### 4.12 Herramientas y Biblioteca

**`trabajos`** (etapa 6): un formato por preguntas o una cuenta de Herramientas. `asunto_id` vacío = trabajo suelto, que ve solo quien lo hizo y el director. «Pasar a un asunto» pone `asunto_id` una sola vez y crea el renglón en Documentos con `trabajo_id`. `pdf_version` dice qué versión ya quedó en PDF en Documentos. Los datos capturados no van al historial (son datos personales); solo el nombre y el resultado. Los datos para contratos del inmueble viven en `inmueble_datos_legales`, privados. Los cálculos fiscales siguen como están (dicen su fuente y fecha).

**`biblioteca`**: `clase` (`que_pedir`, `que_hacer`, `apartado_propio`), `nombre`, `descripcion`, `cuando` (etiquetas: titular fallecido, hipoteca, crédito…), `contenido jsonb` (lista de documentos; etapas con tareas, `quien` y días relativos; o definición de un apartado propio con columnas y vista), `revisado_abogado boolean`, `version`, `deleted_at`. Copiar a un asunto copia el contenido; cambiarlo en el asunto no toca el original. «Guardar este plan en la Biblioteca» crea una fila nueva desde `plan_etapas` y `tareas`.

Contenido inicial: los ejemplos del boceto y las guías de trámite ya escritas (cancelación de hipoteca de 8 pasos, servicios, avalúo, regularización, Catastro, Registro Público), todas marcadas «sin revisar por el abogado».

### 4.13 Folios

**`folios`** (rescatada): `prefijo` (`EXP`, `FORTIUS`), `numero`, `tabla`, `registro_id`, `created_at`; solo se agrega. Se siembra con el máximo actual de `expedientes.folio` y de `propiedades.codigo` (incluido su historial). Las funciones viejas `assign_expediente_folio` y `next_property_code` se redefinen para tomar también el máximo del libro, de modo que el panel provisional y el nuevo nunca se pisen mientras conviven.

---

## 5. Qué cambia en la base

### Tablas nuevas (34)

`folios`, `asuntos`, `asunto_miembros`, `apartados`, `apartado_filas`, `personas`, `persona_datos_legales`, `asunto_personas`, `persona_uniones`, `inmuebles`, `asunto_inmuebles`, `inmueble_precios`, `inmueble_medios`, `interesados`, `interesado_inmuebles`, `ofertas`, `asunto_documentos`, `documento_archivos`, `ligas_cliente`, `cargas_por_acomodar`, `situacion_puntos`, `opiniones`, `opinion_puntos`, `plan_etapas`, `tareas`, `presupuestos`, `presupuesto_conceptos`, `cobros`, `custodias`, `historial`, `avisos_personales`, `consultas`, `solicitudes`, `biblioteca`.

Más las vistas `asunto_siguiente`, `por_cobrar`, `comision_reparto` y la función `puede_ver_asunto`.

### Columnas nuevas en tablas que ya existen

| Tabla | Columna | Para qué |
| --- | --- | --- |
| `formato_drafts` | `asunto_id` opcional | Hacer un formato desde un asunto nuevo |
| `formato_emissions` | (ninguna; hereda del borrador) | |
| `formato_assets`, `signed_copies` | `deleted_at`, `deleted_by` | Quitar sin borrar (rescatado de `pn06_quitar_imagen_y_copia_firmada`) |
| `app_runs` | `asunto_id` opcional | Pasar un trabajo suelto a un asunto |
| `ia_lecturas` | `documento_archivo_id` opcional | Leer un archivo del asunto nuevo |

**Formatos:** hoy todo el motor cuelga de `expediente_id` (borradores, emisión, recibo con folio por expediente, PDF completo, `expediente_datos`). En la etapa 6 las rutas de formatos aceptan `asunto_id` y toman los datos de `personas`, `persona_datos_legales`, `inmuebles` y `asuntos` en lugar de `expediente_datos`; lo que se capture en un formato se escribe de vuelta ahí. El folio del recibo pasa a ser por asunto.

Las funciones de acceso `can_access_draft`, `can_access_emission` y las políticas de `app_runs` e `ia_lecturas` se amplían con `or puede_ver_asunto(asunto_id)`; lo que ya permiten no cambia.

### Funciones que cambian

- `public_records('propiedades')`: suma los inmuebles nuevos publicados (misma forma).
- `assign_expediente_folio` y `next_property_code`: toman en cuenta el libro de folios.
- Disparador nuevo sobre `records` para copiar `leads` a `solicitudes`.

### Lo que el panel nuevo deja de usar

Siguen en la base y sirviendo al panel provisional hasta la etapa 11; el panel nuevo no los lee ni los escribe:

- En `records`: `clientes`, `leads`, `tareas`, `eventos`, `notas`, `tramites`, `archivos` y `propiedades` (estas siguen en el sitio mientras existan).
- `expedientes`, `expediente_actividad`, `expediente_datos`, `expediente_archivos`, `interviews`, `lead_conversions`, `comercial_books`, `comercial_revisions`, `comercial_emissions`.
- Todas las guardas de proceso del flujo guiado.

En la etapa 11 se decide, con respaldo y con el titular, qué de eso se borra.

### Lo que no cambia

`staff`, `adviser_accounts`, `rate_limits`, `record_history`, `record_references`, `record_revisions`, `user_preferences`, `file_uploads`, `integration_*`, `signature_events`, `app_files`, `app_shares`, `posts`, `contenido`, `config`, los buckets y el aviso de privacidad.

### Orden sugerido de las migraciones (cuando se autorice)

Una migración por bloque, cada una aditiva y en su transacción:

1. Folios, `puede_ver_asunto`, disparadores comunes (versión, historial, solo agregar).
2. Asuntos, miembros, apartados y apartados propios.
3. Personas, datos legales, uniones y personas del asunto.
4. Plan y tareas, con la vista `asunto_siguiente` (se adelantó: la lista de Asuntos muestra lo que sigue). Las ligas de la tarea a inmueble, documento, consulta e interesado quedan sin llave foránea hasta su bloque.
5. Inmuebles, ligas, precios, medios y proyección pública.
6. Documentos, archivos, ligas del cliente y cargas por acomodar; columnas en formatos, `app_runs` e `ia_lecturas`.
7. Situación y opinión jurídica.
8. Interesados y ofertas.
9. Dinero.
10. Consultas, solicitudes (con su disparador) y avisos personales.
11. Biblioteca, con su contenido de ejemplo.

El bloque 1 lleva además el cambio de las funciones de folio del provisional y el disparador que reserva los códigos de inmueble. El bloque 2 lleva también el historial y la función `anotar_historial`. Cada bloque restante se escribe justo antes de la etapa que lo usa: el 1–4 para la etapa 2, el 5 para la etapa 4, etc. Cada bloque que llega después agrega las llaves foráneas que dejaron pendientes los anteriores. Todas se aplican solas al integrar en `main`.

---

## 6. Las 20 migraciones sin aplicar

**Se borraron las 20** (16/11/2026). Ninguna se aplica tal cual: todas se apoyan en `expedientes` o en `records`, o cambian el comportamiento del panel provisional. Lo útil se rescata así:

| Migración | Qué hacía | Qué se rescata |
| --- | --- | --- |
| `20261114400000_documentos_sin_operacion` | Tabla de documentos sueltos con Bandeja | La idea de archivos sin asunto → `cargas_por_acomodar` |
| `20261115100000_prospecto_con_sus_tareas` | Borrar prospecto y sus tareas juntos en el provisional | Nada (es del provisional) |
| `20261115200000_nada_frena_solo_avisa` | Volvía avisos los frenos del provisional | La regla: nada frena; el aviso queda en el historial con quién siguió → `historial.clase 'aviso'` |
| `20261115210000_guias_por_tipo` | Guías por tipo en el riel del provisional | Nada en la base; los nombres de pasos pasan a la Biblioteca |
| `20261116090000_pn02_identidad_y_miembros` | Colaboradores y `mi_asesor_id` | `asunto_miembros` y la función de visibilidad, con uuid |
| `20261116090100_pn02_folios_reservados` | Libro de folios | `folios`, casi igual |
| `20261116090200_pn02_asunto_columnas` | Columnas de asunto sobre `expedientes` | Los campos `titulo`, estado, resultado, `continua_de` → `asuntos` |
| `20261116090300_pn02_enlaces_del_asunto` | Personas e inmuebles del asunto sobre `records` | La forma de `asunto_personas` y `asunto_inmuebles`, contra tablas nuevas |
| `20261116090400_pn02_pendientes` | Una tabla para tareas, citas y cobros | La estructura de `tareas` (hora, responsable, idempotencia) |
| `20261116090500_pn02_historial_y_notas` | Historial con actor y notas que no se editan | `historial` y `anotar_historial` |
| `20261116090600_pn02_personas_unidas` | Registro de uniones | `persona_uniones`, igual |
| `20261116090700_pn06_cola_de_la_bandeja` | Cola de archivos en el servidor | `cargas_por_acomodar` |
| `20261116091000_pn06_quitar_imagen_y_copia_firmada` | Quitar sin borrar en formatos | Se reescribe igual (bloque 5) |
| `20261116100000_sin_frenos_de_proceso` | Quitaba frenos del provisional | La regla, ya incluida |
| `20261116110000_tramites_sin_frenos` | Quitaba frenos de trámites del provisional | Nada |
| `20261116120000_pn08_movimientos_de_dinero` | Comisiones, gastos y apartados de dinero | `custodias` y gastos de terceros en `presupuesto_conceptos` |
| `20261116130000_tramites_por_tipo` | Tipos de trámite del provisional | Las listas de pasos → contenido de la Biblioteca |
| `20261116140000_hora_de_la_tarea` | Hora en las tareas de `records` | `tareas.hora` |
| `20261116145000_pn_inmuebles_direccion_exacta` | Interruptor de dirección exacta | La regla, en la proyección pública nueva |
| `20261116150000_pn03_unir_personas` | Unir dos fichas | `unir_personas`, reescrita |

Las migraciones borradas quedan en el historial de git.

**Ruta del provisional que ya falla hoy:** `/api/admin/bandeja-vieja*` (`src/lib/backend/documentos.ts`) usa la tabla `fortius_inmuebles_documentos`, que es de `20261114400000_documentos_sin_operacion` y nunca se aplicó. Al borrar esa migración la ruta sigue igual que hoy: sin tabla. Por eso la tabla nueva se llama `asunto_documentos`, para que esa ruta no lea por error datos del panel nuevo. Se retira con el provisional en la etapa 11.

**Cuidado con el código:** varias rutas de `/api/admin/*` y módulos de `src/lib/panel/datos/` ya llaman a tablas de estas migraciones (`asunto_personas`, `historial`, `pendientes`, `movimientos`, `bandeja`, `persona_uniones`, rpc `unir_personas`, `anotar_historial`). Hoy no fallan porque responden «no disponible». Al borrar las migraciones, esas llamadas se reescriben en su etapa contra las tablas nuevas.

---

## 7. Qué se reutiliza del código

Resumen; el detalle está en la lista para el titular de la etapa 0.

- **Tal cual:** el kit de interacción (`src/components/panel/kit/`, `ui/`), íconos, tokens y temas (`panel-ds.css`, `panel-kit.css`), `use-coleccion` con su 409, utilidades puras de `src/lib/panel/`, el puente `legado/`, el motor de formatos y PDF, las calculadoras de Herramientas, sesión, roles, segundo paso del director, subida firmada, límites de intentos, proyección pública y lectura de documentos.
- **Se adapta:** el armazón del panel (menú y barra del teléfono con las secciones nuevas), Inicio (desde Hoy), Inmuebles, Directorio (desde Personas), Honorarios (desde Dinero), agenda y vencimientos (pasan a tareas del Plan), Equipo (desde Configuración), y las rutas `/api/admin/*` que sirven al panel nuevo.
- **Se rehace:** la lista y la ficha del asunto con sus apartados, el Plan, Situación, Opinión jurídica, Interesados, apartados propios, Biblioteca, la consulta y todo lo de trámites (pasa a ser un plan de la Biblioteca).
