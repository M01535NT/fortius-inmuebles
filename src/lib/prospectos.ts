/*
  Puente con el back-office (inmobiliaria-os).

  Hasta ahora, los cinco formularios de este sitio escribían el lead en el
  `localStorage` del visitante y nada más: cada persona que dejaba su teléfono
  se perdía. La propia especificación lo advertía ("no lanzar campañas de pago
  hasta que los leads se persistan").

  El contrato es deliberadamente estrecho: este sitio SOLO puede llamar a
  `capturar_lead`. No puede leer prospectos —ni los suyos—, ni tocar ninguna
  otra tabla. La base lo impone: `anon` no tiene privilegios sobre `web_leads`,
  y la función es SECURITY DEFINER.

  La URL y la clave publicable son PÚBLICAS por diseño (viajan al navegador en
  cualquier despliegue); la seguridad real la imponen las políticas de la base.
  Las variables de entorno tienen prioridad.
*/
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://fvvmvnduvzxvodeombld.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_IntpkDu0B57y5t3z1LG09w_vKJBIUyB";

/* Los cinco puntos de captura del sitio + la captura manual del panel. */
export type OrigenProspecto =
  | "evaluar"
  | "contacto"
  | "interes_propiedad"
  | "checklist"
  | "documentos"
  | "manual";

export type ProspectoInput = {
  nombre: string;
  telefono: string;
  origen: OrigenProspecto;
  email?: string;
  propiedadSlug?: string;
  zona?: string;
  tipoPropiedad?: string;
  mensaje?: string;
};

/* Cliente sin sesión: el visitante es anónimo y así se queda. */
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Envía el prospecto al buzón del back-office. Devuelve su código (PRO-AAAA-NNNN).
 *
 * Lanza si no se pudo entregar: el formulario NO debe dar las gracias por un
 * lead que se perdió. Es justo el error que estamos corrigiendo.
 */
export async function enviarProspecto(input: ProspectoInput): Promise<string> {
  const { data, error } = await supabase.rpc("capturar_lead", {
    p_nombre: input.nombre,
    p_telefono: input.telefono,
    p_origen: input.origen,
    p_email: input.email ?? null,
    p_propiedad_slug: input.propiedadSlug ?? null,
    p_zona: input.zona ?? null,
    p_tipo_propiedad: input.tipoPropiedad ?? null,
    p_mensaje: input.mensaje ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
  return data as string;
}
