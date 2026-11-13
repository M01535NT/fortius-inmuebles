"use client";
import { Field, inputClass } from "@/components/admin/ui";
import { DATOS_FORTIUS_CAMPOS, datosFortiusSchema, faltantesFortius, type ClaveDatoFortius, type DatosFortius } from "@/lib/backend/datos-fortius";

/*
  Configuración · Datos de Fortius (FCH-03): la empresa que firma los contratos y es responsable
  de los datos. Se capturan una vez y los documentos los toman de aquí. Van dentro del formulario
  de Configuración y se guardan con él; solo el director los cambia.
*/
const PREFIJO = "empresa.";

export function DatosFortiusSection({ datos }: { datos: DatosFortius }) {
  const faltan = faltantesFortius(datos);
  return <section className="space-y-4 rounded-lg border border-border bg-card p-5" aria-labelledby="cf-empresa">
    <div className="space-y-1">
      <h2 id="cf-empresa" className="display-soft text-lg text-foreground">Datos de Fortius</h2>
      <p className="text-sm text-muted-foreground">Los contratos y avisos los toman de aquí. Lo que dejes vacío sale como línea en blanco para llenarlo a mano.</p>
      {faltan.length > 0 && <p className="text-sm text-muted-foreground">Por capturar: {faltan.join(", ")}.</p>}
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      {DATOS_FORTIUS_CAMPOS.map(campo => {
        const id = `cf-empresa-${campo.clave}`;
        const largo = "largo" in campo && campo.largo;
        const ayuda = "ayuda" in campo ? campo.ayuda : undefined;
        return <div key={campo.clave} className={largo ? "sm:col-span-2" : undefined}>
          <Field label={campo.etiqueta} htmlFor={id} hint={ayuda}>
            {largo
              ? <textarea id={id} name={PREFIJO + campo.clave} defaultValue={datos[campo.clave]} maxLength={campo.max} rows={3} className={inputClass} />
              : <input id={id} name={PREFIJO + campo.clave} defaultValue={datos[campo.clave]}
                type={"tipo" in campo ? "date" : campo.clave === "correo" ? "email" : campo.clave === "telefono" ? "tel" : "text"}
                maxLength={"max" in campo ? campo.max : undefined}
                autoCapitalize={campo.clave === "rfc" ? "characters" : undefined}
                className={inputClass} />}
          </Field>
        </div>;
      })}
    </div>
  </section>;
}

/** Lee la sección del formulario. Devuelve `null` con el primer error para avisarlo antes de guardar. */
export function datosFortiusDelFormulario(data: FormData): { empresa: Partial<DatosFortius> } | { error: string } {
  const crudo = Object.fromEntries(DATOS_FORTIUS_CAMPOS.map(c => [c.clave, String(data.get(PREFIJO + c.clave) ?? "").trim()]));
  const parsed = datosFortiusSchema.safeParse(crudo);
  if (!parsed.success) {
    const clave = parsed.error.issues[0]?.path[0] as ClaveDatoFortius | undefined;
    const campo = DATOS_FORTIUS_CAMPOS.find(c => c.clave === clave);
    return { error: campo ? `Revisa «${campo.etiqueta}» en Datos de Fortius.` : "Revisa los datos de Fortius." };
  }
  // Solo se guardan los campos con valor.
  return { empresa: Object.fromEntries(Object.entries(parsed.data).filter(([, valor]) => valor)) as Partial<DatosFortius> };
}
