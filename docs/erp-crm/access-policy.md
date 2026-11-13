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

Lectura del 12/11/2026: registro abierto desactivado, acceso solo por correo y confirmación de correo obligatoria. El código tiene recuperación de contraseña, pero no invitación ni MFA. SMTP propio, URL de retorno y MFA del proyecto no se pudieron leer sin la API de administración. Detalle en [entornos](environment-release.md).

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

## Propuesta de MFA (AUT-01, 13/11/2026, sin activar)

1. **Quién:** solo el director al principio; asesores después, cuando USR-01 dé de alta cuentas reales.
2. **Cómo:** app de códigos (TOTP), incluida en Supabase sin costo. El SMS cuesta y es más débil.
3. **Recuperación antes de exigirlo:** registrar dos dispositivos (teléfono y un segundo equipo o gestor de contraseñas). Si se pierden ambos, la base permite quitar el factor con la clave de servicio; ese paso lo hace el titular desde Supabase y queda registrado.
4. **Orden:** activar el enrolamiento, ensayar la pérdida de un dispositivo con una cuenta de prueba y solo después exigir el segundo factor en el panel (sesión AAL2) para acciones del director.
5. **Pendiente del titular:** decidir si se exige y tener la cuenta y el buzón de prueba para ensayarlo.
