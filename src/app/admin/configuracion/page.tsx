"use client";

import { brandCopy } from "@/lib/brand-copy";
import * as React from "react";

import {
  AsyncForm,
  DemoBanner,
  Field,
  PageHeader,
  btnPrimary,
  inputClass,
} from "@/components/admin/ui";
import {
  settingsStore,
  useSingleton,
  type SiteSettings,
} from "@/lib/admin/store";

/*
  Datos generales del negocio: identidad, contacto, redes y multimedia
  institucional, persistidos en el singleton de configuración.
*/
export default function ConfiguracionPage() {
  const value = useSingleton(settingsStore);
  return value ? (
    <Editor initial={value} />
  ) : (
    <PageHeader title="Configuración." />
  );
}
function Editor({ initial }: { initial: SiteSettings }) {
  const [settings] = React.useState(initial);
  const [version, setVersion] = React.useState(() =>
    settingsStore.version("singleton"),
  );
  const [guardado, setGuardado] = React.useState(false);

  if (!settings) return <PageHeader title="Configuración." />;

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next = Object.fromEntries(
      Object.keys(settings as SiteSettings).map((k) => [
        k,
        String(data.get(k) ?? ""),
      ]),
    ) as SiteSettings;
    const saved = await settingsStore.save(next, version);
    setVersion(settingsStore.version(saved));
    setGuardado(true);
    window.setTimeout(() => setGuardado(false), 2500);
  }

  return (
    <div className="max-w-[760px] space-y-6">
      <PageHeader
        title="Configuración."
        description="Identidad, contacto y datos operativos del negocio."
      />
      <DemoBanner />

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
            hint="Al llenarlo, el espacio reservado de /nosotros se convierte en reproductor (con backend)."
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

        <div className="flex items-center gap-4">
          <button type="submit" className={btnPrimary}>
            Guardar configuración
          </button>
          {guardado ? (
            <p
              aria-live="polite"
              className="text-sm font-medium text-primary"
            >
              Guardado.
            </p>
          ) : null}
        </div>
      </AsyncForm>
    </div>
  );
}
