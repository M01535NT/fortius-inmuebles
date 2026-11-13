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

## Controles agregados el 13/11/2026 (rama de seguridad, sin integrar)

- **Límite de intentos propio** (`fortius_inmuebles_auth_attempt`): por hora, acceso hasta 30 intentos por IP y 20 por correo; recuperación hasta 5 por IP y 3 por correo. Se cuentan huellas SHA-256, nunca la IP ni el correo. Mientras la migración no esté aplicada, el acceso sigue funcionando sin este límite.
- **Cambiar la contraseña** exige un enlace de invitación o recuperación de la última hora, o un acceso de los últimos 15 minutos; si no, el panel pide volver a iniciar sesión.
- **Enlace de acceso con tokens:** solo vale si la sesión la abrió un enlace reciente, no un inicio de sesión con contraseña.
- **Recuperación:** en producción, el enlace del correo vuelve a `FORTIUS_INMUEBLES_SITE_URL`.
- **Inmuebles ajenos:** un asesor solo lee directo sus inmuebles; los de otros, por `fortius_inmuebles_team_properties`, ya recortados en la base (COR-23, DEC-43).
