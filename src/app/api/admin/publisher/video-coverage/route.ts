import { kv } from '@vercel/kv';
import { authorize } from '@/lib/publisher/auth';
import { configured, key, type Revision } from '@/lib/publisher/content';
import { getAllRecipes } from '@/lib/recipes';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const denied=authorize(req);if(denied)return denied;
  if(!configured())return Response.json({error:'Persistent KV storage is not configured; published video coverage cannot be verified.'},{status:503});
  try {
    const recipes=getAllRecipes();
    const published=await Promise.all(recipes.map(r=>kv.get<Revision>(key(r.slug,'published'))));
    const rows=recipes.map((recipe,i)=>{
      const revision=published[i];
      const video=(revision ? revision.content.video : recipe.video || '').trim();
      return {slug:recipe.slug,title:revision?.content.title||recipe.title,hasVideo:video.length>0,source:revision?'published update':'recipe file'};
    }).sort((a,b)=>a.title.localeCompare(b.title));
    const withVideos=rows.filter(row=>row.hasVideo).length;
    return Response.json({total:rows.length,withVideos,withoutVideos:rows.length-withVideos,recipes:rows,checkedAt:new Date().toISOString()},{headers:{'Cache-Control':'private, no-store'}});
  }catch{return Response.json({error:'Unable to read published recipe data. No partial counts are shown.'},{status:503});}
}
