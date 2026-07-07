# Copywriting — Home (v1 implementado)

Estado: **implementado** en `src/components/home/*` bajo la marca provisional **Cota**. Este documento es la fuente de verdad del copy del Home. Si editas copy, edítalo aquí y en el componente.

Fuentes de contexto:

- `InvestigacionModeloNegocio.md`
- `Proceso-Operativo-Inmobiliario.docx`
- `DesignDirection.md` (dirección visual vigente)

---

## Decisión Estratégica

El Home dejó de ser multi-audiencia. Es **una sola historia para el propietario que va a vender**, de navbar a footer. Compradores y rentadores tienen rutas propias (pendientes de rediseño).

## Ángulo Central

En bienes raíces lo que asusta no es el precio: es la sensación de estar improvisando. La mayoría de las operaciones se manejan a corazonadas. Nuestra diferencia no es un superlativo, es un **método documentado**.

> **Idea rectora:** *No prometemos resultados. Documentamos el proceso.*
> El método es la prueba. La certeza es el beneficio.

Reglas derivadas:

- Todo beneficio se expresa como acción concreta (revisar papeles, precio con comparables, reportes por escrito), nunca como abstracción ("acompañamiento", "proceso claro").
- La honestidad vende: admitir que no prometemos fechas refuerza la confianza.
- Los códigos internos de documentos (`VAL-CMA-001`…) se muestran: el código es la credibilidad.

## Voz Y Tono

- Profesional, directo, de "tú". Frases cortas, verbos concretos, cero relleno.
- 4 ejes: casual-medio, serio, respetuoso-alto, entusiasmo contenido.
- Prohibido: "la mejor inmobiliaria", "premium", "oportunidad única", "garantizado", "solución integral", adjetivos sin hecho detrás, y guiones largos (—) en el copy visible.

---

## Copy Implementado (por orden de scroll)

### 1. Navbar

- Marca: **Cota** (glifo de acotación + wordmark)
- Links ancla: Método · Entregables · Respuestas
- CTA: **Evaluar mi propiedad** → `#evaluar`
- Toggle de tema claro/oscuro

### 2. Hero (rotador de imágenes, 8s, Ken Burns)

H1:

> Vende con plan, no con anuncios.

Sub:

> Precio con datos, expediente revisado y seguimiento por escrito. De la captación a la firma ante notario, en Tijuana y Baja California.

CTAs: **Evaluar mi propiedad** (primario) · **Conocer el método** (secundario → `#metodo`)

### 3. El Problema (declaración editorial, sin título de sección)

> La mayoría de las propiedades salen al mercado igual: fotos de celular, precio al tanteo y a esperar llamadas.

> Eso atrae curiosos, quema semanas y suele terminar en rebajas. Y cuando por fin aparece un comprador real, un papel pendiente detiene todo en la recta final.

### 4. El Giro (bloque verde, único bloque de color)

> **No prometemos resultados. Documentamos el proceso.**

> Cada operación sigue el mismo método por escrito, de la captación a la firma. Por eso siempre sabes en qué paso va la tuya, y qué sigue después.

### 5. El Método — "Cuatro fases. Un expediente."

Intro: *Es el mismo proceso en cada operación, con documentos definidos en cada fase. Pídelo completo en tu primera reunión.*

1. **Captación** — dictamen documental antes de publicar · análisis comparativo de mercado · contrato con plan de trabajo por escrito.
2. **Preparación** — puesta a punto y staging · fotografía y video profesional · publicación multicanal con estrategia.
3. **Comercialización** — filtro de prospectos antes de cada visita · reporte de avances cada 30 días · ofertas por escrito, analizadas contigo.
4. **Cierre** — costos de cierre estimados por adelantado · checklist documental para notario · entrega de posesión documentada.

### 6. Entregables — "Papeles, no promesas."

Intro: *Cada fase produce documentos con nombre y código en nuestro manual interno. Estos seis los recibes tú, en este orden.*

