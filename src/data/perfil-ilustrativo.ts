import { SITE_TERMS } from "@/data/site-terms";

/*
  Perfil que se muestra mientras el panel no tenga ningún perfil de equipo publicado
  (Nosotros y el inicio). Se reemplaza solo cuando se publica un perfil real; sin foto,
  la portada de la persona usa el símbolo de la marca.
*/
export const PERFIL_ILUSTRATIVO = {
  id: "moises",
  nombre: SITE_TERMS.responsible,
  cargo: "Asesor inmobiliario en Fortius",
  iniciales: "MN",
  descripcion: "Soy tu contacto para revisar lo que buscas o la propiedad que quieres vender. Coordino las visitas y reviso las propuestas contigo; tú decides qué condiciones aceptar.",
  foto: "/images/team/advisor-example.webp",
};
