# Portada MNT: copy, movimiento y calidad

Fecha: 23 de septiembre de 2026. Cambios implementados y verificados en el proyecto local. Por solicitud posterior del usuario, se aplicó la migración editorial 007 en producción y se preparó la publicación por `main` en Vercel. La comprobación SQL confirmó `editorial_applied=true`, 28 registros antes y después, y lectura pública conservada.

## Experiencia

- Se conservan la entrada de letras con GSAP/SplitText, el parallax, Ken Burns, los botones magnéticos, el menú circular y el recorrido vertical del método. El cambio entre fotografías añade un barrido de 1.4 segundos.
- El carrusel permite pausar y elegir imágenes, se detiene fuera de pantalla y cuando la pestaña está oculta. En móvil mantiene movimiento con desplazamientos menores y sin desenfoque por letra. Respeta la preferencia del sistema de reducir movimiento.
- Los textos de apertura permanecen legibles desde la carga. Las escenas inferiores preparan sus animaciones al aproximarse a pantalla. El menú se monta al solicitarlo y conserva su cierre animado y recuperación de foco, incluso cuando se interrumpe la entrada.
- Se revisó el copy con Humanizer: lenguaje concreto, alcance de los servicios y distinción entre precios anunciados, cierres documentados y estimaciones. Los ejemplos del inventario se identifican como tales.
- El panel permite editar los seis campos originales y 23 textos adicionales de la portada. Los valores personalizados se conservan; solo se sustituyen valores históricos exactos o campos vacíos por los nuevos textos predeterminados.
- Teléfono, WhatsApp y Messenger se completarán después en Configuración, según la indicación del usuario. No se inventaron destinos. Los formularios deshabilitados ya no invitan a capturar datos que no se pueden enviar.

## Stack

Se mantienen React 19, TypeScript 6, Tailwind 4, GSAP 3.15, Motion 12 y Supabase. Next.js y su configuración ESLint se actualizaron a 16.3.6. La última instalación informó cero vulnerabilidades en la auditoría de dependencias. Se incorporaron Speed Insights, pruebas de accesibilidad con axe y medición reproducible con Lighthouse.

## Verificación

- `npm run verify`: lint, tipos, 195 pruebas de backend, 124 de interfaz y compilación de producción correctos.
- Portada compilada: cuatro escenarios correctos para 375, 768 y 1440 px, navegación, carrusel, cierre/reapertura del menú, temas, movimiento reducido y comprobación automática WCAG AA. Esto no equivale a una certificación integral de accesibilidad.
- Panel y fronteras públicas con backend deliberadamente no disponible: 18 escenarios correctos.
- Formularios: siete escenarios correctos de JavaScript desactivado, hidratación demorada, conservación de borradores ante errores y entrega solo tras confirmación del servidor. Se corrigió el adaptador de enlaces del simulador Vite; la navegación real se verifica por separado en el sitio compilado.
- La migración editorial se verifica con PostgreSQL embebido: conserva textos propios y mantiene listas explícitas de campos permitidos en SQL y en la validación del servidor.

### Rendimiento pendiente

Lighthouse móvil, mediana de tres cargas con perfil nuevo y animaciones activas, contra el servidor local compilado y un backend local de solo lectura:

| Métrica | Medición | Objetivo | Estado |
| --- | ---: | ---: | --- |
| LCP | 3.68 s | 2.5 s | Pendiente |
| CLS | 0 | 0.1 | Cumple |
| TBT | 19 ms | 200 ms | Cumple |

El presupuesto opcional de rendimiento falla por LCP; no se redujo el objetivo para ocultarlo. Los resultados de laboratorio no acreditan Core Web Vitals de usuarios reales ni INP. Los informes completos quedan en `tmp/performance`. La siguiente optimización debe centrarse en los recursos iniciales y verificarse después en el entorno publicado; se conserva el movimiento visual solicitado.

## Publicación y operación

1. Migración `supabase/migrations/202609230007_fortius_inmuebles_home_editorial.sql` aplicada en el proyecto `fortius-inmuebles` mediante SQL Editor. Solo amplía la proyección pública del contenido con una lista de campos permitidos; no reescribe registros. No volver a ejecutarla en esa instancia.
2. Desplegar la versión y verificar la portada, el guardado editorial y las rutas públicas.
3. Habilitar Speed Insights en el proyecto de Vercel para obtener métricas de usuarios reales. El componente excluye `/admin` y elimina consultas y fragmentos de las URLs reportadas.
4. Completar los contactos en Configuración y sustituir o despublicar el inventario de ejemplo antes de operar comercialmente. Los formularios de captación siguen dependiendo de su activación explícita y del backend configurado.

La dirección visual y las animaciones no garantizan un reconocimiento Awwwards. La calidad final también requiere fotografía propia, inventario real, información comercial validada y mediciones sobre la versión publicada.
