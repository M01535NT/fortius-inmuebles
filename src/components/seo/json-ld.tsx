import { serializeLd } from "@/lib/seo/json-ld";

type Props = { data: Parameters<typeof serializeLd>[0] };

/* Bloque de datos estructurados. Es un bloque de datos, no un script ejecutable: la CSP no lo bloquea. */
export function JsonLd({ data }: Props) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeLd(data) }} />;
}
