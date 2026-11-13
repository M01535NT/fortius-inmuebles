# Copia diaria de Fortius — cómo funciona y cómo activarla

Decisión del titular (12/11/2026): copia diaria automática en GitHub, cifrada y guardada en **Cloudflare R2**, con el titular como custodio. Este documento explica qué hace la copia y los pasos que solo el titular puede dar, porque involucran sus cuentas y sus claves.

## Qué hace cada noche

A las 3:00 a. m. (hora de Tijuana en invierno; 2:00 a. m. en verano), el flujo `.github/workflows/backup-daily.yml`:

1. Lee toda la base en una sola instantánea de solo lectura (`tools/fortius-inmuebles-owner-export.mjs`).
2. Copia todos los archivos de Storage y verifica cada huella (`tools/fortius-inmuebles-backup.mjs`).
3. Ensaya en memoria que la copia se puede restaurar (`tools/fortius-inmuebles-restore-rehearsal.mjs`). Si algo no cuadra, se detiene y no sube nada.
4. Empaqueta y **cifra** la copia para la llave pública del titular (`tools/fortius-inmuebles-backup-crypt.mjs`): AES-256-GCM con una llave nueva en cada copia, protegida con RSA-4096.
5. Sube solo el archivo cifrado a R2, en `diario/AAAA/MM/`.
6. Borra del equipo de GitHub todo lo que no estaba cifrado.

Si falla, GitHub manda un correo al titular. Los registros del flujo solo muestran conteos, nunca datos, porque el repositorio es público.

**Límite:** la base sale de una instantánea consistente, pero los archivos se copian unos segundos o minutos después. Un archivo subido justo en ese intervalo podría faltar en la copia de esa noche; la verificación lo detectaría y la copia fallaría en lugar de quedar incompleta en silencio. Por eso se programa de madrugada.

## Pasos del titular (una sola vez)

### 1. Crear tu llave (5 minutos)

En una terminal abierta en la carpeta del proyecto:

```bash
node tools/fortius-inmuebles-backup-crypt.mjs --generate-keys C:\Users\Moise\Documents\fortius-llaves
```

Se crean dos archivos:

- `fortius-respaldo-privada.pem` es **la llave para abrir las copias**. Guárdala en tu gestor de contraseñas y en una memoria USB guardada en un lugar seguro. Después borra la que quedó en Documentos. Si la pierdes, ninguna copia se podrá abrir. Nunca la compartas ni la subas a GitHub.
- `fortius-respaldo-publica.pem` solo sirve para cerrar. No es secreta: pásasela al agente para que la agregue al repositorio como `.github/backup-public-key.pem`.

### 2. Cloudflare R2 (10 minutos)

1. Crea una cuenta en cloudflare.com, o entra a la que tengas. R2 pide registrar un método de pago, aunque el uso hasta 10 GB es gratuito.
2. En **R2 Object Storage → Create bucket**, crea el bucket `fortius-respaldos` con ubicación Norteamérica. Debe quedar privado: sin acceso público ni dominio.
3. En el bucket, **Settings → Bucket lock rules**, agrega una regla de 30 días. Así nadie puede borrar una copia antes de 30 días, ni con una clave robada.
4. En **R2 → Manage API tokens → Create API token**, crea uno con permiso **Object Read & Write** solo para `fortius-respaldos`. Copia el *Access Key ID*, el *Secret Access Key* y tu *Account ID*.

No se configura borrado automático: cuánto tiempo conservar las copias se decide con la política de datos (PRV-01).

### 3. Conexión de la base (2 minutos)

En Supabase, abre el proyecto `fortius-inmuebles`, pulsa **Connect** y elige **Session pooler**. Copia la cadena que empieza con `postgresql://postgres.qkkirjzhviqwvuqjnmei:` y cambia `[YOUR-PASSWORD]` por la contraseña de la base. Hace falta el *pooler* porque GitHub no llega a la conexión directa.

### 4. Secretos en GitHub (10 minutos)

En github.com/M01535NT/fortius-inmuebles, ve a **Settings → Environments → New environment** y crea `respaldo`. En *Deployment branches and tags* elige **Selected branches** y agrega `main`. Dentro de ese entorno agrega estos siete secretos:

| Secreto | Valor |
| --- | --- |
| `FORTIUS_BACKUP_DB_URL` | la cadena del paso 3 |
| `FORTIUS_BACKUP_SUPABASE_URL` | `https://qkkirjzhviqwvuqjnmei.supabase.co` |
| `FORTIUS_BACKUP_SERVICE_ROLE_KEY` | clave `service_role` del proyecto (Settings → API Keys) |
| `FORTIUS_BACKUP_R2_ACCOUNT_ID` | Account ID de Cloudflare |
| `FORTIUS_BACKUP_R2_BUCKET` | `fortius-respaldos` |
| `FORTIUS_BACKUP_R2_ACCESS_KEY_ID` | Access Key ID del paso 2 |
| `FORTIUS_BACKUP_R2_SECRET_ACCESS_KEY` | Secret Access Key del paso 2 |

