# Paso de datos de prueba a inventario real

Estado: propuesta del 13/11/2026, sin ejecutar. Nada de esto se hace sin el acuerdo del titular, y el borrado lo ejecuta o aprueba él el día del paso; hasta entonces no se borra nada. Relacionado: [recuperación](recovery-policy.md), [copia diaria](respaldo-diario.md), [entornos](environment-release.md), [acceso](access-policy.md) y [registro de tratamiento](privacy/data-processing-register.md).

## Qué hay hoy en la base (conteo del 13/11/2026)

Lectura de solo conteos con la clave de servicio, sin leer contenido. Proyecto `qkkirjzhviqwvuqjnmei`.

| Grupo | Filas | Qué hacer |
| --- | --- | --- |
| Inmuebles (`records/propiedades`) | 11 | Borrar todos: el titular confirmó el 13/11/2026 que son de prueba. |
| Prospectos y clientes (`leads`, `clientes`) | 18 y 14 | Borrar todo. |
| Tareas, notas, eventos, archivos (`records`) | 17, 1, 0, 7 | Borrar todo. |
| Perfiles de asesor (`records/asesores`) | 2 | Borrar los dos: de prueba (titular, 13/11/2026). Los perfiles reales se dan de alta desde el panel. |
| Blog, contenido, configuración (`records/posts`, `contenido`, `config`) | 27, 1, 1 | Conservar (titular, 13/11/2026: «No borrar el blog»): es contenido editorial real del sitio. |
| Operaciones (`expedientes`) y su actividad | 17 y 36 | Borrar todo. |
| Formatos: borradores, emisiones, activos, copias firmadas | 30, 8, 1, 3 | Borrar todo, con sus archivos. |
| Entrevistas | 12 | Borrar todo. |
| Documentos del cliente, datos leídos y lecturas con IA | 5, 2, 8 | Borrar todo, con sus archivos. |
| Apps (trabajos, archivos) y recibos de carga | 4, 1 y 4 | Borrar todo, con sus archivos. |
| Historial y revisiones (`record_history`, `record_revisions`, `lead_conversions`) | — | Borrar lo que corresponda a lo borrado: guardan copias completas de los datos de prueba. |
| Límites de envío (`rate_limits`) | 3 | Vaciar. |
| Personal (`staff`) y cuentas de Auth | 1 y 1 | Conservar la cuenta del titular. |
| Storage | `private` 2, `public` 2, `expedientes` 6 entradas de primer nivel | Borrar los objetos de prueba; conservar imágenes del blog y de perfiles reales. |

Las cifras cambian con cada ensayo; se repiten el día del paso.

## Por qué no basta con borrar desde el panel

El panel borra de forma recuperable y conserva historial; varias tablas son inmutables a propósito (entrevistas, recibos de carga, revisiones comerciales, procedencia de archivos) y rechazan cualquier borrado. Además, el historial guarda copias completas de cada registro. Para dejar la base limpia hace falta **una purga del propietario**: una sola transacción en SQL que vacía las tablas operativas (`truncate … cascade`, que no dispara los candados por fila) y borra de `records` solo las colecciones de prueba con su historial. Los archivos de Storage se borran después, por lista de rutas sacada de esas filas.

La purga se escribe como script revisable y **se ensaya primero** sobre una copia restaurada en un proyecto aislado (el mismo procedimiento del ensayo del 12/11/2026), comparando conteos antes y después. Solo entonces se corre en producción.

## Orden del día del paso

1. **Antes.** Copia diaria integrada en `main` y comprobada (falta hoy: primera ejecución). Lanzar una copia a mano esa mañana y comprobar que se abre con la llave del titular. Esa copia es la única forma de volver atrás.
2. **Rotar claves** (ver abajo), porque las actuales circularon por equipos locales, previews y variables ya borradas.
3. **Ventana sin escrituras.** Nadie usa el panel durante la purga.
4. **Purga** ensayada (base y Storage), con conteos antes y después guardados en `tmp/` (sin datos).
5. **Comprobar vacío:** sitio público sin inmuebles de ejemplo ni asesores de prueba; `/api/public/*` sin registros de ensayo; folios: la siguiente operación vuelve a empezar en `EXP-000001` (se calculan desde los existentes).
6. **Cargar el inventario real** desde el panel (no por SQL), para que cada registro pase por las validaciones, el historial y la regla de guardar ≠ publicar.
7. **Comprobar lo cargado:** cada inmueble publicado muestra solo campos autorizados (sin propietario, teléfono ni domicilio privado), las fotos salen del bucket público, la ficha técnica PDF y la imagen social no traen datos internos.
8. **Copia del primer día** con datos reales y repetir el ensayo de recuperación en proyecto aislado con ese volumen (pendiente 2 de REC-01).

