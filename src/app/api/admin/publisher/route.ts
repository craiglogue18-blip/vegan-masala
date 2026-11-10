import { kv } from '@vercel/kv';
import { randomUUID } from 'node:crypto';
import { getAllRecipeSlugs, getRecipeBySlug } from '@/lib/recipes';
import { authorize } from '@/lib/publisher/auth';
import { configured, initialContent, key, validate, type Revision } from '@/lib/publisher/content';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const denied = authorize(req); if (denied) return denied;
  if (!configured()) return Response.json({error:'Connect persistent KV storage first'}, {status:503});
  const slug = new URL(req.url).searchParams.get('slug');
  if (!slug) {
    const slugs = getAllRecipeSlugs();
    const published = await Promise.all(slugs.map(slug=>kv.get<Revision>(key(slug,'published'))));
    return Response.json({recipes:slugs.map((slug,i)=>({slug,title:published[i]?.content.title || getRecipeBySlug(slug)?.title}))}, {headers:{'Cache-Control':'no-store'}});
  }
  if (!getRecipeBySlug(slug)) return Response.json({error:'Unknown recipe'}, {status:404});
  const [draft,published] = await Promise.all([kv.get<Revision>(key(slug,'draft')),kv.get<Revision>(key(slug,'published'))]);
  const initial = initialContent(slug);
  const withTitle = (item: Revision | null) => item ? { ...item, content: { ...item.content, title: item.content.title || initial.title } } : null;
  return Response.json({draft:withTitle(draft),published:withTitle(published),initial}, {headers:{'Cache-Control':'no-store'}});
}
export async function POST(req: Request) {
  const denied = authorize(req,true); if (denied) return denied;
  if (!configured()) return Response.json({error:'Connect persistent KV storage first'}, {status:503});
  if (Number(req.headers.get('content-length') || 0)>1000000) return Response.json({error:'Request too large'},{status:413});
  try {
    const {slug,action,content,revision} = await req.json();
    if (typeof slug !== 'string' || !getRecipeBySlug(slug)) return Response.json({error:'Unknown recipe'}, {status:404});
    if (action === 'draft') {
      const next: Revision = {revision:randomUUID(),content:validate(content,initialContent(slug)),updatedAt:new Date().toISOString()};
      // Compare and swap prevents two browser tabs overwriting each other's drafts.
      const ok = await kv.eval(`local old=redis.call('GET',KEYS[1]); if old then if cjson.decode(old).revision~=ARGV[1] then return 0 end elseif ARGV[1]~='' then return 0 end; redis.call('SET',KEYS[1],ARGV[2]); return 1`,[key(slug,'draft')],[revision || '',JSON.stringify(next)]);
      if (!ok) return Response.json({error:'Draft changed elsewhere. Reload before saving.'},{status:409});
      return Response.json(next);
    }
    if (action === 'publish') {
      const ok = await kv.eval(`local d=redis.call('GET',KEYS[1]); if not d or cjson.decode(d).revision~=ARGV[1] then return 0 end; redis.call('SET',KEYS[2],d); return 1`,[key(slug,'draft'),key(slug,'published')],[revision || '']);
      return ok ? Response.json({ok:true,url:`/recipes/${slug}`}) : Response.json({error:'Save and reload the latest draft before publishing'},{status:409});
    }
    return Response.json({error:'Unknown action'}, {status:400});
  } catch { return Response.json({error:'Unable to save. Check content and storage configuration.'},{status:400}); }
}