| # | Código | Documento | Promesa |
|---|---|---|---|
| 01 | DUE-LEG-001 | Análisis de Factibilidad | Si tu inmueble se puede vender, o qué subsanar antes |
| 02 | VAL-CMA-001 | Opinión de Valor | Comparables vendidos para un precio defendible |
| 03 | PLA-TRA-001 | Plan de Comercialización | La ruta de trabajo por escrito |
| 04 | GAS-CIE-001 | Cálculo de Gastos | Impuestos, comisión y cuánto te queda libre |
| 05 | CON-PSE-001 | Contrato | Todo bajo contrato, certeza para las dos partes |
| 06 | REP-MAR-001 | Reportes | Avances por escrito cada 30 días |

Nota: celdas uniformes, sin destacar ninguna (decisión del 6-jul-2026).

### 7. Respuestas (objeciones, acordeón)

1. **¿Cuánto tarda en venderse una propiedad?** — Depende de zona, precio y tipo. Desconfía de quien promete fecha exacta. Nosotros revisamos el avance con datos cada 30 días y ajustamos estrategia.
2. **¿Cómo definen el precio de salida?** — Análisis comparativo de mercado. Un precio que atraiga ofertas reales, sin regalar ni espantar.
3. **¿Cuánto voy a pagar de costos de cierre?** — Estimación desglosada desde el principio; los montos varían y se confirman con el notario o especialista.
4. **¿Qué necesito para empezar?** — Solo datos básicos del inmueble; te decimos qué documentos tener listos.

### 8. Zonas (marquee)

Zona Río · Otay · Playas de Tijuana · La Mesa · Santa Fe · El Florido · Chapultepec · Cacho · Rosarito · Tecate · Ensenada

### 9. Conversión — "¿Cuánto vale tu propiedad?"

> Cuéntanos lo básico. Sin compromiso y sin publicar nada antes de revisarlo contigo.

Pasos: 01 Recibimos los datos → 02 Revisamos zona y comparables vendidos → 03 Te contactamos con una lectura inicial de valor y el siguiente paso.

Form: Nombre · Teléfono o WhatsApp · Zona o colonia · Tipo de propiedad. Botón: **Solicitar evaluación**.
Microcopy: *Sin compromiso. Usamos tus datos solo para dar seguimiento a tu solicitud.*
Éxito: *Recibimos los datos de tu propiedad. Revisamos la información y te contactamos para decirte cuál es el siguiente paso.*

### 10. Footer

Tagline: *Bienes raíces con método en Tijuana y Baja California.*
Legal: *Los costos, impuestos y tiempos varían por operación y se confirman con el notario o el especialista correspondiente.*

---

## Meta SEO (implementado en layout)

Title: `COTA | Vende tu propiedad en Tijuana con método`
Description: `Firma inmobiliaria en Tijuana y Baja California. Precio con datos, expediente revisado y seguimiento por escrito, de la captación a la firma ante notario.`

## Guardrails De Copy (vigentes)

- No prometer venta rápida ni fechas sin datos propios.
- No usar "garantizado" para resultados comerciales, legales o financieros.
- No publicar cifras de clientes, cierres, años o inventario sin verificar.
- No afirmar credenciales (REAPI, AMPI, CEPIBC) hasta confirmarlas.
- Costos/ISAI/ISR/fideicomiso siempre con la aclaración de que varían y se confirman con el especialista.
- No testimonios ficticios; sin prueba social real, la sección no existe.
- Solo mencionar documentos y prácticas que ocurren de verdad (se eliminó "Matriz de Comparación de Ofertas" por esa razón).

## Pendientes

- Nombre comercial definitivo (Cota es provisional).
- WhatsApp, teléfono y correo reales (footer dice "por confirmar").
- Endpoint real del formulario (hoy confirma localmente).
- Credenciales verificables para habilitar prueba de autoridad.
- Copy de páginas interiores (comprador, rentas, zonas) con esta misma voz.