## Claves que conviene rotar antes de cargar datos reales

**Decisión del titular (13/11/2026):** todas se cambian el día del paso, justo antes de cargar el inventario real (paso 2 del orden del día), incluida la de xAI.

- **Clave de servicio de Supabase** (`SUPABASE_SERVICE_ROLE_KEY`): está copiada en `.env.local` de la carpeta principal y de cada worktree, estuvo en previews de ramas ya borradas y en el entorno `respaldo` de GitHub. Rotarla (de preferencia pasar a las claves nuevas `sb_secret_…`) y actualizarla a mano en Vercel producción, en el entorno `respaldo` de GitHub y en el `.env.local` del titular.
- **Secreto JWT de Supabase**: la integración lo copió a Vercel como `SUPABASE_JWT_SECRET` (borrado el 12/11/2026). Con ese secreto se puede fabricar una sesión de cualquier usuario. Pasar a llaves de firma asimétricas de Supabase y revocar la anterior.
- **Clave de xAI** (`XAI_API_KEY`): el titular la compartió por chat el 31/10/2026 y sigue en `.env.local`. Revocarla en xAI.
- **Clave de Anthropic** (`ANTHROPIC_API_KEY`): solo local. Mientras no haya visto bueno del abogado sobre el aviso de privacidad, **quitarla de `.env.local`** el día del paso: con datos reales, el panel local mandaría documentos de clientes al proveedor.
- Contraseña de la base (la usa la copia diaria): rotarla si se compartió fuera de Bitwarden.

Rotar no requiere cambio de código. Cada cambio en Vercel necesita un despliegue nuevo para tomar efecto.

## Qué reglas cambian ese día

- **Vuelve la regla de solo lectura** (`AGENTS.md`, «Datos, secretos y entornos»): termina la autorización del 17/10/2026 (DEC-10, I-01). Ningún agente crea, edita, borra ni publica en esa base; nada de pruebas con escritura ni `test:live` contra ella; el navegador conectado a esa base solo lee.
- Los ensayos pasan a un proyecto de pruebas aparte (o a la API simulada). Hace falta decidir cuál: sin él, no se podrá probar con escritura.
- El `.env.local` de los worktrees deja de copiarse con la clave de servicio de producción. Para desarrollo basta la URL y la clave anónima, o el proyecto de pruebas.
- La lectura con IA sigue apagada en producción hasta el visto bueno del abogado y la anotación en el registro de tratamiento.
- Los respaldos pasan a contener datos personales reales: el bucket R2 y la llave privada del titular se tratan como tales (acceso registrado, sin copias sin cifrar fuera del equipo de GitHub).
- Una migración que borre o reescriba datos necesita copia previa comprobada.
- `AGENTS.md`, el plan y la memoria de los agentes se actualizan ese mismo día (lo hace la central).

## Decisiones del titular

1. ~~¿Alguno de los 11 inmuebles o de los 2 perfiles de asesor es real?~~ **13/11/2026:** «Todos son de prueba».
2. ~~¿Se conservan el blog, el contenido y la configuración?~~ **13/11/2026:** «No borrar el blog»; se conservan también contenido y configuración.
3. ¿Qué proyecto queda para ensayos con escritura después del paso? **13/11/2026:** lo decide más adelante; mientras tanto se sigue usando la base actual con datos de prueba.
4. ~~¿Cuándo se cambian las claves?~~ **13/11/2026:** todas el día del paso.
5. Fecha del paso, con una ventana sin uso del panel de unas dos horas.
