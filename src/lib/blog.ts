import "server-only";

import type { Post } from "@/lib/admin/store";
import { getPublicPosts } from "@/lib/backend/public";
import { postDate } from "@/lib/blog-editorial";

export async function getBlogPosts(): Promise<Post[]> {
  return (await getPublicPosts()).sort(
    (a, b) => Date.parse(postDate(b)) - Date.parse(postDate(a)) || a.slug.localeCompare(b.slug),
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
