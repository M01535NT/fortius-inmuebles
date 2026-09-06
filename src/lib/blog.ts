import "server-only";

import type { Post } from "@/lib/admin/store";
import { getPublicPosts } from "@/lib/backend/public";

export async function getBlogPosts(): Promise<Post[]> {
  return (await getPublicPosts()).sort(
    (a, b) => Date.parse(b.actualizadoEl) - Date.parse(a.actualizadoEl),
  );
}

export async function getBlogPostBySlug(slug: string): Promise<Post | undefined> {
  return (await getBlogPosts()).find((post) => post.slug === slug);
}

export function postParagraphs(content: string): string[] {
  return content
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
