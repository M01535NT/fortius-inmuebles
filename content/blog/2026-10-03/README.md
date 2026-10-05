# Cinco guías para propietarios

Encargo: redactar y publicar cinco entradas nuevas en el Blog de Mint. Se conservan las publicaciones existentes. La exclusiva se presenta como guía destacada; no se cambia el estado de los destacados anteriores.

Los cuerpos Markdown y sus metadatos están en esta carpeta. Las portadas utilizan ilustraciones generadas de la biblioteca editorial existente, seleccionadas por tema en `src/data/blog-covers.ts`. Se mantienen sus textos alternativos descriptivos y se elimina el aviso genérico bajo las ilustraciones, conforme al criterio de limpieza visual del usuario. Los créditos de fotografías licenciadas se conservan.

## Revisión editorial y jurídica

Fecha de corte: 3 de octubre de 2026. Textos revisados con humanizer: español de México, instrucciones concretas y sin avisos genéricos de relleno. Los importes de remodelación, ofertas e hipoteca son ejemplos de cálculo, no datos de mercado ni promesas de rendimiento.

Se consultó el [catálogo vigente del Congreso de Baja California](https://www.congresobc.gob.mx/TrabajoLegislativo/Leyes), incluyendo su selección de códigos vigentes. Se abrieron y comprobaron:

- [Código Civil, última reforma publicada el 5 de junio de 2026](https://www.congresobc.gob.mx/Documentos/ProcesoParlamentario/Leyes/TOMO_III/20260605_CODCIVIL.PDF): artículo 1926, consentimiento del acreedor para sustituir al deudor; artículo 2761, permanencia del gravamen aunque cambie el poseedor; artículo 2808, extinción; artículos 2428 y 2429, alcance y formalidades de poderes.
- [Ley del Registro Público, versión vigente con reforma del 30 de diciembre de 2016](https://www.congresobc.gob.mx/Documentos/ProcesoParlamentario/Leyes/TOMO_IV/LEYREGPUB_30DIC2016.PDF): artículos 61 a 64, cancelaciones registrales. La versión inicial sin fecha en el nombre del archivo tiene texto anterior del artículo 61; no se utilizó para publicar.
- [RETYS: certificado de inscripción con o sin gravámenes](https://retys.bajacalifornia.gob.mx/Portal/TyS/539): identificación del trámite registral.

Controles sustantivos: no se presenta un traspaso privado como liberación del deudor, no se confunde pago con cancelación registral, no se atribuye poder para vender al contrato de exclusiva y no se promete seguridad absoluta. La coordinación con otros asesores, acceso, documentos y publicidad se explica como parte del trabajo que debe acordarse. No se inventan estadísticas, plazos de trámite ni resultados comerciales.

## Publicación

`node tools/fortius-inmuebles-publish-guides-20261003.mjs` valida el lote localmente. `--check-remote` comprueba colisiones, lecturas y validación del servidor sin insertar. `--publish` realiza una sola inserción del lote, verifica la lectura anónima y conserva evidencia antes y después en `.superpowers/guides-20261003/`, excluida de Git.

Se usan las variables de Supabase del entorno. El script verifica el proyecto de destino; no guarda credenciales. Al repetirlo, los registros idénticos ya publicados no se insertan otra vez y cualquier contenido diferente detiene la operación.
