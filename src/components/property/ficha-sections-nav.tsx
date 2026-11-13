/*
  Índice de secciones de la ficha: va pegado arriba (sticky en ficha.css) y siempre visible.
  Decisión del titular del 13/11/2026 («No quiero que se desaparezcan»): reemplaza la regla I8
  del 12/11, que lo ocultaba al bajar y lo mostraba al subir, en celular y en escritorio.
*/
export function FichaSectionsNav({ sections }: { sections: { id: string; label: string }[] }) {
  return (
    <nav className="fe-sections" aria-label="Secciones del inmueble">
      {sections.map(section => <a key={section.id} href={`#${section.id}`}>{section.label}</a>)}
    </nav>
  );
}
