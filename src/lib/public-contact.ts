import type { SiteSettings } from "@/lib/admin/store";

/** Known demo numbers must never be presented as confirmed contact channels. */
function phoneDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 && !/0{7}$/.test(digits) ? digits : "";
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
  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits}${message ? `?text=${encodeURIComponent(message)}` : ""}` : "";
  return {
    phone: digits ? phone : "por confirmar",
    phoneHref: digits ? `tel:+${digits}` : "",
    whatsapp: whatsappHref,
    whatsappLabel: whatsappHref ? whatsapp : "por confirmar",
    email: settings?.email.trim() ?? "",
    messenger: messengerLink(settings?.facebook ?? ""),
  };
}
