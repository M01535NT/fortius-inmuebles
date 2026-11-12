---
name: gauntlet-review
description: Revisión de Fortius Inmuebles con un crítico en contexto limpio. Úsala antes de cerrar modificaciones amplias (varias secciones, flujo del panel, migraciones), entregables completos para clientes o presentación (PDF, formatos, páginas nuevas) y análisis que sustenten decisiones importantes. También cuando el titular pida «revísalo a fondo», «pásalo por el gauntlet» o una segunda opinión independiente.
---

# Gauntlet review

Un crítico que no vio cómo se hizo el trabajo lo revisa contra criterios escritos antes. El autor no se califica a sí mismo.

## 1. Antes de llamar al crítico

Escribe en `.superpowers/gauntlet/AAAA-MM-DD-<tema>.md` (carpeta ignorada por git):

- **Qué se revisa:** archivos, rutas, documento o análisis, con rutas exactas.
- **Encargo original:** las palabras del titular, citadas; no tu interpretación.
- **Criterios de aceptación:** 4 a 10, comprobables. Incluye siempre los que apliquen de `AGENTS.md`: marca (Schibsted Grotesk en el sitio, Archivo en el panel, sin rosa), sin cejas en el sitio público, corregir sin rediseñar, claro/oscuro, teclado y foco, 44 px, `prefers-reduced-motion`, móvil y escritorio, sin datos privados en HTML/PDF/API, sin instrucciones para IA en entregables.
- **Comprobaciones ya hechas** (comando y resultado) y **las que faltan**.

## 2. El crítico

Lanza un subagente nuevo (Agent, tipo `general-purpose`), nunca un fork: debe empezar sin tu contexto. Dale solo:

- el archivo del paso 1;
- la instrucción de leer los archivos o documentos indicados y, si sirve, capturar las vistas con Playwright (`channel: "msedge"`, servidor local ya corriendo, sin detenerlo);
- estas reglas: solo lectura; no correr `verify`, build, suites de navegador ni `test:live`; no tocar Supabase, GitHub ni Vercel; no imprimir secretos;
- el formato de respuesta: por cada hallazgo, criterio afectado, severidad (bloqueante / importante / menor), evidencia concreta (archivo:línea, captura o cita) y qué haría falta para cumplir.

No le digas qué crees que está bien ni le pases tu razonamiento.

## 3. Después

1. Verifica cada hallazgo contra el código o el archivo; marca **confirmado** o **descartado** con el motivo.
2. Corrige los confirmados bloqueantes e importantes dentro del alcance del encargo; lo que salga del alcance queda como pendiente, no se arregla de paso.
3. Repite solo las comprobaciones afectadas.
4. Anota todo en el mismo archivo de `.superpowers/gauntlet/`.

## 4. Veredicto

Usa una de estas tres, sin adornos:

- **Aceptado:** todos los criterios se cumplen y las comprobaciones obligatorias corrieron.
- **Aceptado con pendientes:** se cumplen los criterios, pero falta una comprobación o hay hallazgos menores; nómbralos.
- **No aceptado:** queda un bloqueante.

Nunca digas «revisado de forma independiente» si el crítico no corrió, ni «aceptado» si falta una comprobación obligatoria. Al titular, en español y breve: veredicto, qué se corrigió, qué queda pendiente y dónde está la evidencia.
