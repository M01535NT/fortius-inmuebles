"use client";

import { brandCopy } from "@/lib/brand-copy";
import * as React from "react";

import {
  AsyncForm,
  Field,
  PageHeader,
  btnPrimary,
  inputClass,
} from "@/components/admin/ui";
import { firstResponseHours } from "@/lib/admin/today";
import {
  settingsStore,
  useSession,
  useSingleton,
  type SiteSettings,
} from "@/lib/admin/store";
import { MessageTemplatesEditor } from "@/components/admin/contacts/message-templates-editor";
import type { TemplateOverrides } from "@/lib/admin/message-templates";
import { IaUsoSection } from "@/components/admin/ia-uso";
import { topeIaValido } from "@/lib/backend/ia-tope";
import { DatosFortiusSection, datosFortiusDelFormulario } from "@/components/admin/datos-fortius-section";
import { datosFortius } from "@/lib/backend/datos-fortius";

/** IA-02: el tope de la lectura con IA vive en el mismo registro (solo del panel). */
type Settings = SiteSettings & { topeIaMensualUsd?: number; empresa?: Record<string, string> };

const TEXT_KEYS = ["nombreComercial", "telefono", "whatsapp", "email", "horario", "facebook", "instagram", "videoInstitucionalUrl"] as const;

