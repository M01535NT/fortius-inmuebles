# Acceso y MFA — propuesta operativa

Estado: propuesta para revisión, sin cambio de roles, bloqueo de personal ni envío de correos. Fecha: 12/10/2026.

- Mantener roles admin/editor actuales hasta aprobar matriz de capacidades. No asignar funciones jurídica/técnica/financiera por título de perfil público.
- Proponer MFA para administradores y acciones sensibles; enrolar y probar recuperación antes de exigirlo. Definir quién custodia recuperación de emergencia, revocación y cuenta administrativa alternativa.
- Perfil público de asesor, cuenta Auth y membresía de staff son elementos distintos. La futura interfaz de equipo debe impedir quedar sin administrador habilitado.
- Prueba de recuperación/invitación: cuenta y buzón controlados, autorización explícita de envío, dominio de retorno Fortius, expiración/reutilización y comportamiento tras cierre de sesión. No usar cuentas de terceros para probar.
- No registrar contraseñas, tickets, códigos MFA, cuerpo documental ni correo del titular en logs operativos. Identificar fallos por requestId/categoría.
- Reasignación: revisar alcance en API/RLS/documentos y nuevos enlaces; no afirmar revocación de bytes ya descargados.

## Comprobado y pendiente

Lectura actual confirma dominio Auth correcto y tests de servidor existentes ejercitan autenticación y custodia de documentos. Una configuración correcta y mocks aprobados no prueban entrega de correo ni recuperación real. Esa prueba permanece pendiente de cuenta controlada/autorización. No se ha exigido AAL2 en producción.

Lectura del 12/11/2026: registro abierto desactivado, acceso solo por correo y confirmación de correo obligatoria. El código tiene recuperación de contraseña, pero no invitación ni MFA (la verificación en dos pasos se agregó el 13/11/2026; ver AUT-01 abajo). SMTP propio, URL de retorno y MFA del proyecto no se pudieron leer sin la API de administración. Detalle en [entornos](environment-release.md).

## Controles agregados el 13/11/2026 (en `main` con el PR #74; migraciones aplicadas y comprobadas)

- **Límite de intentos propio** (`fortius_inmuebles_auth_attempt`): por hora, acceso hasta 30 intentos por IP y 20 por correo; recuperación hasta 5 por IP y 3 por correo. Se cuentan huellas SHA-256, nunca la IP ni el correo.
- **Cambiar la contraseña** exige un enlace de invitación o recuperación de la última hora, o un acceso de los últimos 15 minutos; si no, el panel pide volver a iniciar sesión.
- **Enlace de acceso con tokens:** solo vale si la sesión la abrió un enlace reciente, no un inicio de sesión con contraseña.
- **Recuperación:** en producción, el enlace del correo vuelve a `FORTIUS_INMUEBLES_SITE_URL`.
- **Inmuebles ajenos:** un asesor solo lee directo sus inmuebles; los de otros, por `fortius_inmuebles_team_properties`, ya recortados en la base (COR-23, DEC-43).

## Asesor de seguridad de Supabase (lectura del 13/11/2026)

- **Tablas con RLS y sin políticas** (`file_uploads`, `lead_conversions`, `rate_limits`, `record_references`, `record_revisions`, `signature_events`): a propósito. Nadie las lee por la API; solo el servidor o las funciones de la base.
- **Funciones SECURITY DEFINER que el personal con sesión puede llamar** (23): a propósito. Son las ayudas de las políticas (`is_admin`, `record_visible`…) y las operaciones guiadas (`put_record`, `save_intake`…), que revisan rol y alcance por dentro. Revisadas en la auditoría del 13/11/2026.
- **`public_records` sin sesión:** a propósito; es la proyección pública del sitio.
- **`rls_auto_enable` sin sesión:** función del disparador que Supabase crea para activar RLS en tablas nuevas. No se puede llamar directo; se le quita el permiso con `20261113160000_revocar_rls_auto_enable` (sin integrar).
- **Protección contra contraseñas filtradas** (consulta a HaveIBeenPwned) desactivada. Supabase la ofrece en el plan Pro; queda para cuando se decida el plan.

## Verificación en dos pasos (AUT-01)

Decisión del titular (13/11/2026): **sí, solo para el director**. Construida en la rama de seguridad, sin integrar.

1. **Quién:** solo el director puede activarla (el servidor rechaza el alta de un asesor). Asesores, cuando USR-01 dé de alta cuentas reales y el titular lo decida.
2. **Cómo:** app de códigos (TOTP: Google Authenticator, Microsoft Authenticator, 1Password…), incluida en Supabase sin costo. El SMS cuesta y es más débil.
3. **Alta:** Mi perfil → «Verificación en dos pasos» → escanear el QR (o escribir la clave) y confirmar con el primer código. Pide haber entrado en los últimos 15 minutos. Admite dos dispositivos; se recomienda registrar el segundo (otro teléfono o el gestor de contraseñas) el mismo día.
4. **Al entrar:** quien la tiene activa escribe la contraseña y después el código de 6 dígitos. La contraseña sola abre una sesión «aal1» que no sirve para el panel ni para la base: el servidor la rechaza y la migración `20261113180000_dos_pasos_del_director` hace que las funciones de permisos (`is_staff`, `is_admin`, `current_asesor_id`) tampoco la reconozcan. Un enlace de recuperación también pide el código antes de fijar la contraseña. Intentos limitados a 10 por cuenta y 30 por dirección.
5. **Sin la app activa nada cambia:** la exigencia solo aplica a quien registró y confirmó un dispositivo.
6. **Si se pierden los dos dispositivos:** el titular entra a Supabase → Authentication → Users → la cuenta del director → quita el factor. Con eso vuelve a entrar solo con contraseña y lo activa de nuevo. Quitar un dispositivo desde el panel no está disponible a propósito.
7. **Ensayo del 13/11/2026 (pasado):** con una cuenta de prueba de director, en el panel local con este código y la base actual. Se fijó la contraseña con el enlace de recuperación, se activó la app (un dispositivo), se salió y se volvió a entrar con contraseña y código, y se quitó el factor con la clave de servicio (equivale a hacerlo desde Supabase). Después se entró solo con la contraseña. Al terminar se borraron la cuenta y lo que se hizo con ella. Durante el ensayo apareció un error al confirmar el código (el contador de intentos rechazaba la clave) y se corrigió.
8. **Pendiente:** la parte de la base (migración 180000) se comprueba en producción al integrar. Que el director la active en su cuenta real cuando lo decida, después de publicar.
