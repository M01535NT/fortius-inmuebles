import "server-only";
import { brandCopy } from "@/lib/brand-copy";
import { cache } from "react";
import type { Property } from "@/data/propiedades";
import type { Asesor, SiteContent, SiteSettings, Post } from "@/lib/admin/store";
import { createServerClient } from "./auth";
import { projectPublic } from "./validation";
import { databaseError } from "./http";
import { resolveSiteContent } from "@/data/home-copy";

const readPublic = cache(async (collection: string): Promise<Record<string, unknown>[]> => {
  const client = createServerClient();
  const records: unknown[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.rpc("fortius_inmuebles_public_records", { p_collection: collection }).range(offset, offset + 499);
    if (error) databaseError(error);
    records.push(...(data ?? []).map((row: { data: unknown }) => row.data));
    if (!data || data.length < 500) break;
  }
  return projectPublic(collection, records);
});

export async function getPublicProperties(): Promise<Property[]> { return await readPublic("propiedades") as unknown as Property[]; }
export async function getPublicAdvisers(): Promise<Asesor[]> { return await readPublic("asesores") as unknown as Asesor[]; }
export async function getPublicContent(): Promise<SiteContent> { return resolveSiteContent((await readPublic("contenido"))[0] as SiteContent | undefined); }
export async function getPublicSettings(): Promise<SiteSettings | null> {
  const settings = (await readPublic("config"))[0] as SiteSettings | undefined;
  return settings ? { ...settings, nombreComercial: brandCopy(settings.nombreComercial) } : null;
}
export async function getPublicPosts(): Promise<Post[]> {
  const posts = await readPublic("posts") as unknown as Post[];
  return posts.map(post => ({ ...post, titulo: brandCopy(post.titulo), resumen: brandCopy(post.resumen), autor: post.autor ? brandCopy(post.autor) : undefined, contenido: brandCopy(post.contenido) }));
}
