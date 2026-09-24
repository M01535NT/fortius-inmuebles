# Fuentes para documentos MNT

Estas copias se incrustan en los PDF del servidor. La interfaz web mantiene `next/font/google` y su distribución WOFF2.

- `Archivo-Regular.ttf`: instancia estática, peso 400 y ancho 100.
- `Archivo-SemiBold.ttf`: instancia estática, peso 600 y ancho 100.
- `IBMPlexMono-Medium.ttf`: original de Google Fonts, peso 500.

Archivo procede del subconjunto latino de la compilación de la web en el commit `5ca5174`; convertido de WOFF2 a TTF e instanciado con fontTools 4.66.0. Los nombres PostScript distinguen las instancias para preservar sus pesos al incrustarlas. Incluye los caracteres españoles. Las conversiones conservan la licencia SIL Open Font License.

Fuentes y licencias originales:

- https://github.com/google/fonts/tree/main/ofl/archivo
- https://github.com/google/fonts/tree/main/ofl/ibmplexmono

Las licencias completas acompañan los archivos. No sustituir las fuentes sin comprobar los saltos de línea, la paginación y la extracción de texto de los documentos.
