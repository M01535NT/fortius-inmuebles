# Módulo de tareas: implementación y activación pendiente

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

Las pruebas simuladas no equivalen a escrituras en Supabase real. La migración no se ha aplicado y la nueva función no se declara disponible en producción.

## Respaldo y limitaciones

Respaldo REST local verificado por SHA-256 en `.superpowers/backups/2026-09-23T07-15-13-205Z`, excluido de Git: 14 registros activos, relaciones, miembros y límites. Storage devolvió tres buckets MNT y cero objetos. La tabla de revisiones denegó lectura con código 42501; por ello el respaldo no es completo y no debe presentarse como tal. Se necesita exportación del propietario antes del corte para incluir revisiones y definiciones SQL. No se borraron ni cambiaron registros remotos.

## Activación

La sesión administrativa de Supabase expiró. No existe una conexión SQL ni token administrativo disponible en este entorno. La clave del sitio no sustituye el acceso de propietario necesario para cambiar el esquema.

1. Entrar a `https://supabase.com/dashboard/project/qkkirjzhviqwvuqjnmei/sql/new` como propietario. Es posible desde el celular; esa sesión permite ejecutar SQL allí, pero no inicia sesión en la PC.
2. Exportar respaldo completo del propietario y verificarlo antes de ejecutar cambios.
3. Confirmar migraciones 001–005 aplicadas. Ejecutar una sola vez `supabase/migrations/202609230006_mnt_tasks.sql`. Es una transacción; conserva los registros existentes y modifica la validación para admitir tareas. Ante cualquier error, detenerse y conservar el mensaje.
4. Verificar esquema, permisos y recuentos; probar creación/edición/conflicto con una tarea de QA identificada y luego cancelarla (no borrar registros reales).
5. Publicar el código, comprobar rutas y acceso móvil, actualizar este reporte con evidencia real.

La reversión de aplicación conserva las tareas y su historial. No eliminar colección, filas ni objetos para revertir la interfaz.

## Uso

Abrir Tareas → Nueva tarea; definir título y, si procede, responsable y fecha. Usar plantilla solo si corresponde a la operación. Ampliar «Descripción, categoría y vínculos» para relacionar lead, cliente o inmueble. Los pasos se marcan y se guardan; las notas se agregan al historial al guardar. En espera requiere motivo. Dashboard y calendario reflejan el mismo registro.

No incluye mensajes automáticos, recurrencias ni sincronización externa.
