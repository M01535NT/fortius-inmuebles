# Auditoría de campos por formato (CSR-04)

**Fecha:** 31/10/2026. **Pregunta:** ¿la captura pide algo que el PDF no imprime? **Método:** para cada formato del catálogo se armó su documento con un valor de ejemplo en cada campo y se compararon los campos capturados con las celdas que el documento imprime y vuelve pulsables en la ventana en vivo (`src/lib/formatos/documento/*`). La columna «Del expediente» cuenta los campos que ya se llenan desde «Datos del expediente» (DAT-EXP) y que, con CSR-01, dejan de pedirse en el formato.

## Resultado

| Formato | Campos capturados | Impresos y pulsables | Del expediente | Sin celda propia |
|---|---|---|---|---|
| 01 | 48 | 47 | 3 | folio |
| 02 | 30 | 29 | 6 | folio |
| 03 | 0 | — | — | No es un documento (checklist) |
| 04A | 78 | 76 | 3 | idInmueble, folio |
| 04B | 73 | 71 | 6 | idInmueble, folio |
| 04C | 75 | 73 | 5 | idInmueble, folio |
| 04D | 72 | 70 | 1 | idInmueble, folio |
| 04E | 71 | 69 | 1 | idInmueble, folio |
| 04F | 106 | 104 | 2 | idInmueble, folio |
| 04G | 66 | 64 | 3 | idInmueble, folio |
| 05 | 49 | 48 | 6 | folio |
| 06 | 20 | 19 | 1 | folio |
| 07 | 96 | 95 | 10 | folio |
| 08 | 16 | 15 | 2 | folio |
| 09 | 61 | 60 | 5 | folio |
| 10 | 66 | 65 | 11 | folio |
| 11 | 67 | 66 | 2 | folio |
| 12 | 39 | 38 | 0 | folio |
| 13 | 22 | 21 | 1 | folio |
| 14 | 34 | 33 | 4 | folio (los siete campos de contraoferta se imprimen solo cuando el propietario contraoferta) |
| 15 | 94 | 93 | 12 | folio |
| 16 | 38 | 37 | 1 | folio |
| 17 | 24 | 23 | 1 | folio |
| 18 | 24 | 24 | 1 | — (numeroRecibo se volvió pulsable en esta revisión) |
| 19 | 10 | 9 | 1 | folio |
| **Total** | **1 279** | **1 241** | **88** | |

## Conclusiones

- **Ningún campo se retira.** Todo lo que se captura se imprime: `folio` e `idInmueble` salen en el encabezado como datos del sistema (no se escriben a mano, por eso no tienen celda pulsable), y los campos de contraoferta del 14 se imprimen cuando aplica la contraoferta.
- **Una corrección:** en el 18 (recibo), «Número de recibo» se imprimía pero su celda no era pulsable; ahora la celda abre los dos campos de la tabla. El PDF no cambia.
- **Lo que sí baja la captura** no es quitar campos sino no pedirlos dos veces: 88 celdas se llenan desde el expediente (CSR-01) y las fechas que son «hoy» (`fecha`, `fechaEmision`, `fechaCorte`, `fechaRegistro`, `fechaEntrevista`, `fechaValor`) nacen llenas (CSR-02). Los datos de la persona (nombre, teléfono, correo, CURP, RFC, estado civil, fecha de nacimiento, domicilio, identificación) y del inmueble (tipo, superficies, recámaras, baños) llegan solos al expediente desde sus fichas.
- **Pendiente de producto:** ordenar «lo conocido primero y lo nuevo al final» dentro de cada formato cambia el orden de las secciones de captura sin tocar el PDF; se decide formato por formato con el titular cuando revise la ventana en vivo.

## Cómo repetirla

El guion de la auditoría vive fuera del repositorio (carpeta de trabajo del agente); recorre `FORMATOS`, arma cada documento con `DOCUMENTOS[id]` y recoge las `keys` de sus zonas. Repetirla cuando se agregue un campo al catálogo o una plantilla cambie.