/*
  Datos generales del negocio: identidad, contacto, redes y multimedia
  institucional, persistidos en el singleton de configuración.
*/
export default function ConfiguracionPage() {
  const value = useSingleton(settingsStore);
  return value ? (
    <Editor initial={value} />
  ) : (
    <PageHeader title="Configuración" />
  );
}
function Editor({ initial }: { initial: SiteSettings }) {
  const [settings] = React.useState(initial);
  const [version, setVersion] = React.useState(() =>
    settingsStore.version("singleton"),
  );
  const [guardado, setGuardado] = React.useState(false);
  // Los mensajes se guardan aparte, en el mismo registro: ambas partes comparten la versión.
  const [mensajes, setMensajes] = React.useState<TemplateOverrides>((initial.mensajes ?? {}) as TemplateOverrides);
  const session = useSession();

  if (!settings) return <PageHeader title="Configuración" />;

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const admin = session?.role === "admin";
    const empresa = admin ? datosFortiusDelFormulario(data) : null;
    if (empresa && "error" in empresa) throw new Error(empresa.error);
    // Quien no es director no ve la sección: se conservan los datos guardados.
    const kept = (settingsStore.get() as Settings | null)?.empresa;
    const nextEmpresa = empresa ? empresa.empresa : kept;
    const texts = Object.fromEntries(
      TEXT_KEYS.map((k) => [k, String(data.get(k) ?? "")]),
    ) as Pick<SiteSettings, (typeof TEXT_KEYS)[number]>;
    const next: SiteSettings = {
      ...texts,
      horasPrimeraAtencion: firstResponseHours({ horasPrimeraAtencion: Number(data.get("horasPrimeraAtencion")) }),
      ...tope(data),
      ...(nextEmpresa && Object.keys(nextEmpresa).length ? { empresa: nextEmpresa } : {}),
      ...(Object.keys(mensajes).length ? { mensajes } : {}),
    };
    const saved = await settingsStore.save(next, version);
    setVersion(settingsStore.version(saved));
    setGuardado(true);
    window.setTimeout(() => setGuardado(false), 2500);
  }

  // Vacío o inválido conserva el tope guardado; el director lo ve y lo cambia solo él.
  function tope(data: FormData): Pick<Settings, "topeIaMensualUsd"> {
    const raw = String(data.get("topeIaMensualUsd") ?? "").trim();
    const value = raw ? topeIaValido(Number(raw)) : undefined;
    const kept = value ?? (settingsStore.get() as Settings | null)?.topeIaMensualUsd;
    return kept === undefined ? {} : { topeIaMensualUsd: kept };
  }

  async function guardarMensajes(next: TemplateOverrides) {
    const current = settingsStore.get() ?? settings;
    const { mensajes: _old, ...rest } = current as SiteSettings;
    void _old;
    const saved = await settingsStore.save({ ...rest, ...(Object.keys(next).length ? { mensajes: next } : {}) }, version);
    setVersion(settingsStore.version(saved));
    setMensajes(next);
  }

  return (
    <div className="max-w-[760px] space-y-6">
      <PageHeader
        title="Configuración"
        description="Identidad, contacto y datos operativos del negocio."
      />

      <AsyncForm onSubmit={guardar} className="space-y-6">
        <section className="space-y-4 rounded-lg border border-border bg-card p-5">
          <h2 className="display-soft text-lg text-foreground">Identidad</h2>
          <Field label="Nombre comercial" htmlFor="cf-nombre">
            <input
              id="cf-nombre"
              name="nombreComercial"
              required
              defaultValue={brandCopy(settings.nombreComercial)}
              className={inputClass}
            />
          </Field>
        </section>

        <section className="space-y-4 rounded-lg border border-border bg-card p-5">
          <h2 className="display-soft text-lg text-foreground">Contacto</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Teléfono" htmlFor="cf-telefono">
              <input
                id="cf-telefono"
                name="telefono"
                defaultValue={settings.telefono}
                className={inputClass}
              />
            </Field>
            <Field label="WhatsApp (número internacional o enlace wa.me)" htmlFor="cf-whatsapp">
              <input
                id="cf-whatsapp"
                name="whatsapp"
                defaultValue={settings.whatsapp}
                className={inputClass}
              />
            </Field>
            <Field label="Correo" htmlFor="cf-email">
              <input
                id="cf-email"
                name="email"
                type="email"
                defaultValue={settings.email}
                className={inputClass}
              />
            </Field>
            <Field label="Horario de atención" htmlFor="cf-horario">
              <input
                id="cf-horario"
                name="horario"
                defaultValue={settings.horario}
                className={inputClass}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-border bg-card p-5">
          <h2 className="display-soft text-lg text-foreground">
            Redes y multimedia
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Facebook o Messenger (enlace de la página o m.me)" htmlFor="cf-facebook">
              <input
                id="cf-facebook"
                name="facebook"
                defaultValue={settings.facebook}
                className={inputClass}
              />
            </Field>
            <Field label="Instagram (URL)" htmlFor="cf-instagram">
              <input
                id="cf-instagram"
                name="instagram"
                defaultValue={settings.instagram}
                className={inputClass}
              />
            </Field>
          </div>
          <Field
            label="Video institucional (URL)"
            htmlFor="cf-video"
            hint="El video aparecerá en la página Nosotros."
          >
            <input
              id="cf-video"
              name="videoInstitucionalUrl"
              defaultValue={settings.videoInstitucionalUrl}
              placeholder="https://… .mp4"
              className={inputClass}
            />
          </Field>
        </section>

        <section className="space-y-4 rounded-lg border border-border bg-card p-5">
          <h2 className="display-soft text-lg text-foreground">Prospectos del sitio</h2>
          <Field
            label="Horas para la primera atención"
            htmlFor="cf-primera-atencion"
            hint="Un prospecto nuevo del sitio sale como atrasado en Hoy al pasar este plazo sin que nadie lo contacte. De 1 a 72 horas."
          >
            <input
              id="cf-primera-atencion"
              name="horasPrimeraAtencion"
              type="number"
              inputMode="numeric"
              min={1}
              max={72}
              step={1}
              required
              defaultValue={firstResponseHours(settings)}
              className={inputClass + " sm:max-w-[10rem]"}
            />
          </Field>
        </section>

        {session?.role === "admin" && <DatosFortiusSection datos={datosFortius(settings)} />}

        {session?.role === "admin" && <IaUsoSection guardado={(settings as Settings).topeIaMensualUsd} />}

        <div className="flex items-center gap-4">
          <button type="submit" className={btnPrimary}>
            Guardar configuración
          </button>
          {guardado ? (
            <p
              aria-live="polite"
              className="text-sm font-medium text-foreground underline underline-offset-4"
            >
              Guardado.
            </p>
          ) : null}
        </div>
      </AsyncForm>

      <MessageTemplatesEditor saved={mensajes} canEdit={session?.role === "admin"} adviserName={session?.name} onSave={guardarMensajes} />
    </div>
  );
}
