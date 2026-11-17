/**
 * Puente hacia la carga de archivos del panel viejo: ticket firmado, archivo en staging y paso a su lugar
 * en el servidor (sin EXIF ni GPS si es público). Se reutiliza tal cual para no duplicar una ruta de seguridad.
 * Cuando el panel viejo se retire (PN-11), esta función se muda aquí sin cambiar a quien la usa.
 */
export { archivoFromUpload, resolveFileUrl, uploadFile, type UploadedFile } from "@/lib/admin/store";
