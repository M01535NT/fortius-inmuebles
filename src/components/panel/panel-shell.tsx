"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { aplicarOrden, leerOrdenGuardado } from "@/lib/panel/ordenar";
import { BARRA_TELEFONO, CONFIGURACION, SECCIONES, seccionPorRuta, type Seccion } from "@/lib/panel/secciones";
import type { Lead } from "@/lib/domain/records";
import { pestanaDe } from "@/lib/panel/datos/consultas";
import { errorMessage, isLoggedIn, login, logout, needsMfaCode, useSession, verifyMfaCode } from "@/lib/panel/legado/sesion";

import { usePreferencia } from "./almacen";
import { Gesto, Icono, Logo } from "./icons";
import { useAtajo, useTecladoEnListas } from "./kit/atajos";
import { useColeccion } from "./datos/use-coleccion";
import { AvisosProvider, useAvisos } from "./kit/avisos";
import { Contador } from "./kit/lista";
import { BuscarOCrear } from "./kit/paleta";
import { ListaReordenable } from "./kit/reordenable";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

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
        <h1 className="pn-h1" style={{ fontSize: 22 }}>{pasoCodigo ? "Código de verificación" : "Entra al panel"}</h1>
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

function Menu({ mini, porAtender }: { mini: boolean; porAtender: number }) {
  const ruta = usePathname();
  const [guardado, guardarOrden] = usePreferencia(CLAVE_ORDEN, "[]");
  const items = useMemo(() => aplicarOrden(SECCIONES, leerOrdenGuardado(guardado), (s) => s.slug), [guardado]);
  const activa = (s: Seccion) => (s.ruta === "/panel" ? ruta === "/panel" : ruta === s.ruta || ruta.startsWith(s.ruta + "/"));
  return (
    <ListaReordenable
      items={items}
      clave={(s) => s.slug}
      nombre={(s) => s.nombre}
      etiqueta="Secciones"
      alReordenar={(nuevo) => guardarOrden(JSON.stringify(nuevo.map((s) => s.slug)))}
      renderItem={(s, { asa }) => {
        const enlace = (
          <Link href={s.ruta} className="pn-link" aria-current={activa(s) ? "page" : undefined} aria-label={mini ? s.nombre : undefined}>
            <Icono nombre={s.icono} />
            <span className="pn-txt">{s.nombre}</span>
            {s.slug === "consultas" ? <Contador n={porAtender} etiqueta="consultas por atender" /> : null}
          </Link>
        );
        return (
          <div className="pn-item-fila">
            {/* Menú contraído: el nombre sale en un globo al pasar el ratón o al enfocar con el teclado (sugerencia 10). */}
            {mini ? (
              <Tooltip>
                <TooltipTrigger asChild>{enlace}</TooltipTrigger>
                <TooltipContent side="right">{s.slug === "consultas" && porAtender ? `${s.nombre} · ${porAtender} por atender` : s.nombre}</TooltipContent>
              </Tooltip>
            ) : enlace}
            {mini ? null : <span className="pn-asa-menu">{asa}</span>}
          </div>
        );
      }}
    />
  );
}

/** Menú de la cuenta (AUD-03, M10): Configuración y Cerrar sesión. Sale hacia arriba porque vive al pie del menú. */
function MenuCuenta({ iniciales, nombre, correo }: { iniciales: string; nombre: string; correo?: string }) {
  const router = useRouter();
  const { avisar } = useAvisos();
  const salir = () => {
    logout().catch(() => avisar("No se pudo cerrar la sesión en el servidor. Vuelve a intentarlo."));
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="pn-cuenta" aria-label={`Cuenta de ${nombre}`}>
        <span className="pn-av" aria-hidden>{iniciales}</span>
        <span className="pn-txt" style={{ minWidth: 0, display: "flex", flexDirection: "column", textAlign: "left" }}>
          <span style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nombre}</span>
          <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>Cuenta</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-60">
        <DropdownMenuLabel>{correo ?? nombre}</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => router.push(CONFIGURACION.ruta)}>Configuración</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem peligro onSelect={salir}>Cerrar sesión</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Cuántas consultas esperan respuesta, para el número del menú (AUD-03, G4). */
