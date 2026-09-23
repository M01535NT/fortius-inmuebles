# Módulo de tareas: implementación y activación

## Implementado

Colección privada de tareas; listado y detalle; responsables, fechas, prioridad, categorías, vínculos a registros, pasos, notas, estados e historial. El Dashboard agrupa pendientes y permite completarlos. El calendario muestra sus vencimientos sin insertar eventos duplicados. Las plantillas son borradores opcionales.

Las fechas de vencimiento usan Tijuana. En móvil se muestran búsqueda y vencimiento; los demás filtros se abren con «Más filtros». La edición conserva el borrador en errores y conflictos; ante un cambio simultáneo permite revisar la versión actual antes de usarla como base. Cancelar conserva el registro y reabrir conserva el historial.

El servidor controla autor, creación, modificación e historial. Los usuarios no pueden suplantar esos datos desde el formulario. Se conservan referencias, permisos y control de versiones. La auditoría no se recorta: al alcanzar el límite del registro, se rechaza la modificación y se solicita una continuación.

## Verificación

- 168 pruebas de backend, incluida la cadena de migraciones 001–006 ejecutada en PostgreSQL aislado (PGlite), validación, referencias, permisos, conflictos y auditoría.
- 121 pruebas de componentes del panel, incluidas creación, plantillas, fechas de Tijuana, conflictos, recuperación explícita y conservación del borrador.
- Compilación de producción, TypeScript y ESLint.
- Recorridos de navegador con API simulada: creación, recarga, pasos, espera, completar, reabrir y calendario a 320, 390, 768 y 1440 px. Regresiones de leads y panel también verificadas.
- Revisión visual manual en localhost a 390 px con datos ficticios y escrituras bloqueadas. Esta revisión motivó compactar los filtros.

Las pruebas simuladas se complementaron con una prueba transaccional en Supabase real bajo el rol authenticated y un miembro existente: creación, lectura, historial autoritativo, cierre y rechazo de versión obsoleta PT409. La transacción terminó en rollback: cero tareas residuales y 59 revisiones conservadas.

## Respaldo y limitaciones

Respaldo completo del propietario verificado en `.superpowers/backups/2026-09-23T07-30-25-907Z`, excluido de Git: 14 registros, 59 revisiones, 3 relaciones, un miembro y 3 registros de límites. Incluye definiciones de funciones, permisos y restricciones. Storage devolvió tres buckets MNT y cero objetos. Esta copia sustituye para el corte al respaldo REST parcial anterior.

El respaldo se restauró en PostgreSQL aislado (PGlite), incluyendo las definiciones reales del servidor, y se ensayó la migración sin alterar datos. Después del cambio real, las cinco tablas conservaron exactamente sus SHA-256 canónicos; las cuatro funciones nuevas o modificadas coincidieron con las del ensayo. Evidencia local: `.superpowers/backups/2026-09-23-tasks-owner/rehearsal.json` e `integrity.json`.

## Activación

Migración 006 aplicada al proyecto dedicado mediante sesión del propietario. El editor mostró un aviso de función existente al repetir contenido; se detuvo la repetición y se verificaron definiciones y datos antes de continuar. La migración no debe volver a ejecutarse. Permisos comprobados: anon no puede ejecutar el validador privado y authenticated conserva acceso al RPC de escritura.

Código integrado y enviado a main para despliegue en Vercel. La comprobación del despliegue se realiza después de la activación de la base de datos.

La reversión de aplicación conserva las tareas y su historial. No eliminar colección, filas ni objetos para revertir la interfaz.

## Uso

Abrir Tareas → Nueva tarea; definir título y, si procede, responsable y fecha. Usar plantilla solo si corresponde a la operación. Ampliar «Descripción, categoría y vínculos» para relacionar lead, cliente o inmueble. Los pasos se marcan y se guardan; las notas se agregan al historial al guardar. En espera requiere motivo. Dashboard y calendario reflejan el mismo registro.

No incluye mensajes automáticos, recurrencias ni sincronización externa.
