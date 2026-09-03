import "server-only";
import type { Property } from "@/data/propiedades";
import { getPublicProperties } from "@/lib/backend/public";

/** Only the independent COTA panel's public projection reaches the website. */
export async function getPropiedades(): Promise<Property[]> {
  return getPublicProperties();
}

export async function getPropertyBySlug(slug: string): Promise<Property | undefined> {
  return (await getPropiedades()).find((p) => p.slug === slug);
}

export async function getFeaturedProperties(): Promise<Property[]> {
  return (await getPropiedades()).filter((p) => p.destacada);
}

export async function getRelatedProperties(slug: string, limit = 3): Promise<Property[]> {
  const todas = await getPropiedades();
  const actual = todas.find((p) => p.slug === slug);
  if (!actual) return [];
  const pool = todas.filter((p) => p.slug !== slug && p.estado !== "vendida");
  const related = pool.filter((p) => p.zona === actual.zona || p.tipo === actual.tipo);
  return [...related, ...pool.filter((p) => !related.includes(p))].slice(0, limit);
}
