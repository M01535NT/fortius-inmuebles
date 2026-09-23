export type BlogCover = { src: string; alt: string; width: 1200; height: 800 };

const covers: Record<string, { file: string; alt: string }> = {
  "cuanto-vale-mi-casa-tijuana": { file: "01", alt: "Ilustración de maquetas de casas, planos y un calibrador para comparar características." },
  "documentos-vender-propiedad-baja-california": { file: "02", alt: "Ilustración de un expediente ordenado, una maqueta de vivienda y una llave." },
  "propiedad-no-se-vende-que-revisar": { file: "03", alt: "Ilustración de una lupa sobre una casa en miniatura y sus tarjetas de presentación." },
  "comprar-casa-tijuana-ingresos-estados-unidos": { file: "04", alt: "Ilustración de dos ciudades en miniatura conectadas, una vivienda y fichas monetarias." },
  "gastos-comprar-casa-tijuana": { file: "05", alt: "Ilustración de una casa rodeada de compartimentos para documentos, servicios y otros gastos." },
  "que-revisar-antes-apartar-propiedad": { file: "06", alt: "Ilustración de tres umbrales de revisión delante de una vivienda, con una libreta y una lupa." },
  "preparar-casa-para-vender": { file: "07", alt: "Ilustración de una sala preparada para visitas, con elementos de limpieza y mantenimiento." },
  "comprar-o-rentar-tijuana": { file: "08", alt: "Ilustración de dos viviendas sobre plataformas iguales, con una llave y un documento de renta." },
  "que-revisar-comprar-terreno": { file: "09", alt: "Ilustración de una maqueta topográfica con pendiente, camino de acceso y una plataforma." },
  "como-elegir-local-comercial": { file: "10", alt: "Ilustración de un local comercial en miniatura, su acceso peatonal y su área de entrega." },
  "rentar-propiedad-seleccion-inquilino-entrega": { file: "11", alt: "Ilustración de un departamento en corte, un inventario de entrega y un juego de llaves." },
  "que-debe-hacer-inmobiliaria-vender": { file: "12", alt: "Ilustración de una mesa de trabajo inmobiliario con maqueta, cámara, expediente y llaves." },
};

export function getBlogCover(slug: string): BlogCover | undefined {
  const cover = Object.hasOwn(covers, slug) ? covers[slug] : undefined;
  return cover ? { src: `/images/blog/${cover.file}.webp`, alt: cover.alt, width: 1200, height: 800 } : undefined;
}
