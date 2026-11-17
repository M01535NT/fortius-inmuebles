# PLAN — en qué orden se hace

Este documento da **la pauta**: qué sigue y cómo sabrás que quedó. Qué se construye está en `SPEC.md`; cómo, en `DECISIONS.md`. Lo terminado se marca y, al cerrar la etapa, se borra de aquí: queda en el historial de git.

## Dónde estamos

Etapa 0, en curso. No se ha tocado código del sitio.

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

## Lo que te toca a ti

- Confirmar los nombres de los asuntos de la portada.
- Dar la foto de cada asesor.
- Capturar en el panel los lugares cercanos de cada inmueble.
- Aprobar el reemplazo de las pruebas del diseño anterior.

## Al integrar

`main` y la rama del panel tienen sus propios `SPEC.md` y `PLAN.md`, que hablan del panel. Al juntar esta rama, esos documentos se unen con estos; no se reemplazan.
