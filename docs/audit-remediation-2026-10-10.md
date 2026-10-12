# Correcciones de la auditoría de Fortius

Base de trabajo: main, commit 4c0c0d218e0212bfad4d6d8a5b6ffb6f2b16b923. Este registro complementa la auditoría AS-IS; no reescribe sus observaciones históricas.

## Cambios en infraestructura ya realizados

- **Auth:** site_url ahora es https://fortiusinmuebles.com/admin. Se añadió esa URL exacta a la lista de redirecciones manteniendo las anteriores. PATCH respondió 200 y una lectura posterior confirmó ambos campos. No se enviaron correos ni se modificaron usuarios, contraseñas o MFA.
- **Proyección pública:** aplicada por Management API la migración `20261010131109_fortius_public_property_facts.sql`. Se verificó la definición y su registro en schema_migrations. Publica únicamente cuatro claves de informacionPublica, solo valores de texto de longitud acotada; no modifica registros. Rollback técnico: reemplazar la definición de función por su versión anterior, conservada temporalmente fuera del repositorio. No retirar ni alterar manualmente el historial de migraciones.

## Código preparado y validado localmente

| Hallazgo | Avance | Límite pendiente |
|---|---|---|
| F01 | Export y validador exigen 18 tablas. Ensayo actual aplica migraciones en memoria, restaura contenido, valida FK y compara campos/fechas y revisiones. Pruebas con historial, actividad, borrador y emisión sintéticos; rechazo de FK huérfana. | No se creó copia de clientes ni se ensayó recuperación integral de Auth/Storage. Se necesita destino aislado, custodia, ventana consistente y RPO/RTO. |
| F02 | Dominio Auth corregido y verificado remotamente. | Entrega de correos y flujo de recuperación con cuenta controlada no comprobados; no se enviaron mensajes. |
| F03 | Prueba JSDOM corregida: geometría simulada solo en el test, no en producción. Selectores de pruebas de navegador distinguen enlaces principales de submenús ocultos. CI incorpora ensayos de backup. | Activación de controles obligatorios de publicación pendiente por 403 de GitHub/Vercel. No se debe afirmar que el gate está activo. |
| F04 | Acceso a Vercel reintentado: 403. | No retirar ni redirigir el proyecto antiguo sin inventario de dependencias. |
| F05 | Sin cambio a las colecciones completas del store. | Falta diseño y medición de búsqueda/paginación por módulo; no se confunde extracción de tipos con mejora de rendimiento. |
| F06 | API admite limit/offset, orden por created_at/id y nextOffset. Consumidores anteriores reciben páginas reunidas sin truncamiento silencioso; incoherencias producen error. | Los consumidores antiguos todavía cargan todo. Completar interfaces paginadas y búsqueda servidor será una segunda etapa. |
| F07 | Bloqueo global conservado. | Medir concurrencia e integridad antes de granularizarlo. |
| F08 | Proyección SQL corregida y aplicada; pruebas de claves autorizadas y objetos anidados. | Verificación con un inmueble real y PDF no se hizo para evitar consultar datos personales sin necesidad. |
| F09 | Cada respuesta API tiene X-Request-Id; errores incluyen requestId. Fallos 5xx producen registro estructurado de categoría, estado y duración, sin excepción cruda ni cuerpo. | Requiere publicar código y verificar captura/retención/alertas del proveedor. |
| F10 | TOTP existente conservado; no se impuso AAL2. | Acordar enrolamiento, recuperación y política para no bloquear al personal. |
| F11 | Contratos extraídos a src/lib/domain/records.ts. Servidor y utilidades dejan de importar esos tipos desde el store React; exportaciones del store conservadas para compatibilidad. | Primera extracción modular, no refactor completo de todos los formularios. |
| F12 | No se impuso una matriz de etapas. | Reglas, requisitos y excepciones deben aprobarse como política operativa. |

## Validación

- npm run verify: lint, TypeScript, 494 pruebas backend,210 administrativas y build terminaron correctamente. El aviso inicial de importación sin uso se corrigió; lint se repitió sin avisos.
- Después de las pruebas adicionales: 19 pruebas SQL de database.test.ts y 7 de rutas/observabilidad pasaron; TypeScript se repitió.
- Dos pruebas de herramientas pasan: cobertura de backup y restauración actual con rechazo de relaciones inválidas.
- verify-pdf-bundle confirma bibliotecas nativas, activos y fuentes presentes en el build.
- Navegador: 9 escenarios pasaron en la primera ejecución; los 3 restantes pasaron tras corregir selectores obsoletos (recorrido de páginas a 375px/1440px y foco con Tab/Shift+Tab). Backend de pruebas sintético, sin credenciales de producción. Se usó Chromium existente mediante configuración temporal; no se instalaron navegadores.

## Publicación y continuidad

Los cambios de aplicación, tests, herramientas y workflow están locales, sin commit ni despliegue. La configuración Auth y la migración SQL son las únicas modificaciones remotas de esta tarea. El token Vercel existente devuelve 403 y GitHub no permite consultar protección de ramas. Una autorización válida de esos servicios permite continuar con publicación y controles sin rehacer estas correcciones.

Conservar docs/architecture y test-results preexistentes. No incluir backups, credenciales ni archivos temporales de validación en Git.
