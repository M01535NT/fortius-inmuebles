"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { aplicarOrden, leerOrdenGuardado } from "@/lib/panel/ordenar";
import { BARRA_TELEFONO, CONFIGURACION, SECCIONES, seccionPorRuta, type Seccion } from "@/lib/panel/secciones";
import type { Lead } from "@/lib/domain/records";
import { pestanaDe } from "@/lib/panel/datos/consultas";
import { errorMessage, isLoggedIn, login, logout, needsMfaCode, useSession, verifyMfaCode } from "@/lib/panel/legado/sesion";

import { usePreferencia } from "./almacen";
import { Gesto, Icono, Logo } from "./icons";
import { useAtajo, useTecladoEnListas } from "./kit/atajos";
import { useCuentaBandeja } from "./bandeja/cuenta";
import { useColeccion } from "./datos/use-coleccion";
import { AvisosProvider, useAvisos } from "./kit/avisos";
import { ProveedorBarra, useBarraActual } from "./kit/barra";
import { BuscarOCrear } from "./kit/paleta";
import { ListaReordenable } from "./kit/reordenable";
import { TooltipProvider } from "./ui/tooltip";
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

const activaEn = (ruta: string) => (s: Seccion) => (s.ruta === "/panel" ? ruta === "/panel" : ruta === s.ruta || ruta.startsWith(s.ruta + "/"));

/** Las secciones del menú lateral, en el orden que el asesor eligió arrastrando (RP-102). */
function Menu({ contraido, numeros }: { contraido: boolean; numeros: Partial<Record<string, number>> }) {
  const ruta = usePathname();
  const [guardado, guardarOrden] = usePreferencia(CLAVE_ORDEN, "[]");
  const items = useMemo(() => aplicarOrden(SECCIONES, leerOrdenGuardado(guardado), (s) => s.slug), [guardado]);
  const activa = activaEn(ruta);
  return (
    <ListaReordenable
      items={items}
      clave={(s) => s.slug}
      nombre={(s) => s.nombre}
      etiqueta="Secciones"
      alReordenar={(nuevo) => guardarOrden(JSON.stringify(nuevo.map((s) => s.slug)))}
      renderItem={(s, { asa }) => {
        const n = numeros[s.slug] ?? 0;
        return (
          <div className="pn-item-fila">
            <Link href={s.ruta} className="pn-link" aria-current={activa(s) ? "page" : undefined} title={contraido ? s.nombre : undefined}
              aria-label={contraido ? (n ? `${s.nombre}, ${n}` : s.nombre) : undefined} data-con-numero={n ? "" : undefined}>
              <span className="pn-tile" data-sec={s.slug}><Icono nombre={s.icono} tamano={18} /></span>
              <span className="pn-txt">{s.nombre}</span>
              {n ? <span className="pn-nav-n" aria-label={`${n} por atender`}>{n}</span> : null}
            </Link>
            <span className="pn-asa-menu">{asa}</span>
          </div>
        );
      }}
    />
  );
}

/** Al pie del menú (boceto): tu inicial, tu nombre y «Configuración». Abre Configuración y Cerrar sesión. */
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
        <span className="pn-txt" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nombre}</span>
          <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>Configuración</span>
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

/** Cuántas consultas esperan respuesta, para el número del menú y de «Más» (AUD-03, G4). */
export function usePorAtender(): number {
  const { datos } = useColeccion<Lead>("leads", { refrescarCada: 90_000 });
  return useMemo(() => datos.filter((l) => pestanaDe(l) === "por_atender").length, [datos]);
}

/**
 * El nombre de la pantalla aparece al centro de la barra del teléfono cuando el título grande ya salió de la vista
 * (boceto «Inicio»: «Baja la pantalla: el título se encoge»). También dice si hay que poner la línea bajo la barra.
 */
function useTituloFuera(ruta: string): { fuera: boolean; bajado: boolean } {
  // El estado lleva la ruta en la que se midió: al cambiar de pantalla vale «no» hasta la primera medición, sin reiniciarlo dentro del efecto.
  const [estado, setEstado] = useState({ ruta, fuera: false, bajado: false });
  useEffect(() => {
    const main = document.getElementById("pn-contenido");
    if (!main) return;
    let observado: Element | null = null;
    const io = new IntersectionObserver(([e]) => setEstado((s) => ({ ...s, ruta, fuera: !e.isIntersecting && e.boundingClientRect.top < 60 })), { rootMargin: "-52px 0px 0px 0px" });
    const buscar = () => {
      const h1 = main.querySelector("h1");
      if (h1 && h1 !== observado) { if (observado) io.unobserve(observado); observado = h1; io.observe(h1); }
    };
    buscar();
    const mo = new MutationObserver(buscar);
    mo.observe(main, { childList: true, subtree: true });
    const alBajar = () => setEstado((s) => (s.ruta === ruta && s.bajado === window.scrollY > 4 ? s : { ...s, ruta, bajado: window.scrollY > 4 }));
    window.addEventListener("scroll", alBajar, { passive: true });
    return () => { io.disconnect(); mo.disconnect(); window.removeEventListener("scroll", alBajar); };
  }, [ruta]);
  return estado.ruta === ruta ? { fuera: estado.fuera, bajado: estado.bajado } : { fuera: false, bajado: false };
}

