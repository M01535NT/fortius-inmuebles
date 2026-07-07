# Spec - Firma Inmobiliaria Estrategica

## Diagnostico Estrategico

No se esta construyendo una pagina de inmuebles. Se esta construyendo una plataforma digital de posicionamiento para una firma inmobiliaria que quiere comunicar metodo, criterio profesional, confianza y capacidad de comercializacion.

El Home no debe comportarse como portal de busqueda. Su trabajo es captar prospectos serios, especialmente propietarios y clientes que necesitan orientacion antes de vender, comprar o invertir.

## Publicos

### Principal

- Propietarios que quieren vender o rentar sin improvisar precio, expediente ni promocion.
- Compradores e inversionistas que quieren evaluar oportunidades con criterio comercial y documental.

### Secundario

- Empresas o clientes con necesidades comerciales e industriales.
- Personas que todavia no saben si su inmueble esta listo para salir al mercado.

## Objetivo Del Home

Provocar una accion principal: solicitar una opinion de valor o diagnostico inmobiliario.

El usuario debe entender en pocos segundos:

- Que la firma trabaja con metodo.
- Que atiende vender, comprar e invertir.
- Que revisa precio, mercado, expediente y cierre.
- Que opera en Tijuana, Tecate, Rosarito y Ensenada.
- Que el siguiente paso no es buscar propiedades, sino pedir orientacion.

## Posicionamiento

Comercializacion inmobiliaria con estrategia, analisis y criterio profesional.

Variacion visible para el Home:

> Vender, comprar o invertir con metodo.

## Objeciones Que Debe Resolver

- "No se si mi propiedad esta lista para venderse."
- "No quiero publicar sin saber el valor real."
- "No quiero perder tiempo con prospectos no calificados."
- "Me preocupa la documentacion."
- "Necesito entender si una propiedad tiene sentido comercial."
- "No quiero una inmobiliaria generica."

## Diferencia Frente A Inmobiliarias Comunes

La firma no se presenta como inventario primero. Se presenta como metodo:

1. Diagnostico.
2. Opinion de valor.
3. Revision documental.
4. Estrategia de salida.
5. Comercializacion dirigida.
6. Negociacion.
7. Cierre.

## Sitemap MVP

- `/` - Home de captacion y posicionamiento.
- `/residencial` - Vertical de servicio residencial.
- `/comercial` - Vertical de servicio comercial.
- `/industrial` - Vertical de servicio industrial.
- `/vender-inmueble` - Captacion de propietarios.
- `/comprar-inmueble` - Ruta para compradores e inversionistas.
- `/due-diligence-inmobiliaria` - Revision documental y criterio previo.
- `/inventario` - Propiedades destacadas / inventario, sin dominar la marca.
- `/nosotros` - Confianza institucional y metodo.
- `/contacto` - Diagnostico, WhatsApp, telefono, correo.
- `/privacidad` - Aviso de privacidad.

## Home - Narrativa De Secciones

1. Hero estrategico: propuesta, zonas, CTAs, imagen inmobiliaria oscura.
2. Areas de especialidad: residencial, comercial, industrial.
3. Metodo de trabajo: diagnostico a cierre en linea de tiempo.
4. Confianza y capacidades: documentacion, analisis, filtro, negociacion.
5. Propiedades destacadas: pocas, como prueba de criterio, no portal.
6. Seccion editorial: antes de vender, que se revisa antes de publicar.
7. CTA final: opinion de valor / revision inicial.

## Sistema Visual

Direccion aprobada para Inicio: lenguaje tipo NEXO360.

- Fondo oscuro cinematografico.
- Imagen full-bleed de propiedad.
- Tipografia condensada en titulares.
- UI geometrica con lineas finas.
- Verde brillante como acento de accion.
- Motion suave de entrada, scroll y hover.
- Marquee inferior para zonas de operacion.
- Sin buscador en el Home.

## Requisitos Funcionales

- El Home debe mostrar CTAs hacia diagnostico/opinion de valor.
- El formulario de diagnostico debe capturar nombre, telefono, objetivo y mensaje/zona.
- La navegacion debe incluir las rutas estrategicas del MVP.
- Las areas de especialidad deben funcionar como rutas de servicio.
- El inventario puede existir, pero no debe ser el componente protagonista del Home.
- Las propiedades destacadas deben ser datos locales mock, faciles de reemplazar.

## Requisitos No Funcionales

- Next.js App Router con TypeScript.
- Tailwind CSS.
- shadcn/ui para primitivos base.
- Magic UI real como componentes copiados al proyecto.
- Motion.dev para animaciones.
- SEO tecnico basico por pagina.
- Responsive mobile-first.
- Accesibilidad basica: estructura semantica, labels, focus visible, alt text.
- No testimonios, cifras ni credenciales no verificadas.

## Fuera De Alcance Inicial

- Admin real.
- Supabase.
- CRM.
- Login.
- Pagos.
- Blog completo.
- Inventario dinamico conectado a base de datos.
- Testimonios o metricas inventadas.

## Criterios De Aceptacion

- El proyecto ejecuta en Next.js.
- `/` carga una landing de captacion sin buscador.
- El Home se percibe oscuro, sobrio, premium y metodico.
- La navegacion y sitemap reflejan posicionamiento, no plantilla generica.
- Existen componentes reutilizables para layout, secciones, propiedad y UI.
- Magic UI y Motion.dev aparecen en componentes reales del proyecto.
- La pagina es responsive y no presenta overflow horizontal en mobile.
- Metadata y estructura semantica estan definidas.

## Riesgos Y Decisiones Abiertas

- Falta nombre comercial definitivo; se usa NEXO360 como placeholder visual.
- Falta inventario real; se usan propiedades destacadas mock.
- Falta telefono, WhatsApp y correo oficiales; se usan placeholders.
- Falta confirmar credenciales verificables; no se mencionan.

---

## Addendum (6-jul-2026) - Pivote "Cota"

El diagnostico estrategico sigue vigente (metodo antes que inventario, captar propietarios). Cambios sobre esta spec:

- El Home ya no es multi-audiencia: es una sola narrativa para el propietario que vende. El posicionamiento visible paso de "Vender, comprar o invertir con metodo" a **"Vende con plan, no con anuncios"** con la idea rectora "No prometemos resultados. Documentamos el proceso."
- Marca provisional **Cota** (reemplaza la referencia NEXO360). Doble tema claro/oscuro.
- La accion principal se mantiene: solicitar evaluacion/opinion de valor (formulario `#evaluar`).
- Fuentes de verdad actualizadas: `Copywritting.md` (copy) y `DesignDirection.md` (visual).
