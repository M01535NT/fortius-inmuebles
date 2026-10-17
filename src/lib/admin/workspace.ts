import type { Property } from "@/data/propiedades";

export const normalizedText = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
function phone(s = "") {
  const digits = s.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("52")
    ? digits.slice(2)
    : digits;
}
export function duplicateContacts<
  T extends { id: string; telefono?: string; email?: string },
>(person: T, records: T[]): T[] {
  const telephone = phone(person.telefono),
    email = person.email?.trim().toLowerCase();
  return records.filter(
    (other) =>
      other.id !== person.id &&
      ((telephone.length >= 7 && telephone === phone(other.telefono)) ||
        (!!email && email === other.email?.trim().toLowerCase())),
  );
}
export type InventoryFilters = {
  q: string;
  advisor: string;
  operation: string;
  publication: string;
  status: string;
};
export const emptyInventoryFilters: InventoryFilters = {
  q: "",
  advisor: "",
  operation: "",
  publication: "",
  status: "",
};
export function filterInventory(properties: Property[], f: InventoryFilters) {
  return properties.filter(
    (p) =>
      normalizedText(`${p.titulo} ${p.codigo} ${p.zona}`).includes(
        normalizedText(f.q),
      ) &&
      (!f.advisor || p.asesorId === f.advisor) &&
      (!f.operation || p.operacion === f.operation) &&
      (!f.status || p.estado === f.status) &&
      (!f.publication ||
        (f.publication === "publicada" ? p.publicada : !p.publicada)),
  );
}
