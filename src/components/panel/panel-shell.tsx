"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { aplicarOrden, leerOrdenGuardado } from "@/lib/panel/ordenar";
import { BARRA_TELEFONO, CONFIGURACION, CONSULTA, seccionPorRuta, seccionesPara, type Seccion } from "@/lib/panel/secciones";
import { errorMessage, isLoggedIn, login, logout, needsMfaCode, useSession, verifyMfaCode } from "@/lib/panel/legado/sesion";

import { usePreferencia } from "./almacen";
import { Favoritos, Recientes } from "./asunto/recientes";
import { ProveedorCatalogos } from "./datos/catalogos";
import { Gesto, Icono, Logo } from "./icons";
import { useAtajo, useTecladoEnListas } from "./kit/atajos";
import { AvisosProvider, useAvisos } from "./kit/avisos";
import { ProveedorBarra } from "./kit/barra";
import { BuscarOCrear } from "./kit/paleta";
import { ProveedorRecordatorios, useRecordatorios } from "./kit/recordatorios";
import { ListaReordenable } from "./kit/reordenable";
import { TooltipProvider } from "./ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const CLAVE_ORDEN = "fortius-panel-menu";
const CLAVE_MINI = "fortius-nav";
const CLAVE_TEMA = "fortius-theme";

function Acceso() {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [codigo, setCodigo] = useState("");
  const [pasoCodigo, setPasoCodigo] = useState(needsMfaCode());
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      if (pasoCodigo) await verifyMfaCode(codigo);
      else { await login(correo, clave); if (needsMfaCode()) setPasoCodigo(true); }
    } catch (err) { setError(errorMessage(err)); } finally { setEnviando(false); }
  }
  return (
    <main className="pn-acceso">
      <form className="pn-tarjeta" onSubmit={enviar}>
        <Logo alto={24} />
        <h1 className="pn-h1">{pasoCodigo ? "Código de verificación" : "Entra al panel"}</h1>
        {pasoCodigo ? (
          <label className="pn-campo">Código de 6 dígitos
            <input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={codigo} onChange={(e) => setCodigo(e.target.value)} autoFocus required />
          </label>
        ) : (
          <>
            <label className="pn-campo">Correo
              <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} autoComplete="username" required />
            </label>
            <label className="pn-campo">Contraseña
              <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="current-password" required />
            </label>
          </>
        )}
        {error ? <p className="pn-error" role="alert">{error}</p> : null}
        <button type="submit" className="pn-btn pn-btn-primario" aria-disabled={enviando}>{pasoCodigo ? "Verificar" : "Entrar"}</button>
      </form>
    </main>
  );
}

const activaEn = (ruta: string) => (s: Seccion) => (s.ruta === "/panel" ? ruta === "/panel" : ruta === s.ruta || ruta.startsWith(s.ruta + "/"));

/** Las secciones del menú lateral (boceto), en el orden que el asesor eligió arrastrando. */
function Menu({ contraido, secciones }: { contraido: boolean; secciones: Seccion[] }) {
  const ruta = usePathname();
  const [guardado, guardarOrden] = usePreferencia(CLAVE_ORDEN, "[]");
  const items = useMemo(() => aplicarOrden(secciones, leerOrdenGuardado(guardado), (s) => s.slug), [guardado, secciones]);
  const activa = activaEn(ruta);
  const { cuenta } = useRecordatorios();
  return (
    <ListaReordenable
      items={items}
      clave={(s) => s.slug}
      nombre={(s) => s.nombre}
      etiqueta="Secciones"
      alReordenar={(nuevo) => guardarOrden(JSON.stringify(nuevo.map((s) => s.slug)))}
      renderItem={(s, { asa }) => (
        <div className="pn-item-fila">
          <Link href={s.ruta} className="pn-link" aria-current={activa(s) ? "page" : undefined} title={contraido ? s.nombre : undefined}
            aria-label={s.slug === "inicio" && cuenta ? `${s.nombre}: ${cuenta} por atender` : contraido ? s.nombre : undefined}>
            <Icono nombre={s.icono} tamano={18} />
            <span className="pn-txt">{s.nombre}</span>
            {s.slug === "inicio" && cuenta ? <span className="pn-cuenta-menu" aria-hidden>{cuenta > 99 ? "99+" : cuenta}</span> : null}
          </Link>
          <span className="pn-asa-menu">{asa}</span>
        </div>
      )}
    />
  );
}

