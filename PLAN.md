# PLAN — en qué orden se hace

Este documento da **la pauta**: qué sigue y cómo sabrás que quedó. Qué se construye está en `SPEC.md`; cómo, en `DECISIONS.md`. Lo terminado se marca y, al cerrar la etapa, se borra de aquí: queda en el historial de git.

## Dónde estamos

Etapas 1, 2 y 3 construidas (17/11/2026). Inventario y Ficha ya se vieron en el navegador local con el único inmueble de prueba. Falta tu visto bueno a la etapa 0. Sigue la etapa 4 (Inicio) cuando lo indiques.

## Etapas

| Etapa | Qué se hace | Cómo sabrás que está lista | Tamaño |
|---|---|---|---|
| 0. Documentos | Rama nueva y documentos limpios | Lees SPEC, PLAN y DECISIONS y describen el sitio nuevo | Chico |
| 1. Cimientos | Colores, letra, logo, menú, pie, botones y tarjetas | Todas las páginas abren con la piel nueva | Mediano |
| 2. Inventario | Frase con filtros, tarjetas, tres vistas, «Cargar más» | Filtras y cambias de vista con tus inmuebles | Mediano |
| 3. Ficha | Marco limpio, alrededores, herramientas, asesor | Una ficha tiene sus once bloques | Grande |
| 4. Inicio | Portada por asuntos, videos, calculadora, zonas, cierre | El inicio se ve y se mueve como el boceto | Grande |
| 5. Demás páginas | Boceto de Vender y Contacto; luego el resto | No queda ninguna página con el diseño viejo | Grande |
| 6. Movimiento y teléfono | Efectos de desplazamiento, teléfono, teclado, contraste | Lo recorres en tu teléfono sin tropiezos | Mediano |
| 7. Limpieza | Se retiran estilos viejos; ícono, imagen para compartir, pruebas nuevas | No queda rastro del diseño anterior | Mediano |
| 8. Publicación | Comprobación completa y un PR en borrador | Lo revisas y decides cuándo sale | Chico |

## Etapa 0, paso a paso

- [x] Crear la rama `rediseno-sitio`.
- [x] Reescribir `SPEC.md`, `PLAN.md` y `DECISIONS.md`.
- [x] Podar `README.md`, `AGENTS.md` y `docs/README.md`; borrar la marca y el documento de producto anteriores.
- [ ] Actualizar el boceto: menú de hamburguesa en lugar de enlaces y «Contacto».
- [ ] Tu visto bueno a los tres documentos.

## Etapa 1, paso a paso

- [x] Colores, letra Geist, espacios y esquinas nuevas, solo en el sitio.
- [x] Logo de Fortius II para fondo claro y oscuro.
- [x] Cabecera: logo, buscador y botón de menú.
- [x] Menú y buscador con el aspecto nuevo.
- [x] Pie con sus enlaces, tema y «Acceso al panel».
- [x] Piezas base: botones, pestañas, distintivos, listas, campos y tarjeta de propiedad.
- [x] Todas las páginas abren con colores, letra, cabecera y pie nuevos (su acomodo sigue siendo el viejo).
- [ ] Revisarlo en el navegador (al integrar).

## Etapa 2, paso a paso

- [x] La frase es el filtro: operación, tipo, zona y precio máximo, cada uno con su lista.
- [x] «Más filtros» (moneda y rango de precio) y «Limpiar filtros».
- [x] Barra de resultados que se queda arriba: conteo, orden (incluye mayor superficie) y vista.
- [x] Tres vistas: cuadrícula, lista y mapa por zona.
- [x] El servidor entrega de 12 en 12; «Cargar más» trae la siguiente parte.
- [x] Filtros y vista en la dirección; al volver de una ficha se recupera lo cargado y la posición.
- [x] Comparar hasta tres propiedades.
- [ ] Probarlo con muchos inmuebles (hoy la base tiene uno).

## Etapa 3, paso a paso

- [x] Banda oscura con nombre, ubicación aproximada, precio y precio por m².
- [x] Marco limpio con todos los controles debajo; ampliación de fotos.
- [x] Cifras, descripción con lo que ofrece, ficha técnica y documentos.
- [x] Mapa de la zona a todo lo ancho con «Abrir en Maps».
- [x] Qué hay alrededor, por grupo (sale cuando el inmueble tiene lugares capturados).
- [x] Herramientas con el precio: mensualidad, gastos de cierre, efectivo; contado y renta.
- [x] Preguntas, asesor con días de visita, propiedades parecidas y barra flotante.
- [ ] Verla con un inmueble con lugares cercanos, video, 360°, sin crédito y en renta (hoy solo hay uno, de venta con crédito).

## Lo que te toca a ti

- Confirmar los nombres de los asuntos de la portada.
- Dar la foto de cada asesor.
- Capturar en el panel los lugares cercanos de cada inmueble.
- Decidir si «Qué hay alrededor» necesita los grupos iglesias y hoteles: hoy el panel no los tiene.
- Aprobar el reemplazo de las pruebas del diseño anterior. Con la etapa 1 ya no pasan: la que pide la letra anterior y las que buscan el botón «Cambiar a tema oscuro» (ahora es un interruptor «Tema oscuro»). Con la etapa 2, las dos pruebas del inventario anterior (filtros en una fila y lectura de la dirección) y las de comparar en el navegador. Con la etapa 3, las del navegador que buscan la galería anterior de la ficha. Las de la galería, la tarjeta de visita y la barra del teléfono anteriores siguen pasando porque esas piezas siguen en el código hasta la etapa 7.

## Al integrar

`main` y la rama del panel tienen sus propios `SPEC.md` y `PLAN.md`, que hablan del panel. Al juntar esta rama, esos documentos se unen con estos; no se reemplazan.
