import type { SiteSettings } from "@/lib/admin/store";

/** Known demo numbers must never be presented as confirmed contact channels. */
function phoneDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && !/0{7}$/.test(digits) ? digits : "";
}

export function publicContact(settings?: SiteSettings | null) {
  const phone = settings?.telefono.trim() ?? "";
  const digits = phoneDigits(phone);
  const whatsapp = settings?.whatsapp.trim() ?? "";
  const whatsappDigits = phoneDigits(whatsapp);
  const whatsappHref = whatsappDigits
    ? (/^https:\/\//.test(whatsapp) ? whatsapp : `https://wa.me/${whatsappDigits}`)
    : "";
  return {
    phone: digits ? phone : "por confirmar",
    phoneHref: digits ? `tel:+${digits}` : "",
    whatsapp: whatsappHref,
    whatsappLabel: whatsappHref ? whatsapp : "por confirmar",
    email: settings?.email.trim() ?? "",
    messenger: settings?.facebook ? settings.facebook.replace(/^https:\/\/(www\.)?facebook\.com\//, "https://m.me/") : "",
  };
}
