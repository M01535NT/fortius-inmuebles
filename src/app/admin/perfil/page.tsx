"use client";
import * as React from "react";
import Image from "next/image";
import { apiRequest, changePassword, isLoggedIn, useSession } from "@/lib/admin/store";
import { AsyncForm, Field, PageHeader, btnGhost, btnPrimary, inputClass } from "@/components/admin/ui";
import { useBrowserPreference } from "@/components/admin/workspace/browser-preference";

export default function ProfilePage() {
  const user = useSession();
  const [avatar, setAvatar] = React.useState<string | null>(null);
  const [photoError, setPhotoError] = React.useState("");
  const [processing, setProcessing] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [density, setDensity] = useBrowserPreference(`fortius:density:${user?.id}`, "comfortable", value => value === "compact" ? "compact" : "comfortable");
  const photo = avatar ?? user?.avatar ?? "";
  async function choose(file?: File) {
    if (!file) return;
    setPhotoError(""); setProcessing(true);
    try {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error("Elige una foto JPG, PNG o WebP de hasta 5 MB.");
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas"); canvas.width = canvas.height = 192;
      const context = canvas.getContext("2d"); if (!context) throw new Error("No se pudo preparar la imagen.");
      const side = Math.min(bitmap.width, bitmap.height);
      context.fillStyle = "#ffffff"; context.fillRect(0, 0, 192, 192);
      context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 192, 192);
      bitmap.close(); setAvatar(canvas.toDataURL("image/jpeg", .85)); setSaved(false);
    } catch (error) { setPhotoError(error instanceof DOMException ? "No se pudo leer la fotografía. Prueba con otra imagen JPG, PNG o WebP." : error instanceof Error ? error.message : "No se pudo leer la fotografía."); }
    finally { setProcessing(false); }
  }
  return <div className="max-w-3xl space-y-6"><PageHeader title="Mi perfil" description="Tu identidad, seguridad y preferencias personales."/>
    <AsyncForm className="space-y-5 rounded-lg bg-card p-5" onSubmit={async event => {
      const form = new FormData(event.currentTarget);
      if (processing) throw new Error("Espera a que termine de prepararse la foto.");
      await apiRequest("/api/auth/profile", "PATCH", { name: String(form.get("name")), avatar: photo });
      await isLoggedIn(); setSaved(true);
    }}>
      <h2>Fotografía y nombre</h2>
      <div className="flex items-center gap-4">{photo ? <Image unoptimized src={photo} alt="Vista previa de tu fotografía" width={80} height={80} className="size-20 rounded-full object-cover"/> : <span className="admin-avatar size-20" aria-label="Sin fotografía">{user?.email.slice(0,2).toUpperCase()}</span>}<p className="text-sm text-muted-foreground">Esta fotografía aparecerá en tu menú de usuario. No cambia el perfil público del asesor.</p></div>
      <Field label="Seleccionar fotografía" htmlFor="profile-photo" hint="JPG, PNG o WebP. Se recorta al centro y se adapta automáticamente."><input id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp" className={inputClass} onChange={event => { void choose(event.target.files?.[0]); }}/></Field>
      {photoError && <p role="alert">{photoError}</p>}
      {photo && <button type="button" className={btnGhost} onClick={() => {setAvatar("");setSaved(false);}}>Quitar fotografía</button>}
      <Field label="Nombre visible" htmlFor="profile-name"><input id="profile-name" name="name" required minLength={2} maxLength={80} defaultValue={user?.name ?? ""} className={inputClass} onChange={() => setSaved(false)}/></Field>
      <p className="text-sm text-muted-foreground">{user?.email} · {user?.role === "admin" ? "Administrador" : "Editor"}</p>
      <button className={btnPrimary} disabled={processing}>{processing ? "Preparando foto…" : "Guardar perfil"}</button>
      {saved && <p role="status">Perfil guardado en tu cuenta.</p>}
    </AsyncForm>
    <section className="rounded-lg bg-card p-5"><h2>Preferencias de lectura</h2><div className="mt-4 flex gap-2" role="group" aria-label="Densidad de las tablas">{(["comfortable", "compact"] as const).map(value => <button key={value} type="button" aria-pressed={density === value} className={btnGhost} onClick={() => setDensity(value)}>{value === "compact" ? "Compacta" : "Cómoda"}</button>)}</div><p className="mt-3 text-sm text-muted-foreground">Se guarda en este navegador.</p></section>
    <section id="seguridad" className="scroll-mt-24 rounded-lg bg-card p-5"><h2>Cambiar contraseña</h2><AsyncForm className="mt-4 space-y-4" onSubmit={async event => {const form=event.currentTarget;const data=new FormData(form);if(data.get("password")!==data.get("confirm"))throw new Error("Las contraseñas no coinciden.");await changePassword(String(data.get("password")));form.reset();}}><Field label="Nueva contraseña" htmlFor="profile-password"><input id="profile-password" name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" className={inputClass}/></Field><Field label="Confirmar contraseña" htmlFor="profile-confirm"><input id="profile-confirm" name="confirm" type="password" required minLength={12} maxLength={128} autoComplete="new-password" className={inputClass}/></Field><button className={btnPrimary}>Actualizar contraseña</button></AsyncForm></section>
  </div>;
}
