# Informe ejecutivo — Fortius

Fortius ya tiene una base operativa más amplia que una web: sitio público, panel administrativo, datos comerciales, expedientes y generación documental. Se mantienen en una aplicación Next.js conectada a Supabase para identidad, base de datos y archivos. Esta concentración es razonable para su etapa actual.

Lo mejor resuelto es la protección por roles/RLS, el control de versiones y la custodia técnica de documentos emitidos mediante snapshots y hashes. No hay evidencia que justifique sustituir todo el sistema o dividirlo en microservicios.

Las prioridades reales son recuperar el sistema con certeza, corregir las direcciones antiguas de autenticación y hacer que las comprobaciones obligatorias de calidad detengan una publicación fallida. Se observó un commit desplegado aunque CI falló; no equivale a demostrar que la interfaz publicada esté rota. La exportación enumera 16 de 18 tablas y el ensayo de restauración está desactualizado. No se verificó una recuperación integral.

Después conviene corregir la proyección pública de informacionPublica, paginar consultas, mejorar seguimiento de errores y acordar MFA. También hay dos proyectos Vercel que publican el mismo commit; debe revisarse su uso antes de retirar el antiguo.

La arquitectura futura recomendada conserva tecnologías y separa responsabilidades dentro del código. Nuevos CRM, portales, arrendamientos o IA se valorarían por necesidad concreta. La integración con inmobiliaria-os no está demostrada en producción.

La auditoría pudo comprobar código, metadatos de Supabase, GitHub y respuestas públicas. No pudo verificar configuración administrativa vigente, costos ni logs de Vercel. No se consultaron datos personales ni se hicieron pruebas destructivas. Las propuestas no están implementadas.
