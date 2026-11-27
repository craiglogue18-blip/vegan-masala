import { kv } from '@vercel/kv';
import { getAllRecipeSlugs, getRecipeBySlug, type Recipe } from '@/lib/recipes';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { createHash } from 'node:crypto';
import { getRecipeDepth } from '@/lib/recipeDepth';
export type Content = { title: string; ingredients: string[]; instructions: string[]; image: string; video: string };
export type Revision = { revision: string; content: Content; updatedAt: string };
export function configured() { return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN); }
export function key(slug: string, stage: string) { return `publisher:v1:${slug}:${stage}`; }
export function validate(value: unknown, original?: Content): Content {
  const v = value as Content;
  if (!v || typeof v !== 'object') throw new Error('Recipe content required');
  const title = v.title === undefined && original ? original.title : v.title;
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 180 || /[\x00-\x1f\x7f]/.test(title)) throw new Error('Enter a recipe title (maximum 180 characters)');
  for (const field of ['ingredients', 'instructions'] as const) {
    if (!Array.isArray(v[field]) || !v[field].length || v[field].length > 150 || v[field].some(x => typeof x !== 'string' || !x.trim() || x.length > 4000)) throw new Error(`Check ${field}`);
  }
  for (const field of ['image', 'video'] as const) {
    if (typeof v[field] !== 'string' || v[field].length > 2000) throw new Error('Invalid media');
    if (original && v[field] === original[field]) continue;
    if (v[field].includes('..')) throw new Error('Invalid media path');
    if (v[field] && !/^\/images\/[\w/.-]+$/.test(v[field])) {
      const url = new URL(v[field]);
      if (url.protocol !== 'https:' || url.username || url.password || url.origin !== process.env.PUBLISHER_MEDIA_ORIGIN) throw new Error('Media must use the configured Blob store');
    }
  }
  return { title: title.trim(), ingredients: v.ingredients.map(x=>x.trim()), instructions: v.instructions.map(x=>x.trim()), image: v.image, video: v.video };
}
export const PUBLISHED_RECIPES_TAG = 'publisher:public-recipes:v2';

async function boundedRead<T>(read: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      read,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Published recipe read timed out')), 2000);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function checkedRevision(value: unknown): Revision | null {
  if (value === null) return null;
  const revision = value as Revision;
  if (!revision || typeof revision !== 'object' || !revision.content ||
      typeof revision.revision !== 'string' || !revision.revision ||
      typeof revision.updatedAt !== 'string' || !Number.isFinite(Date.parse(revision.updatedAt))) {
    throw new Error('Invalid published recipe revision');
  }
  // Legacy revisions may lack a title. Preserve their existing media; publishing
  // still applies the stricter media-origin check before anything is saved.
  const content = validate(revision.content, { ...revision.content, title: 'Recipe' });
  return { revision: revision.revision, updatedAt: revision.updatedAt,
    content: { ...content, title: revision.content.title } };
}

// Cache only successful provider responses. Errors must escape this function so
// failed background refreshes cannot replace the last successful snapshot.
const readPublishedSnapshot = unstable_cache(async (slugs: string[]) => {
  const values = await boundedRead(kv.mget<unknown[]>(...slugs.map(slug => key(slug, 'published'))));
  if (!Array.isArray(values) || values.length !== slugs.length) throw new Error('Invalid published snapshot');
  const snapshot: Record<string, Revision | null> = Object.create(null);
  slugs.forEach((slug, index) => {
    try {
      snapshot[slug] = checkedRevision(values[index]);
    } catch {
      // A corrupt record affects only that recipe, never the whole catalogue.
      console.error('[publisher] Invalid published revision; serving source recipe', { slug });
      snapshot[slug] = null;
    }
  });
  return snapshot;
}, ['publisher-public-snapshot-v2', createHash('sha256').update(process.env.KV_REST_API_URL || '').digest('hex')], { revalidate: 60, tags: [PUBLISHED_RECIPES_TAG] });

// Metadata and page rendering share the same snapshot within a server request.
const publishedSnapshot = cache(async () => {
  const slugs = [...new Set(getAllRecipeSlugs())].sort();
  if (!slugs.length) return {} as Record<string, Revision | null>;
  return readPublishedSnapshot(slugs);
});

function applyPublished(base: Recipe, revision: Revision | null | undefined) {
  if (!revision) return base;
  const content = validate(revision.content, { ...revision.content, title: base.title });
  return { ...base, ...content, publisherRevision: revision.revision, updatedAt: revision.updatedAt };
}

export async function publishedRecipes(bases: Recipe[]) {
  if (!bases.length || !configured()) return bases;
  try {
    const snapshot = await publishedSnapshot();
    return bases.map(base => applyPublished(base, snapshot[base.slug]));
  } catch {
    // Cold-cache failures use bundled recipes; never cache that fallback as a
    // successful storage response or attach a publisherRevision to it.
    console.error('[publisher] Published snapshot unavailable; serving source recipes');
    return bases;
  }
}

export async function publishedRecipe(slug: string) {
  const base = getRecipeBySlug(slug);
  if (!base) return null;
  return (await publishedRecipes([base]))[0];
}
export function initialContent(slug: string): Content {
  const r = getRecipeBySlug(slug);
  if (!r) throw new Error('Recipe not found');
  return { title: r.title, ingredients: r.ingredients || (r.ingredientsMarkdown || '').split('\n').filter(s=>/^\s*[-*+] /.test(s)).map(s=>s.replace(/^\s*[-*+] /,'').trim()), instructions: getRecipeDepth(slug)?.instructions || r.instructions || (r.methodMarkdown || '').split('\n').filter(s=>/^\s*\d+[.)] /.test(s)).map(s=>s.replace(/^\s*\d+[.)] /,'').trim()), image: r.image || '', video: r.video || '' };
}
