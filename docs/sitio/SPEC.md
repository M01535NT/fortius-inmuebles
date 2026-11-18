# SPEC — qué debe ser el sitio público

Este documento dice **qué** se construye. El orden está en `PLAN.md` y la forma de hacerlo en `DECISIONS.md`. Esta rama solo toca el sitio público; el panel no se toca.

Referencia visual aprobada: el lienzo «Fortius desde cero» (https://claude.ai/artifact/17nH6Sv7yvw2SBPTdgAk9c). Si un texto de aquí contradice al lienzo, se avisa y se corrige uno de los dos.

## 1. La idea

Fortius es una inmobiliaria a la que llegan asuntos diversos: vender, comprar, rentar, saber cuánto vale una propiedad o poner papeles en orden. El sitio empieza por el asunto de la persona, no por explicar un método.

## 2. Lo que vale en todas las páginas

- Menú de hamburguesa en cualquier dispositivo, arriba a la derecha. El logo va arriba a la izquierda.
- Tema claro y oscuro, con su interruptor.
- Pocas palabras, fotos y videos grandes, movimiento ligado al desplazamiento.
- Funciona con teclado, en teléfono y con el movimiento reducido activado.
- Solo se muestra lo publicado. La dirección exacta de un inmueble es privada.
- «Acceso al panel» se queda en el pie.

## 3. Inicio

1. **Portada:** la pregunta «¿Qué te trae por aquí?» y los asuntos en letra grande. Al elegir uno cambian el video de fondo, el texto y el botón.
2. **Quiénes somos:** un titular corto y un video que crece hasta ocupar la pantalla, con tres columnas: Propiedades, Papeles y Números.
3. **En el mercado ahora:** tira de propiedades que se desliza de lado.
4. **Haz números:** calculadora de mensualidad que responde al mover el precio, con accesos a las demás herramientas.
5. **Zonas:** las cuatro ciudades; cada una se abre al pasar el cursor.
6. **Guías:** los artículos más recientes del blog.
7. **Cierre:** «Cuéntanos tu asunto», con un formulario de tres campos: qué necesitas, nombre y teléfono.

## 4. Inventario

- **La frase es el filtro:** «Quiero [comprar o rentar] [cualquier propiedad] en [cualquier zona] hasta [cualquier precio]». Cada pieza abre su lista.
- Botón «Más filtros» y «Limpiar filtros».
- Barra de resultados que se queda arriba: conteo, orden y vista.
- **Tres vistas:** cuadrícula, lista y mapa.
- Tarjeta por propiedad: foto, operación, nombre, zona, tipo, precio y datos.
- Debe servir con cientos de inmuebles: se cargan por partes con «Cargar más».
- Los filtros viven en la dirección de la página, para poder compartirla.

## 5. Ficha del inmueble

En este orden:

1. **Marco limpio:** siempre tiene tres secciones, **Fotos, Video y 360°**, en todos los inmuebles; si aún no hay video o recorrido, su sección lo dice dentro del marco. Sin letras, números ni botones encima. Es lo primero que se ve: el marco y sus controles entran completos en la pantalla al abrir la ficha, con solo «Volver al inventario» arriba. Los controles van debajo del marco.
2. Nombre, ubicación aproximada y precio.
3. Cifras: terreno, construcción, recámaras, baños, estacionamientos y antigüedad.
4. Descripción y lo que ofrece.
5. Ficha técnica y documentos PDF para descargar.
6. Mapa de la zona.
7. **Qué hay alrededor:** lugares cercanos por grupo (playa y paseo, escuelas, iglesias, hoteles y servicios), con su distancia.
8. **Herramientas con el precio del inmueble:** Mensualidad, Gastos de cierre y Efectivo para comprar. Si el inmueble no admite crédito, la mensualidad se cambia por «Compra de contado». En renta, por el costo de entrada.
9. Preguntas frecuentes.
10. Asesor asignado, con días para proponer la visita.
11. Inmuebles recomendados.

Una barra flotante con el asesor y «Solicitar visita» acompaña toda la página.

## 6. Las demás páginas

Vender, Comprar, Herramientas (hipoteca y gastos de cierre), Nosotros, Contacto, Blog, Preguntas frecuentes, Avisos, Privacidad y Términos conservan lo que hoy hacen y adoptan el diseño nuevo. Vender y Contacto se bocetan antes de construirse.

## 7. Lo que no cambia

- El panel y el panel provisional, con su logo y sus colores.
- Los PDF, formatos y membrete.
- Los cálculos, los formularios y las reglas de publicación: solo cambia su aspecto.

## 8. Lo que falta decidir

- Los nombres definitivos de los asuntos de la portada.
- Mapa con un pin por inmueble (hoy solo se conoce la zona).
- Foto de cada asesor en la ficha.
