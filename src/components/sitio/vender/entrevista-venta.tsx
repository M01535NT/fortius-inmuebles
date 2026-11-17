"use client";

import * as React from "react";

import { usePublicFeatures } from "@/components/providers/public-features-provider";
import { enfocarAlMontar, mensajeDeEnvio, PublicLeadForm, revisarTelefono } from "@/components/forms/public-lead-form";
import { CampoLista, CampoTexto } from "@/components/sitio/campo";
import { Boton } from "@/components/sitio/boton";
import { captureLead } from "@/lib/admin/store";

const TIPOS = ["Casa", "Departamento", "Local u oficina", "Nave industrial", "Terreno"].map((t) => ({ valor: t, etiqueta: t }));

/*
  Vender (17/11/2026, boceto aprobado): el único formulario de la página, en dos pasos.
  Paso 1: tipo (lista) y zona. Paso 2: nombre y teléfono con lo anterior ya anotado; termina en
  «Agendar entrevista». Llega al panel como contacto. Sin recepción activa, el paso 2 ofrece
  WhatsApp y teléfono. «Volver» no borra lo escrito.
*/
export function EntrevistaVenta({ whatsapp, telefono }: { whatsapp?: string; telefono?: string }) {
  const { publicLeadsEnabled } = usePublicFeatures();
  const [paso, setPaso] = React.useState<1 | 2>(1);
  const [tipo, setTipo] = React.useState(TIPOS[0].valor);
  const [zona, setZona] = React.useState("");
  const [nombre, setNombre] = React.useState("");
  const [tel, setTel] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [listo, setListo] = React.useState(false);
  const titulo = React.useRef<HTMLHeadingElement>(null);
  const movido = React.useRef(false);

  React.useEffect(() => {
    if (movido.current) titulo.current?.focus();
  }, [paso]);

  const ir = (n: 1 | 2) => { movido.current = true; setPaso(n); };

  async function alEnviar(event: React.FormEvent<HTMLFormElement>) {
    const datos = new FormData(event.currentTarget);
    const telefonoMal = revisarTelefono(event.currentTarget, "telefono");
    if (telefonoMal) { setError(telefonoMal); return; }
    setEnviando(true);
    setError(null);
    try {
      await captureLead({
        website: String(datos.get("website") ?? ""),
        nombre: nombre.trim(),
        telefono: tel.trim(),
        origen: "contacto",
        mensaje: ["Vender", tipo, zona.trim()].filter(Boolean).join(" · "),
      });
      setListo(true);
    } catch (fallo) {
      setError(mensajeDeEnvio(fallo, "No pudimos enviar tus datos. Inténtalo otra vez o escríbenos por WhatsApp."));
    } finally {
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <div id="entrevista" className="ve-caja">
        <div role="status" tabIndex={-1} ref={enfocarAlMontar} className="ve-listo">
          <h2 className="ve-caja-titulo">Recibimos tus datos.</h2>
          <p>Te llamamos para agendar la entrevista. No publicamos nada sin hablar antes contigo.</p>
        </div>
      </div>
    );
  }

  return (
    <div id="entrevista" className="ve-caja">
      <p className="ve-caja-meta">
        <span>Paso {paso} de 2</span>
        {paso === 2
          ? <button type="button" className="ve-volver" onClick={() => ir(1)}>← Volver</button>
          : <span>2 minutos</span>}
      </p>

      {paso === 1 ? (
        <form className="ve-paso" aria-labelledby="ve-paso-titulo" onSubmit={(e) => { e.preventDefault(); ir(2); }}>
          <h2 id="ve-paso-titulo" ref={titulo} tabIndex={-1} className="ve-caja-titulo">¿Qué quieres vender?</h2>
          <CampoLista etiqueta="Tipo de propiedad" opciones={TIPOS} value={tipo} onChange={(e) => setTipo(e.target.value)} />
          <CampoTexto etiqueta="Zona o colonia" value={zona} onChange={(e) => setZona(e.target.value)} placeholder="Ej. Playas de Tijuana" autoComplete="off" />
          <Boton type="submit" tamano="grande" flecha className="ve-boton">Continuar</Boton>
        </form>
      ) : (
        <div className="ve-paso">
          <h2 id="ve-paso-titulo" ref={titulo} tabIndex={-1} className="ve-caja-titulo">¿Cómo te contactamos?</h2>
          <p className="ve-anotado">{[tipo, zona.trim()].filter(Boolean).join(" en ")} · lo anotamos para la entrevista.</p>
          {publicLeadsEnabled ? (
            <PublicLeadForm onSubmit={alEnviar} aria-labelledby="ve-paso-titulo" className="ve-formulario">
              <div className="ve-paso">
                <CampoTexto etiqueta="Nombre" name="nombre" required autoComplete="name" placeholder="Tu nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                <CampoTexto etiqueta="Teléfono o WhatsApp" name="telefono" type="tel" inputMode="tel" required autoComplete="tel" placeholder="664 000 0000" value={tel} onChange={(e) => setTel(e.target.value)} />
                {error && <p role="alert" className="ve-error">{error}</p>}
                <Boton type="submit" tamano="grande" disabled={enviando} className="ve-boton">{enviando ? "Enviando…" : "Agendar entrevista"}</Boton>
              </div>
            </PublicLeadForm>
          ) : (
            <div className="ve-paso">
              <p className="ve-anotado">Agenda la entrevista por WhatsApp o por teléfono.</p>
              {whatsapp && <Boton href={whatsapp} tamano="grande" target="_blank" rel="noopener noreferrer" className="ve-boton">Escribir por WhatsApp</Boton>}
              {telefono && <Boton href={telefono} variante="contorno" tamano="grande" className="ve-boton">Llamar</Boton>}
              {!whatsapp && !telefono && <p className="ve-anotado">El contacto directo estará disponible próximamente.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
