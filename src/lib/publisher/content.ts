import { kv } from '@vercel/kv';
import { getRecipeBySlug } from '@/lib/recipes';
import { getRecipeDepth } from '@/lib/recipeDepth';
export type Content = { ingredients: string[]; instructions: string[]; image: string; video: string };
export type Revision = { revision: string; content: Content; updatedAt: string };
export function configured() { return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN); }
export function key(slug: string, stage: string) { return `publisher:v1:${slug}:${stage}`; }
export function validate(value: unknown, original?: Content): Content {
  const v = value as Content;
  if (!v || typeof v !== 'object') throw new Error('Recipe content required');
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
  return { ingredients: v.ingredients.map(x=>x.trim()), instructions: v.instructions.map(x=>x.trim()), image: v.image, video: v.video };
}
export async function publishedRecipe(slug: string) {
  const base = getRecipeBySlug(slug);
  if (!base || !configured()) return base;
  // Storage errors deliberately surface: never silently serve old content as current.
  const published = await kv.get<Revision>(key(slug, 'published'));
  return published ? { ...base, ...published.content, videoPoster: published.content.image || base.videoPoster, publisherRevision: published.revision, updatedAt: published.updatedAt } : base;
}
export function initialContent(slug: string): Content {
  const r = getRecipeBySlug(slug);
  if (!r) throw new Error('Recipe not found');
  return { ingredients: r.ingredients || (r.ingredientsMarkdown || '').split('\n').filter(s=>/^\s*[-*+] /.test(s)).map(s=>s.replace(/^\s*[-*+] /,'').trim()), instructions: getRecipeDepth(slug)?.instructions || r.instructions || (r.methodMarkdown || '').split('\n').filter(s=>/^\s*\d+[.)] /.test(s)).map(s=>s.replace(/^\s*\d+[.)] /,'').trim()), image: r.image || '', video: r.video || '' };
}
