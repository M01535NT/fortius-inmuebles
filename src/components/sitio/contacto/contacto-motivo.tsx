"use client";

import * as React from "react";

import { usePublicFeatures } from "@/components/providers/public-features-provider";
import { enfocarAlMontar, mensajeDeEnvio, PublicLeadForm, revisarTelefono } from "@/components/forms/public-lead-form";
import { Boton } from "@/components/sitio/boton";
import { FilaLinea, ListaLineas } from "@/components/sitio/lineas";
import { SelectorFrase } from "@/components/sitio/selector-frase";
import { captureLead } from "@/lib/admin/store";
import { publicContact } from "@/lib/public-contact";

const MOTIVOS = {
  vender: { etiqueta: "vender", guia: "Empezamos con una entrevista: nos cuentas del inmueble y qué esperas.", detalle: "Qué vendes y dónde", ejemplo: "Casa en Playas de Tijuana", whatsapp: "Hola, quiero vender mi propiedad." },
  comprar: { etiqueta: "comprar", guia: "Cuéntanos qué buscas y con qué presupuesto. Revisamos papeles antes de ofertar.", detalle: "Qué buscas y dónde", ejemplo: "Departamento en Zona Río, hasta 4 millones", whatsapp: "Hola, quiero comprar una propiedad." },
  rentar: { etiqueta: "rentar", guia: "Publicamos tu inmueble o te buscamos uno, con contrato revisado.", detalle: "Qué rentas o buscas rentar", ejemplo: "Local comercial en Otay", whatsapp: "Hola, quiero rentar un inmueble." },
  inmueble: { etiqueta: "preguntar por un inmueble", guia: "Disponibilidad, visitas y dudas de un inmueble publicado.", detalle: "Nombre o folio del inmueble", ejemplo: "Residencia con vista al mar", whatsapp: "Hola, quiero información sobre un inmueble publicado por Fortius." },
  otro: { etiqueta: "contarles otro asunto", guia: "Papeles, una hipoteca por cancelar, una herencia: cuéntanos y te decimos cómo ayudarte.", detalle: "¿Qué necesitas?", ejemplo: "Quiero poner en orden la escritura", whatsapp: "Hola, quiero contarles mi asunto." },
} as const;

type Motivo = keyof typeof MOTIVOS;
const OPCIONES = (Object.keys(MOTIVOS) as Motivo[]).map((valor) => ({ valor, etiqueta: MOTIVOS[valor].etiqueta }));
const esMotivo = (valor: string): valor is Motivo => valor in MOTIVOS;

/*
  Contacto, Fortius II (17/11/2026, boceto aprobado). El título es el motivo, como la frase del
  inventario: «Hola, quiero [vender]». Al cambiarlo cambian la guía, el tercer campo y el mensaje
  de WhatsApp; nombre, teléfono y lo escrito no se borran. Llega al panel como contacto.
*/
export function ContactoMotivo() {
  const { settings, publicLeadsEnabled } = usePublicFeatures();
  const [motivo, setMotivo] = React.useState<Motivo>("vender");
  const [detalle, setDetalle] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [listo, setListo] = React.useState(false);
  const texto = MOTIVOS[motivo];
  const contact = publicContact(settings, texto.whatsapp);
  const hayCanal = Boolean(contact.whatsapp || contact.phoneHref || contact.emailHref);
  const horario = settings?.horario?.trim();

  async function alEnviar(event: React.FormEvent<HTMLFormElement>) {
    const datos = new FormData(event.currentTarget);
    const telefonoMal = revisarTelefono(event.currentTarget, "telefono");
    if (telefonoMal) { setError(telefonoMal); return; }
    setEnviando(true);
    setError(null);
    try {
      await captureLead({
        website: String(datos.get("website") ?? ""),
        nombre: String(datos.get("nombre") ?? ""),
        telefono: String(datos.get("telefono") ?? ""),
        origen: "contacto",
        mensaje: [`Quiere ${texto.etiqueta}`, detalle.trim()].filter(Boolean).join(" · "),
      });
      setListo(true);
    } catch (fallo) {
      setError(mensajeDeEnvio(fallo, "No pudimos enviar tu mensaje. Inténtalo otra vez o escríbenos por WhatsApp."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="ct2-cuerpo">
      <div className="ct2-principal">
        <h1 className="ct2-frase">
          <span>Hola, quiero</span>
          <SelectorFrase etiqueta="Motivo" opciones={OPCIONES} valor={motivo} onCambio={(v) => { if (esMotivo(v)) setMotivo(v); }} />
        </h1>
        <p className="ct2-guia" aria-live="polite">{texto.guia}</p>

        {listo ? (
          <div role="status" tabIndex={-1} ref={enfocarAlMontar} className="ct2-listo">
            <p className="ct2-listo-titulo">Recibimos tu mensaje.</p>
            <p>Te escribimos o te llamamos en horario de oficina. Si es urgente, escríbenos por WhatsApp.</p>
            <button type="button" className="ct2-otro" onClick={() => { setListo(false); setDetalle(""); }}>Enviar otro mensaje</button>
          </div>
        ) : (
          <PublicLeadForm onSubmit={alEnviar} aria-label="Escríbenos" className="ct2-formulario">
            <div className="ct2-campos">
              <label className="ct2-campo">
                <span>Nombre</span>
                <input name="nombre" required autoComplete="name" placeholder="Tu nombre" />
              </label>
              <label className="ct2-campo">
                <span>Teléfono o WhatsApp</span>
                <input name="telefono" type="tel" inputMode="tel" required autoComplete="tel" placeholder="664 000 0000" />
              </label>
              <label className="ct2-campo ct2-campo-ancho">
                <span>{texto.detalle}</span>
                <input name="detalle" value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder={texto.ejemplo} autoComplete="off" />
              </label>
            </div>
            {error && <p role="alert" className="ct2-error">{error}</p>}
            {publicLeadsEnabled && (
              <div className="ct2-enviar">
                <Boton type="submit" tamano="grande" disabled={enviando}>{enviando ? "Enviando…" : "Enviar"}</Boton>
                <span className="s-apoyo">Te respondemos en horario de oficina.</span>
              </div>
            )}
          </PublicLeadForm>
        )}
      </div>

      <aside className="ct2-directo" aria-labelledby="ct2-directo">
        <h2 id="ct2-directo" className="ct2-directo-titulo">O directo</h2>
        {hayCanal ? (
          <ListaLineas grande fuerte>
            {contact.whatsapp && <FilaLinea href={contact.whatsapp} titulo="WhatsApp" detalle="El mensaje ya va escrito según tu motivo." />}
            {contact.phoneHref && <FilaLinea href={contact.phoneHref} titulo="Llamar" detalle={contact.phone} />}
            {contact.emailHref && <FilaLinea href={contact.emailHref} titulo="Correo" detalle={contact.email} />}
          </ListaLineas>
        ) : (
          <p className="s-apoyo">El contacto directo estará disponible próximamente.</p>
        )}
        <p className="ct2-horario">{horario ? `Horario: ${horario} · ` : ""}Tijuana, Rosarito, Tecate y Ensenada</p>
      </aside>
    </div>
  );
}
