"use client";

import * as React from "react";
import * as motion from "motion/react-m";
import { useMotionValue, useSpring } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useMotionProfile } from "@/lib/use-motion-profile";

/** Public-only choreography. The application and admin keep their own routing. */
export function PublicExperience({ children }: React.PropsWithChildren) {
  const root = React.useRef<HTMLDivElement>(null);
  const rail = React.useRef<HTMLDivElement>(null);
  const curtain = React.useRef<HTMLDivElement>(null);
  const pending = React.useRef(false);
  const fallback = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
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

  React.useEffect(() => {
    const veil = curtain.current;
    if (!isPublic || !veil) return;
    if (fallback.current) clearTimeout(fallback.current);
    pending.current = false;
    cursorOpacity.set(0);
    gsap.to(veil, {
      yPercent: -105, duration: reduce ? 0 : 0.55, ease: "power4.inOut",
      onComplete: () => { gsap.set(veil, { visibility: "hidden" }); },
    });
    return () => { gsap.killTweensOf(veil); };
  }, [pathname, isPublic, reduce, cursorOpacity]);

  React.useEffect(() => {
    if (!isPublic || reduce) return;
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || !root.current?.contains(link) || link.hasAttribute("download") || link.hasAttribute("data-document-navigation") || (link.target && link.target !== "_self")) return;
      const url = new URL(link.href, location.href);
      // Anchors, external contact channels and same-page filters keep native behavior.
      if (url.origin !== location.origin || url.pathname === location.pathname || url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;
      const veil = curtain.current;
      if (!veil || pending.current) return;
      event.preventDefault();
      pending.current = true;
      cursorOpacity.set(0);
      gsap.killTweensOf(veil);
      gsap.set(veil, { visibility: "visible", yPercent: 105 });
      gsap.to(veil, {
        yPercent: 0, duration: 0.28, ease: "power3.inOut",
        onComplete: () => {
          router.push(url.pathname + url.search + url.hash);
          fallback.current = setTimeout(() => {
            pending.current = false;
            gsap.to(veil, { yPercent: -105, duration: 0.35, onComplete: () => { gsap.set(veil, { visibility: "hidden" }); } });
          }, 4500);
        },
      });
    };
    document.addEventListener("click", navigate, true);
    return () => {
      document.removeEventListener("click", navigate, true);
      if (fallback.current) clearTimeout(fallback.current);
    };
  }, [isPublic, reduce, router, cursorOpacity]);

  if (!isPublic) return <>{children}</>;

  return (
    <div ref={root} className="public-experience">
      <div ref={rail} role="progressbar" aria-label="Avance de lectura" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} className="reading-progress" />
      {children}
      {magnetic && <motion.div data-custom-cursor aria-hidden="true" className="cursor-guide" style={{ x: cursorX, y: cursorY, opacity: cursorOpacity }}>{label}</motion.div>}
      <div ref={curtain} data-page-curtain aria-hidden="true" className="page-curtain"><span>MNT<span className="ml-3 font-mono text-xs font-normal tracking-[0.15em]">INMUEBLES</span></span></div>
    </div>
  );
}
