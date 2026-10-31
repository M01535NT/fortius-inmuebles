"use client";

import * as React from "react";
import * as motion from "motion/react-m";
import { useMotionValue, useSpring } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useMotionProfile } from "@/lib/use-motion-profile";
import { LockTransition } from "@/components/home/lock-transition";

/* Navegar con la transición del candado desde código (el buscador); fuera del sitio público es un push normal. */
const PageTransitionContext = React.createContext<((href: string) => void) | null>(null);
export function usePageTransition() {
  const transition = React.useContext(PageTransitionContext);
  const router = useRouter();
  return transition ?? ((href: string) => router.push(href));
}

/** Public-only choreography. The application and admin keep their own routing. */
export function PublicExperience({ children }: React.PropsWithChildren) {
  const root = React.useRef<HTMLDivElement>(null);
  const rail = React.useRef<HTMLDivElement>(null);
  const stage = React.useRef<HTMLDivElement>(null);
  const curtain = React.useRef<HTMLDivElement>(null);
  const pending = React.useRef(false);
  const played = React.useRef(false);
  const running = React.useRef<gsap.core.Timeline | null>(null);
  const arrived = React.useRef<(() => void) | null>(null);
  const fallback = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const lastPath = React.useRef(pathname);
  const isPublic = !pathname.startsWith("/admin");
  const router = useRouter();
  const { reduce, magnetic } = useMotionProfile();
  const cursorX = useSpring(useMotionValue(-100), { stiffness: 400, damping: 32 });
  const cursorY = useSpring(useMotionValue(-100), { stiffness: 400, damping: 32 });
  const cursorOpacity = useMotionValue(0);
  const [label, setLabel] = React.useState("");

  useGSAP(() => {
    const bar = rail.current;
    if (!isPublic || !bar) return;
    const setScale = gsap.quickSetter(bar, "scaleX");
    const update = (progress: number) => {
      setScale(progress);
      bar.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
    };
    const trigger = ScrollTrigger.create({
      start: 0,
      end: () => Math.max(1, document.documentElement.scrollHeight - innerHeight),
      invalidateOnRefresh: true,
      onUpdate: (self) => update(self.progress),
      onRefresh: (self) => update(self.progress),
    });
    update(trigger.progress);
    let active = true;
    let refresh = 0;
    let height = document.documentElement.scrollHeight;
    const scheduleRefresh = () => {
      cancelAnimationFrame(refresh);
      refresh = requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    // Filters, accordions and loaded images can change the reading distance.
    const observer = new ResizeObserver(() => {
      const nextHeight = document.documentElement.scrollHeight;
      if (height === nextHeight) return;
      height = nextHeight;
      scheduleRefresh();
    });
    observer.observe(document.body);
    scheduleRefresh();
    document.fonts.ready.then(() => { if (active) scheduleRefresh(); });
    return () => {
      active = false;
      observer.disconnect();
      cancelAnimationFrame(refresh);
      trigger.kill();
    };
  }, { scope: root, dependencies: [pathname, isPublic], revertOnUpdate: true });

  React.useEffect(() => {
    if (!isPublic || !magnetic) return;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-cursor]") : null;
      cursorX.set(event.clientX - 32);
      cursorY.set(event.clientY - 32);
      cursorOpacity.set(target ? 1 : 0);
      setLabel(target?.dataset.cursor ?? "");
    };
    const hide = () => cursorOpacity.set(0);
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    return () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
      hide();
    };
  }, [isPublic, magnetic, cursorX, cursorY, cursorOpacity]);

  /*
    Transición entre páginas (31/10/2026): sin cortina ni texto. La página se desvanece y al
    centro una llave entra en el candado, gira y lo abre. La página nueva carga mientras tanto;
    el candado se va cuando terminó su movimiento y la ruta ya cambió (o a los 4.5 s, para no
    dejar la pantalla vacía). La primera vez de la visita va completo; después, más rápido.
  */
  const navigateWithLock = React.useCallback((href: string) => {
    const veil = curtain.current;
    const page = stage.current;
    const target = new URL(href, location.href);
    if (reduce || !veil || !page || target.pathname === location.pathname) { router.push(href); return; }
    if (pending.current) {
      // Un clic nuevo con el candado en pantalla (p. ej. tras volver atrás) no se pierde:
      // se corta la transición y se va directo a la nueva ruta.
      running.current?.kill();
      running.current = null;
      if (fallback.current) clearTimeout(fallback.current);
      pending.current = false;
      arrived.current = null;
      gsap.set(veil, { autoAlpha: 0, scale: 1 });
      gsap.set(page, { opacity: 1 });
      router.push(href);
      return;
    }
    pending.current = true;
    cursorOpacity.set(0);

    let animDone = false;
    let routeDone = false;
    const q = gsap.utils.selector(veil);
    const reveal = () => {
      if (!pending.current || !animDone || !routeDone) return;
      pending.current = false;
      arrived.current = null;
      running.current = null;
      if (fallback.current) clearTimeout(fallback.current);
      gsap.timeline()
        .to(veil, { autoAlpha: 0, scale: 1.06, duration: 0.35, ease: "power2.in" })
        .to(page, { opacity: 1, duration: 0.45, ease: "power2.out" }, "-=0.15")
        .set(veil, { scale: 1 });
    };
    arrived.current = () => { routeDone = true; reveal(); };

    const key = q(".lock-key");
    const shackle = q(".lock-shackle");
    gsap.killTweensOf([veil, page, ...key, ...shackle]);
    gsap.set(key, { y: 92, opacity: 0, scaleX: 1, svgOrigin: "100 240" });
    gsap.set(shackle, { y: 0, scaleX: 1, svgOrigin: "142 80" });
    const timeline = gsap.timeline({ onComplete: () => { animDone = true; reveal(); } })
      .to(page, { opacity: 0, duration: 0.3, ease: "power2.out" })
      .fromTo(veil, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "power3.out" }, "<0.1")
      .add(() => {
        router.push(href);
        fallback.current = setTimeout(() => { animDone = true; routeDone = true; reveal(); }, 4500);
      })
      // La llave sube y entra por la base hasta el tope.
      .to(key, { opacity: 1, duration: 0.2 }, "<")
      .to(key, { y: 0, duration: 0.6, ease: "power3.inOut" }, "<")
      .to(key, { y: 2, duration: 0.07, ease: "power1.out", yoyo: true, repeat: 1 })
      // Un cuarto de vuelta sobre su eje: la cabeza queda de canto.
      .to(key, { scaleX: 0.16, duration: 0.42, ease: "power2.inOut" }, "+=0.04")
      // El arco salta y gira sobre su pata larga, hacia el frente.
      .to(shackle, { y: -18, duration: 0.22, ease: "back.out(3)" }, "+=0.02")
      .to(shackle, { scaleX: 0.3, duration: 0.42, ease: "power2.inOut" }, "-=0.04")
      .to({}, { duration: 0.18 });
    running.current = timeline;
    if (played.current) timeline.timeScale(1.7);
    played.current = true;
  }, [reduce, router, cursorOpacity]);

  // Llegada a la ruta nueva: termina la transición; sin transición en curso, todo queda visible.
  React.useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    if (arrived.current) { arrived.current(); return; }
    if (stage.current) gsap.set(stage.current, { opacity: 1 });
    if (curtain.current) gsap.set(curtain.current, { autoAlpha: 0 });
  }, [pathname]);

  React.useEffect(() => {
    if (!isPublic || reduce) return;
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || !root.current?.contains(link) || link.hasAttribute("download") || link.hasAttribute("data-document-navigation") || (link.target && link.target !== "_self")) return;
      const url = new URL(link.href, location.href);
      // Anchors, external contact channels and same-page filters keep native behavior.
      if (url.origin !== location.origin || url.pathname === location.pathname || url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;
      event.preventDefault();
      navigateWithLock(url.pathname + url.search + url.hash);
    };
    document.addEventListener("click", navigate, true);
    return () => {
      document.removeEventListener("click", navigate, true);
      if (fallback.current) clearTimeout(fallback.current);
    };
  }, [isPublic, reduce, navigateWithLock]);

  if (!isPublic) return <>{children}</>;

  return (
    <PageTransitionContext.Provider value={navigateWithLock}>
    <div ref={root} className="public-experience">
      <div ref={rail} role="progressbar" aria-label="Avance de lectura" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} className="reading-progress" />
      {/* Sin transform: los overlays position:fixed de adentro siguen anclados a la ventana. */}
      <div ref={stage} className="page-stage">{children}</div>
      {magnetic && <motion.div data-custom-cursor aria-hidden="true" className="cursor-guide" style={{ x: cursorX, y: cursorY, opacity: cursorOpacity }}>{label}</motion.div>}
      <div ref={curtain} data-page-curtain aria-hidden="true" className="page-curtain"><LockTransition /></div>
    </div>
    </PageTransitionContext.Provider>
  );
}
