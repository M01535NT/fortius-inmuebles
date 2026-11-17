# DECISIONS — cómo se hace el sitio público

Este documento dice **cómo** se construye lo que pide `SPEC.md`. Cada decisión lleva su fecha. Una decisión nueva reemplaza a la anterior: la vieja se borra, no se acumula.

## Marca (17/11/2026)

- **Colores de Fortius II.** Claro: fondo `#F8F8FF`, texto `#18202A`, texto de apoyo `#556170`, acento azul `#1B3FA6`. Oscuro: fondo `#08090A`, texto `#EDEDEF`, texto de apoyo `#8A8F98`, acento ámbar `#E0A030`.
- Un solo acento por tema: azul en claro, ámbar en oscuro. Nunca blanco ni negro puros.
- **Letra:** Geist, en pesos 400, 500 y 600. Los títulos van en 500, muy grandes y apretados.
- **Logo:** el de Fortius II (la O con dos cortes, azul y ámbar).
- **Esquinas:** 16 px en fotos y cajas grandes, 8 px en tarjetas, pastilla en botones y pestañas.
- **El cambio de marca es solo del sitio público.** PDF, formatos, membrete y paneles conservan la marca anterior.

## Diseño (17/11/2026)

- **Menú:** hamburguesa en todos los dispositivos, arriba a la derecha. No hay enlaces sueltos ni botón «Contacto» en la barra.
- **Tema claro y oscuro:** se conserva el interruptor. Las bandas con video o foto son oscuras en los dos temas; el interruptor cambia las demás.
- **Marco de fotos, video y 360°:** nada encima. El video corre sin los controles del navegador; pausar, flechas, contador, pantalla completa y compartir van debajo.
- **Inventario:** frase con filtros y tarjetas tradicionales con tres vistas. Se descartó el índice con vista previa grande porque no sirve con cientos de inmuebles.
- **Inicio:** no se centra en el método de cinco etapas ni en el expediente; esos bloques salen del inicio.
- **Movimiento:** efectos ligados al desplazamiento y videos, hechos con GSAP. El texto siempre se lee aunque la animación no corra.
- Sin antetítulos sobre los títulos, sin numeraciones decorativas y sin mayúsculas espaciadas.
- De tres opciones en adelante, lista desplegable; con dos, interruptor.

## Construcción (17/11/2026)

- **Rama:** `rediseno-sitio`, sacada de `main`. Se publica todo junto en un solo PR en borrador; no se mezclan páginas nuevas y viejas.
- **Estilos separados:** los colores, la letra y las esquinas nuevas viven bajo una clase propia del sitio. No se tocan los estilos que usan los paneles.
- **Se conserva la lógica que ya funciona** (calculadoras, formularios, filtros en la dirección, compartir, blog, datos para buscadores) y se le cambia el aspecto.
- **Formulario «Cuéntanos tu asunto»:** pide qué necesitas, nombre y teléfono. El nombre es obligatorio en el sistema; así no se cambia la base de datos.
- **Día de visita:** viaja dentro del mensaje, como hoy.
- **Mapa:** por zona, como hoy. Los pines por inmueble necesitan guardar coordenadas y decidir qué tan exacta se muestra la ubicación; queda pendiente.
- **Listado grande:** el servidor entrega las propiedades por partes.
- **Gastos de cierre:** el impuesto y el registro se calculan; notaría y avalúo se muestran «por cotizar». Las tarifas cargadas valen solo para 2026.
- **Pruebas:** las que revisan el diseño anterior se reemplazan por equivalentes del diseño nuevo, con acuerdo del titular. No se borran sin reemplazo.
- **Comprobaciones:** lint, tipos, pruebas y navegador se corren solo antes de integrar en `main`.
- **Base de datos:** esta rama no escribe migraciones. Si una hiciera falta, se avisa antes.
