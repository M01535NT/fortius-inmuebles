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
  descripcion: "En Fortius revisamos contigo lo que buscas o la propiedad que vendes; coordinamos visitas y propuestas, y tú decides.",
  foto: "/images/team/advisor-example.webp",
};
