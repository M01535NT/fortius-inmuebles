"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "@/lib/admin/store";
import { AsyncButton, btnGhost } from "@/components/admin/ui";
import { LogOut, Settings, UserRound, KeyRound } from "lucide-react";
export function ProfileMenu({ onLogout }: { onLogout: () => Promise<void> }) {
  const user = useSession();
  const [open, setOpen] = React.useState(false);
  const root = React.useRef<HTMLDivElement>(null), trigger = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  if (!user) return null;
  const name = user.name || user.email.split("@")[0];
  const initials = name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase();
  return <div className="admin-profile" ref={root} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } }}>
    <button ref={trigger} type="button" className="admin-avatar" aria-label={`Menú de usuario: ${name}`} aria-expanded={open} aria-controls="admin-profile-menu" onClick={() => setOpen(!open)}>
      {user.avatar ? <Image unoptimized src={user.avatar} alt="" width={40} height={40} /> : <span aria-hidden="true">{initials}</span>}
    </button>
    {open && <div id="admin-profile-menu" className="admin-profile-menu">
      <p className="font-semibold">{name}</p><p className="break-all text-sm text-muted-foreground">{user.email}</p><p className="mb-3 text-xs text-muted-foreground">{user.role === "admin" ? "Administrador" : "Editor"}</p>
      <Link href="/admin/perfil" onClick={() => setOpen(false)}><UserRound size={18}/>Mi perfil y fotografía</Link>
      <Link href="/admin/perfil#seguridad" onClick={() => setOpen(false)}><KeyRound size={18}/>Cambiar contraseña</Link>
      {user.role === "admin" && <Link href="/admin/configuracion" onClick={() => setOpen(false)}><Settings size={18}/>Configuración del negocio</Link>}
      <AsyncButton onClick={onLogout} className={btnGhost + " mt-3 w-full"}><LogOut size={18}/>Cerrar sesión</AsyncButton>
    </div>}
  </div>;
}
