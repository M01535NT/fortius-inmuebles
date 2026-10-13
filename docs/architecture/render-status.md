# Renderizado y reproducibilidad

## Qué ocurrió

En la fase de auditoría anterior **no se ejecutó el renderizado**: no había ejecutable/JAR de PlantUML disponible y el encargo prohibía instalar dependencias. Por tanto, entonces no había evidencia de un fallo de sintaxis ni de que los diagramas fueran irrenderizables.

La autorización posterior incluyó renderizado y archivos documentales. Se utilizó un JAR temporal aislado en `/tmp/fortius-architecture-render`, sin añadir paquetes al proyecto, cambiar lockfiles ni configurar infraestructura. Java y Graphviz ya estaban disponibles. C4-PlantUML está incluido en la biblioteca estándar del JAR; no se requirió un servidor público de renderizado ni se envió la arquitectura a terceros.

Durante esta ejecución aparecieron dos errores de sintaxis en los diagramas complementarios: saltos de línea literales dentro de etiquetas entre comillas en despliegue y declaraciones entity de una sola línea en el modelo de datos. Se corrigieron usando escapes de línea y bloques multilínea. Los diagramas C4 no presentaron esos errores. La revisión visual detectó además que la biblioteca C4 ocultaba la leyenda personalizada; se activó su visualización explícitamente.

## Motor fijado

- PlantUML **1.2026.8**, build149874a; biblioteca C4 incluida en ese artefacto.
- JAR oficial: https://github.com/plantuml/plantuml/releases/download/v1.2026.8/plantuml.jar
- SHA-256 verificado contra digest de GitHub: `5e1ecfa8ecd32c90b03bbf3b1eb6f020943f98ab0fcf4032be31a0002ee2c462`.
- Java OpenJDK disponible en el entorno; Graphviz2.42.4.
- Los includes `<C4/C4_Context>`, `<C4/C4_Container>` y `<C4/C4_Component>` se resuelven dentro del JAR.

## Resultado

Once fuentes `.puml`, once SVG y once PNG. El renderizado final de ambas salidas terminó con código0. SVG es el formato recomendado para ampliar los diagramas sin pérdida. Se revisaron imágenes, títulos, etiquetas y leyendas. Esto comprueba sintaxis y composición; no convierte inferencias en hechos ni sustituye la evidencia del informe.

Comandos reproducibles, ejecutados desde la raíz del repositorio con el JAR ya disponible:

```bash
java -Djava.awt.headless=true -jar /tmp/fortius-architecture-render/plantuml.jar -tsvg -failfast2 'docs/architecture/**/*.puml'
java -Djava.awt.headless=true -jar /tmp/fortius-architecture-render/plantuml.jar -tpng -failfast2 'docs/architecture/**/*.puml'
```

El JAR temporal no se incluye en la entrega ni se considera dependencia de Fortius. Para reproducir en otra máquina, verificar su digest y disponer de Java/Graphviz. No se requiere desplegar la aplicación.
