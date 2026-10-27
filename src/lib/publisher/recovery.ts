import type { Content } from './content';
export const RECOVERY_KEY = 'vegan-masala-publisher-session-v1';
export type Recovery = { slug: string; content: Content; revision: string; dirty: boolean; uploading: boolean };
export function readRecovery(raw: string | null): Recovery | null {
  try {
    const v = JSON.parse(raw || 'null');
    if (!v || typeof v.slug !== 'string' || !/^[a-z0-9-]+$/.test(v.slug) || typeof v.revision !== 'string' || typeof v.dirty !== 'boolean' || typeof v.uploading !== 'boolean') return null;
    const c = v.content;
    if (!c || typeof c.image !== 'string' || typeof c.video !== 'string' || !['ingredients', 'instructions'].every(k => Array.isArray(c[k]) && c[k].every((x: unknown) => typeof x === 'string'))) return null;
    return v;
  } catch { return null; }
}
