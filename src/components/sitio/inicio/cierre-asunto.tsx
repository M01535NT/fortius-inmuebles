"use client";

import * as React from "react";

import { captureLead } from "@/lib/admin/store";
import { mensajeDeEnvio, PublicLeadForm, revisarTelefono } from "@/components/forms/public-lead-form";

/*
  Cierre del inicio (17/11/2026): «Cuéntanos tu asunto» con tres campos: qué necesitas, nombre y
  teléfono. El nombre lo pide el sistema; así no se toca la base de datos. Llega como contacto,
  con lo que escribió en el mensaje. Los asuntos de la portada pueden dejar la frase escrita.
*/
export function CierreAsunto({ whatsapp }: { whatsapp?: string }) {
  const [asunto, setAsunto] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [listo, setListo] = React.useState(false);
  const campo = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const alElegir = (event: Event) => {
      const frase = event instanceof CustomEvent && typeof event.detail === "string" ? event.detail : "";
      if (frase) setAsunto(frase);
      window.setTimeout(() => campo.current?.focus({ preventScroll: true }), 400);
    };
    window.addEventListener("fortius:asunto", alElegir);
    return () => window.removeEventListener("fortius:asunto", alElegir);
  }, []);

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
        mensaje: asunto.trim() || "Escribió desde el inicio sin detallar el asunto.",
      });
      setListo(true);
    } catch (fallo) {
      setError(mensajeDeEnvio(fallo, "No pudimos enviar tu mensaje. Inténtalo otra vez o escríbenos por WhatsApp."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section id="cuentanos" className="s-banda ca" aria-labelledby="ca-titulo">
      <div className="s-contenedor ca-cuerpo">
        <h2 id="ca-titulo" className="ca-titulo">Cuéntanos tu asunto.</h2>
        {listo ? (
          <p role="status" className="ca-listo">Recibimos tu mensaje. Te escribimos o llamamos en horario de oficina.</p>
        ) : (
          <PublicLeadForm onSubmit={alEnviar} className="ca-formulario" aria-labelledby="ca-titulo">
            <div className="ca-campos">
              <label className="ca-campo ca-campo-ancho">
                <span>¿Qué necesitas?</span>
                <input ref={campo} name="asunto" value={asunto} onChange={(e) => setAsunto(e.target.value)} placeholder="Quiero vender una casa en Playas de Tijuana" autoComplete="off" />
              </label>
              <label className="ca-campo">
                <span>Nombre</span>
                <input name="nombre" required autoComplete="name" placeholder="Tu nombre" />
              </label>
              <label className="ca-campo">
                <span>Teléfono o WhatsApp</span>
                <input name="telefono" type="tel" required autoComplete="tel" inputMode="tel" placeholder="664 000 0000" />
              </label>
              <button type="submit" className="s-btn s-btn-relleno s-btn-grande ca-enviar" disabled={enviando}>{enviando ? "Enviando…" : "Enviar"}</button>
            </div>
            {error && <p role="alert" className="ca-error">{error}</p>}
          </PublicLeadForm>
        )}
        {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="s-enlace ca-whatsapp">Prefiero escribir por WhatsApp</a>}
      </div>
    </section>
  );
}