**Opcional, recomendado (13/11/2026):** un octavo secreto `FORTIUS_BACKUP_DB_CA` con el certificado raíz de Supabase en PEM (Supabase → Settings → Database → SSL Configuration → *Download certificate*; se pega el contenido completo). El titular aceptó agregarlo el 13/11/2026. Con él, la copia comprueba que habla con el servidor de Supabase y no con un intermediario; sin él, la conexión va cifrada pero sin esa comprobación, y el registro del flujo lo advierte.

Los secretos de un entorno no los ven ni las personas que copian el repositorio ni los cambios que proponen; solo la rama `main` los usa.

### 5. Activar

El flujo empieza a correr cuando llega a `main` con el PR que apruebes. Ese día se lanza una vez a mano (**Actions → Respaldo diario → Run workflow**) para comprobar que aparece el primer archivo en R2.

## Abrir una copia (prueba mensual o emergencia)

1. Descarga el archivo `.tgz.enc` desde el bucket en Cloudflare.
2. Descífralo con tu llave privada:

   ```bash
   node tools/fortius-inmuebles-backup-crypt.mjs --decrypt ARCHIVO.tgz.enc respaldo.tgz --private-key RUTA\fortius-respaldo-privada.pem
   ```

   Si el archivo fue alterado o la llave no corresponde, se detiene y no deja nada a medias.
3. Desempaqueta con `tar -xzf respaldo.tgz`. Comprueba la copia con `node tools/fortius-inmuebles-backup.mjs --verify CARPETA` y `node tools/fortius-inmuebles-restore-rehearsal.mjs CARPETA`.
4. Para reconstruir el sistema completo, sigue «Ensayo completo en un proyecto aislado» en [el procedimiento](../fortius-inmuebles-backup-restore.md).

Se recomienda hacer los pasos 1 a 3 una vez al mes: una copia que nunca se ha abierto no está comprobada.

## Estado (12/11/2026)

Herramientas, flujo y pruebas listos en la rama de trabajo (47 pruebas de herramientas en verde). La cadena completa se comprobó localmente con un respaldo sintético: empaquetar → cifrar → descifrar → desempaquetar → verificar → ensayar.

Pasos 1 a 4 hechos el 12/11/2026:

- Llave del titular creada; la pública está en `.github/backup-public-key.pem`.
- Bucket `fortius-respaldos` en R2: privado (sin URL pública), Norteamérica, Standard, con la regla de bloqueo `bloqueo-30-dias`.
- Token de cuenta `respaldo-diario` limitado a ese bucket.
- Entorno de GitHub `respaldo` limitado a `main`, con los siete secretos.

Las claves las guardó el titular en Bitwarden y las capturó él mismo; el agente no las vio.

**Falta:** integrar en `main` y la primera ejecución manual. Esa ejecución es la primera prueba real de la conexión a la base y de las claves de R2.

## Estado (13/11/2026)

Integrada en `main` con el PR #73 (`c03504b`). Ejecuciones (lectura de GitHub, solo conteos):

- 07:24 UTC, manual: **falló** en el ensayo («Restored reference inventory differs»). Se lanzó a los 45 segundos de integrar el PR #73, mientras Supabase aplicaba sus migraciones: la copia tenía el esquema anterior y el ensayo usó el del código nuevo. No se subió nada.
- 07:30 UTC, manual: **correcta**.
- 17:30 UTC, programada: **correcta**. 6 buckets, 23 objetos, 20.8 MB; base completa; cifrada para la llave del titular y subida a `diario/2026/11/`. La lectura de las tablas por la API quedó incompleta (`restComplete: false`), lo cual es esperado: la base sale completa de la conexión directa.
- La programada se pidió para las 10:00 UTC y GitHub la corrió 7.5 horas tarde. GitHub no garantiza la hora de los flujos programados; sigue siendo una copia al día.

Corrección del 13/11/2026 (`acfc546`, sin integrar): antes de copiar, la herramienta compara las migraciones de la base con las del código, dentro de la misma instantánea. Si no coinciden, se detiene con un mensaje claro («vuelve a lanzar la copia en unos minutos») en lugar del error confuso de arriba.

**Falta (titular):** agregar el secreto `FORTIUS_BACKUP_DB_CA` (aún no está en el entorno `respaldo`) y abrir una copia con la llave privada siguiendo «Abrir una copia», para comprobar que se descifra fuera de GitHub.