function usePorAtender(): number {
  const { datos } = useColeccion<Lead>("leads", { refrescarCada: 90_000 });
  return useMemo(() => datos.filter((l) => pestanaDe(l) === "por_atender").length, [datos]);
}

function Armazon({ children }: { children: ReactNode }) {
  const ruta = usePathname();
  const sesion = useSession();
  const [mini, guardarMini] = usePreferencia(CLAVE_MINI, "pinned");
  const esMini = mini === "mini";
  const [paleta, setPaleta] = useState(false);
  useAtajo("k", (e) => { e.preventDefault(); setPaleta(true); }, { conControl: true });
  useTecladoEnListas();
  const iniciales = (sesion?.name ?? sesion?.email ?? "?").split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  const barra = BARRA_TELEFONO.map((slug) => SECCIONES.find((s) => s.slug === slug)).filter((s): s is Seccion => Boolean(s));
  const activaBarra = (s: Seccion) => (s.ruta === "/panel" ? ruta === "/panel" : ruta === s.ruta || ruta.startsWith(s.ruta + "/"));
  const enMas = !barra.some(activaBarra) && ruta !== "/panel";
  const porAtender = usePorAtender();

  return (
    <div className="pn-app">
      <a href="#pn-contenido" className="pn-saltar">Saltar al contenido</a>
      {/* Teléfono (AUD-03, G3): sin menú lateral ni Ctrl K, el buscador vive arriba. */}
      <header className="pn-arriba">
        <Link href="/panel" aria-label="Hoy"><Logo alto={16} /></Link>
        <span style={{ flex: 1 }} />
        {porAtender ? (
          <Link href="/panel/consultas" className="pn-iconbtn pn-arriba-aviso" aria-label={`${porAtender} consultas por atender`}>
            <Icono nombre="llamada" tamano={20} /><Contador n={porAtender} etiqueta="consultas por atender" />
          </Link>
        ) : null}
        <button type="button" className="pn-iconbtn" aria-label="Buscar o crear" onClick={() => setPaleta(true)}><Icono nombre="buscar" tamano={20} /></button>
      </header>
      <aside className="pn-side" data-mini={esMini} aria-label="Menú">
        <div className="pn-side-top">
          <span className="pn-lbl"><Logo alto={18} /></span>
          <span className="pn-mark"><Logo alto={26} solo="o" /></span>
          {esMini ? null : (
            <button type="button" className="pn-iconbtn" style={{ width: 32, height: 32 }} onClick={() => guardarMini("mini")} aria-label="Contraer el menú" title="Contraer el menú">
              <Gesto nombre="panel" tamano={17} />
            </button>
          )}
        </div>
        {esMini ? (
          <button type="button" className="pn-iconbtn" style={{ alignSelf: "center" }} onClick={() => guardarMini("pinned")} aria-label="Fijar el menú" title="Fijar el menú"><Gesto nombre="panel" tamano={17} /></button>
        ) : null}
        <button type="button" className="pn-busca" title="Buscar o crear (Ctrl K)" aria-label="Buscar o crear" onClick={() => setPaleta(true)}>
          <Icono nombre="buscar" tamano={16} /><span>Buscar o crear</span><kbd>Ctrl K</kbd>
        </button>
        <Menu mini={esMini} porAtender={porAtender} />
        <MenuCuenta iniciales={iniciales} nombre={sesion?.name ?? "Equipo Fortius"} correo={sesion?.email} />
      </aside>
      <main className="pn-main" id="pn-contenido" tabIndex={-1}>{children}</main>
      <BuscarOCrear abierta={paleta} alCerrar={() => setPaleta(false)} />
      <nav className="pn-barra" aria-label="Principal">
        {barra.map((s) => (
          <Link key={s.slug} href={s.ruta} aria-current={activaBarra(s) ? "page" : undefined}><Icono nombre={s.icono} tamano={22} />{s.nombre}</Link>
        ))}
        <Link href="/panel/mas" aria-current={enMas || ruta === "/panel/mas" ? "page" : undefined}><Gesto nombre="puntos" tamano={22} />Más</Link>
      </nav>
    </div>
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
          {!listo ? <div className="pn-acceso" aria-busy="true" /> : sesion ? <Armazon>{children}</Armazon> : <Acceso />}
        </TooltipProvider>
      </AvisosProvider>
    </div>
  );
}

export { seccionPorRuta };
