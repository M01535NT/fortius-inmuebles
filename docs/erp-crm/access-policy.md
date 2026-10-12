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