const TEMAS = [["auto", "Como el dispositivo"], ["light", "Claro"], ["dark", "Oscuro"]] as const;

/** Las opciones de tu cuenta: apariencia, configuración y salir. Las usan el pie del menú y «Más» del teléfono. */
function OpcionesCuenta() {
  const router = useRouter();
  const { avisar } = useAvisos();
  const [tema, guardarTema] = usePreferencia(CLAVE_TEMA, "auto");
  const salir = () => {
    logout().catch(() => avisar("No se pudo cerrar la sesión. Vuelve a intentarlo."));
  };
  return (
    <>
      <DropdownMenuLabel>Apariencia</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={tema} onValueChange={(v) => guardarTema(v === "auto" ? null : v)}>
        {TEMAS.map(([v, t]) => <DropdownMenuRadioItem key={v} value={v}>{t}</DropdownMenuRadioItem>)}
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={() => router.push(CONFIGURACION.ruta)}><Icono nombre="llave" tamano={16} />Configuración</DropdownMenuItem>
      <DropdownMenuItem peligro onSelect={salir}><Icono nombre="x" tamano={16} />Cerrar sesión</DropdownMenuItem>
    </>
  );
}

/** Al pie del menú (boceto): tu inicial, tu nombre y si eres director o asesor. */
function MenuCuenta({ iniciales, nombre, rol }: { iniciales: string; nombre: string; rol: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="pn-cuenta" aria-label={`Cuenta de ${nombre}`}>
        <span className="pn-av" aria-hidden>{iniciales}</span>
        <span className="pn-txt pn-cuenta-c">
          <span className="pn-cuenta-n">{nombre}</span>
          <small>{rol}</small>
        </span>
        <span className="pn-txt" aria-hidden><Icono nombre="down" tamano={14} /></span>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-60">
        <OpcionesCuenta />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** «Más» de la barra del teléfono (boceto): las secciones que no caben y tu cuenta, en un solo menú. */
function MenuMas({ secciones, activo }: { secciones: Seccion[]; activo: boolean }) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-current={activo ? "page" : undefined} aria-label="Más secciones">
        <Icono nombre="dots" tamano={21} />Más
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="w-64">
        {secciones.map((s) => (
          <DropdownMenuItem key={s.slug} onSelect={() => router.push(s.ruta)}><Icono nombre={s.icono} tamano={16} />{s.nombre}</DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <OpcionesCuenta />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Armazon({ children }: { children: ReactNode }) {
  const ruta = usePathname();
  const sesion = useSession();
  const [mini, guardarMini] = usePreferencia(CLAVE_MINI, "pinned");
  const esMini = mini === "mini";
  // Menú contraído: al pasar el ratón o al llegar con el teclado se abre encima del contenido, sin moverlo.
  const [encima, setEncima] = useState(false);
  const abierto = !esMini || encima;
  const [paleta, setPaleta] = useState<{ abierta: boolean; texto: string }>({ abierta: false, texto: "" });
  const abrirBuscar = useCallback((texto?: string) => setPaleta({ abierta: true, texto: texto ?? "" }), []);
  useAtajo("k", (e) => { e.preventDefault(); abrirBuscar(); }, { conControl: true });
  useTecladoEnListas();
  const esDirector = sesion?.role === "admin";
  const secciones = useMemo(() => seccionesPara(esDirector), [esDirector]);
  const iniciales = (sesion?.name ?? sesion?.email ?? "?").split(/[\s@.]+/).filter((p) => /^\p{L}/u.test(p)).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  const activa = activaEn(ruta);
  const enBarra = (slugs: readonly string[]) => slugs.map((slug) => secciones.find((s) => s.slug === slug)).filter((s): s is Seccion => Boolean(s));
  const antes = enBarra(BARRA_TELEFONO.antes);
  const despues = enBarra(BARRA_TELEFONO.despues);
  const fuera = secciones.filter((s) => !antes.includes(s) && !despues.includes(s));
  const enMas = fuera.some(activa) || ruta.startsWith(CONFIGURACION.ruta);
  const alternar = () => { guardarMini(esMini ? "pinned" : "mini"); setEncima(false); };
  const ligaBarra = (s: Seccion) => <LigaBarra key={s.slug} s={s} actual={activa(s)} />;

  return (
    <ProveedorBarra abrirBuscar={abrirBuscar}>
      <ProveedorRecordatorios>
      <div className="pn-app">
        <a href="#pn-contenido" className="pn-saltar">Saltar al contenido</a>
        <aside
          className="pn-side"
          data-mini={esMini}
          data-abierto={esMini && encima}
          aria-label="Menú"
          onMouseEnter={() => { if (esMini) setEncima(true); }}
          onMouseLeave={() => setEncima(false)}
          onFocus={() => { if (esMini) setEncima(true); }}
          onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setEncima(false); }}
        >
          <div className="pn-side-in">
            <div className="pn-side-top">
              <Link href="/panel" className="pn-lbl" aria-label="Inicio"><Logo alto={18} /></Link>
              <span className="pn-mark" aria-hidden><Logo alto={24} solo="o" /></span>
              {abierto ? (
                <button type="button" className="pn-navbtn pn-lbl" style={{ flex: "none" }} onClick={alternar}
                  aria-label={esMini ? "Fijar el menú" : "Contraer el menú"} title={esMini ? "Fijar el menú" : "Contraer el menú"}>
                  <Gesto nombre="panel" tamano={17} />
                </button>
              ) : null}
            </div>
            <button type="button" className="pn-busca" title="Buscar (Ctrl K)" aria-label="Buscar" aria-keyshortcuts="Control+K" onClick={() => abrirBuscar()}>
              <Icono nombre="bus" tamano={16} /><span>Buscar</span><kbd>Ctrl K</kbd>
            </button>
            <nav aria-label="Secciones" className="pn-nav">
              <Menu contraido={!abierto} secciones={secciones} />
            </nav>
            <Favoritos contraido={!abierto} />
            <Recientes contraido={!abierto} />
            <MenuCuenta iniciales={iniciales} nombre={sesion?.name ?? sesion?.email ?? "Equipo Fortius"} rol={esDirector ? "Director" : "Asesor"} />
          </div>
        </aside>
        <main className="pn-main" id="pn-contenido" tabIndex={-1}>{children}</main>
        <BuscarOCrear key={paleta.abierta ? `a-${paleta.texto}` : "c"} abierta={paleta.abierta} textoInicial={paleta.texto} alCerrar={() => setPaleta({ abierta: false, texto: "" })} />
        <nav className="pn-barra" aria-label="Secciones">
          {antes.map(ligaBarra)}
          <Link href={CONSULTA.ruta} className="pn-barra-mas" aria-label="Nueva consulta" aria-current={ruta.startsWith(CONSULTA.ruta) ? "page" : undefined}>
            <Icono nombre="mas" tamano={22} />
          </Link>
          {despues.map(ligaBarra)}
          <MenuMas secciones={fuera} activo={enMas} />
        </nav>
      </div>
      </ProveedorRecordatorios>
    </ProveedorBarra>
  );
}

/** Una sección de la barra del teléfono; «Inicio» lleva el número de lo que te toca. */
function LigaBarra({ s, actual }: { s: Seccion; actual: boolean }) {
  const { cuenta } = useRecordatorios();
  const n = s.slug === "inicio" ? cuenta : 0;
  return (
    <Link href={s.ruta} aria-current={actual ? "page" : undefined} aria-label={n ? `${s.nombre}: ${n} por atender` : undefined} className="pn-barra-liga">
      <Icono nombre={s.icono} tamano={21} />{s.nombre}
      {n ? <span className="pn-cuenta-menu" aria-hidden>{n > 99 ? "99+" : n}</span> : null}
    </Link>
  );
}

/** Cierra la sesión y muestra el acceso; mientras se comprueba la sesión no muestra nada. */
export function PanelShell({ children }: { children: ReactNode }) {
  const sesion = useSession();
  const [listo, setListo] = useState(false);
  const [tema] = usePreferencia(CLAVE_TEMA, "auto");

  useEffect(() => {
    let vivo = true;
    isLoggedIn({ boot: true }).catch(() => undefined).finally(() => { if (vivo) setListo(true); });
    return () => { vivo = false; };
  }, []);

  return (
    <div className="panel-root" data-panel-raiz="" data-theme={tema === "light" || tema === "dark" ? tema : undefined}>
      <AvisosProvider>
        <TooltipProvider>
          {!listo ? <div className="pn-acceso" aria-busy="true" /> : sesion ? <ProveedorCatalogos><Armazon>{children}</Armazon></ProveedorCatalogos> : <Acceso />}
        </TooltipProvider>
      </AvisosProvider>
    </div>
  );
}

export { seccionPorRuta };