/** Barra de arriba del teléfono (boceto): la O, el título al centro y Buscar, «+» y tu perfil. Cada pantalla puede cambiarla. */
function BarraArriba({ iniciales, alBuscar }: { iniciales: string; alBuscar: () => void }) {
  const ruta = usePathname();
  const barra = useBarraActual();
  const { fuera, bajado } = useTituloFuera(ruta);
  const nombre = barra?.titulo ?? (ruta === "/panel/mas" ? "Más" : seccionPorRuta(ruta)?.nombre ?? "");
  const nuevo = barra?.nuevo ?? { etiqueta: "Nuevo", alPulsar: alBuscar };
  return (
    <header className="pn-arriba" data-sombra={bajado || Boolean(barra?.volver)} data-titulo={Boolean(barra?.titulo) || fuera}>
      <span className="pn-arriba-izq">
        {barra?.volver ? (
          <Link href={barra.volver.href} className="pn-arriba-volver"><Gesto nombre="izquierda" tamano={20} />{barra.volver.texto}</Link>
        ) : (
          <Link href="/panel" aria-label="Hoy" style={{ display: "inline-flex", minHeight: 44, alignItems: "center" }}><Logo alto={28} solo="o" /></Link>
        )}
      </span>
      <span className="pn-arriba-titulo" aria-hidden>{nombre}</span>
      <span className="pn-arriba-der">
        {barra?.extra ? <button type="button" className="pn-arriba-sec" onClick={barra.extra.alPulsar}>{barra.extra.etiqueta}</button> : null}
        {barra?.sinBuscar ? null : (
          <button type="button" className="pn-iconbtn" aria-label="Buscar" onClick={alBuscar}><Icono nombre="buscar" tamano={22} /></button>
        )}
        <button type="button" className="pn-arriba-nuevo" aria-label={nuevo.etiqueta} title={nuevo.etiqueta} onClick={nuevo.alPulsar}><Gesto nombre="mas" tamano={22} /></button>
        {barra?.sinBuscar ? null : (
          <Link href={CONFIGURACION.ruta} className="pn-arriba-perfil" aria-label="Tu perfil y configuración"><span className="pn-av" aria-hidden>{iniciales}</span></Link>
        )}
      </span>
    </header>
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
  const iniciales = (sesion?.name ?? sesion?.email ?? "?").split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  const barra = BARRA_TELEFONO.map((slug) => SECCIONES.find((s) => s.slug === slug)).filter((s): s is Seccion => Boolean(s));
  const activaBarra = activaEn(ruta);
  const enMas = !barra.some(activaBarra) && ruta !== "/panel";
  const porAtender = usePorAtender();
  // Números del menú (boceto): archivos por revisar en la Bandeja y consultas por atender.
  const enBandeja = useCuentaBandeja();
  const numeros: Partial<Record<string, number>> = { bandeja: enBandeja, consultas: porAtender };
  const alternar = () => { guardarMini(esMini ? "pinned" : "mini"); setEncima(false); };

  return (
    <ProveedorBarra abrirBuscar={abrirBuscar}>
      <div className="pn-app">
        <a href="#pn-contenido" className="pn-saltar">Saltar al contenido</a>
        <BarraArriba iniciales={iniciales} alBuscar={() => abrirBuscar()} />
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
              <span className="pn-lbl"><Logo alto={18} /></span>
              <span className="pn-mark" aria-hidden><Logo alto={26} solo="o" /></span>
              {abierto ? (
                <button type="button" className="pn-navbtn pn-lbl" style={{ flex: "none" }} onClick={alternar}
                  aria-label={esMini ? "Fijar el menú" : "Contraer el menú"} title={esMini ? "Fijar el menú" : "Contraer el menú"}>
                  <Gesto nombre="panel" tamano={17} />
                </button>
              ) : null}
            </div>
            <button type="button" className="pn-busca" title="Buscar o crear (Ctrl K)" aria-label="Buscar o crear" aria-keyshortcuts="Control+K" onClick={() => abrirBuscar()}>
              <Icono nombre="buscar" tamano={16} /><span>Buscar o crear</span><kbd>Ctrl K</kbd>
            </button>
            <nav aria-label="Principal" style={{ minHeight: 0, display: "flex", flexDirection: "column" }}>
              <Menu contraido={!abierto} numeros={numeros} />
            </nav>
            <MenuCuenta iniciales={iniciales} nombre={sesion?.name ?? "Equipo Fortius"} correo={sesion?.email} />
          </div>
        </aside>
        <main className="pn-main" id="pn-contenido" tabIndex={-1}>{children}</main>
        <BuscarOCrear key={paleta.abierta ? `a-${paleta.texto}` : "c"} abierta={paleta.abierta} textoInicial={paleta.texto} alCerrar={() => setPaleta({ abierta: false, texto: "" })} />
        <nav className="pn-barra" aria-label="Principal">
          {barra.map((s) => {
            const n = numeros[s.slug] ?? 0;
            return (
              <Link key={s.slug} href={s.ruta} aria-current={activaBarra(s) ? "page" : undefined}>
                <Icono nombre={s.icono} tamano={22} />{s.nombre}
                {n ? <span className="pn-barra-n" aria-label={`${n} por atender`}>{n}</span> : null}
              </Link>
            );
          })}
          <Link href="/panel/mas" aria-current={enMas || ruta === "/panel/mas" ? "page" : undefined}>
            <Gesto nombre="puntos" tamano={22} />Más
          </Link>
        </nav>
      </div>
    </ProveedorBarra>
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
