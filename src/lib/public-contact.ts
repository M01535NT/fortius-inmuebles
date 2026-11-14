import type { SiteSettings } from "@/lib/domain/records";

/** Known demo numbers must never be presented as confirmed contact channels. */
function phoneDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 && !/0{7}$/.test(digits) ? digits : "";
}

/*
  Un número mexicano de 10 dígitos guardado sin lada de país («6642212991») se marcaba como
  tel:+6642212991, que el teléfono lee como +66 (Tailandia). Se completa con 52 para llamar y
  para wa.me, que también exige la lada de país (13/11/2026).
*/
function internationalDigits(digits: string) {
  return digits.length === 10 ? `52${digits}` : digits;
}

/* «+52 664 221 2991»: legible y fácil de dictar. Otros formatos se muestran como se capturaron. */
function displayNumber(digits: string, fallback: string) {
  const mx = /^52(\d{3})(\d{3})(\d{4})$/.exec(internationalDigits(digits));
  return mx ? `+52 ${mx[1]} ${mx[2]} ${mx[3]}` : fallback;
}

function messagingNumber(value: string) {
  if (!value) return "";
  if (/^https:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      if (url.username || url.password || url.port) return "";
      if (url.hostname === "wa.me" && /^\/\d{7,15}\/?$/.test(url.pathname)) return phoneDigits(url.pathname.slice(1));
      if (url.hostname === "api.whatsapp.com" && url.pathname === "/send") return phoneDigits(url.searchParams.get("phone") ?? "");
    } catch { return ""; }
    return "";
  }
  return /^[+\d\s()-]+$/.test(value) ? phoneDigits(value) : "";
}

function messengerLink(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return "";
    if (!["m.me", "facebook.com", "www.facebook.com", "m.facebook.com"].includes(url.hostname)) return "";
    const handle = url.pathname === "/profile.php" ? url.searchParams.get("id") : url.pathname.replace(/^\/|\/$/g, "");
    if (!handle || !/^[a-zA-Z0-9._-]+$/.test(handle) || /^(share|groups|watch|reel|stories|pages|login|profile.php)$/i.test(handle)) return "";
    return `https://m.me/${handle}`;
  } catch { return ""; }
}

export function publicContact(settings?: SiteSettings | null, message?: string) {
  const phone = settings?.telefono.trim() ?? "";
  const digits = phoneDigits(phone);
  const whatsapp = settings?.whatsapp.trim() ?? "";
  const whatsappDigits = messagingNumber(whatsapp);
  const whatsappHref = whatsappDigits ? `https://wa.me/${internationalDigits(whatsappDigits)}${message ? `?text=${encodeURIComponent(message)}` : ""}` : "";
  const email = settings?.email.trim() ?? "";
  const emailHref = email ? `mailto:${email}${message ? `?subject=${encodeURIComponent("Consulta a Fortius Inmuebles")}&body=${encodeURIComponent(message)}` : ""}` : "";
  return {
    emailHref,
    phone: digits ? displayNumber(digits, phone) : "por confirmar",
    phoneHref: digits ? `tel:+${internationalDigits(digits)}` : "",
    whatsapp: whatsappHref,
    whatsappLabel: whatsappHref ? displayNumber(whatsappDigits, whatsapp) : "por confirmar",
    email,
    messenger: messengerLink(settings?.facebook ?? ""),
  };
}
