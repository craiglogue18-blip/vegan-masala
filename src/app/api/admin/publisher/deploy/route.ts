import { kv } from '@vercel/kv';
import { randomUUID } from 'node:crypto';
import { authorize } from '@/lib/publisher/auth';
import { configured, key, type Revision } from '@/lib/publisher/content';
import { getRecipeBySlug } from '@/lib/recipes';
export const dynamic = 'force-dynamic';
async function vercel(path: string, body?: unknown) {
  if (!process.env.PUBLISHER_VERCEL_TOKEN) throw new Error('Optional deployment integration is not configured');
  const url = new URL(`https://api.vercel.com${path}`);
  if (process.env.VERCEL_TEAM_ID) url.searchParams.set('teamId', process.env.VERCEL_TEAM_ID);
  const r=await fetch(url,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${process.env.PUBLISHER_VERCEL_TOKEN}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!r.ok) throw new Error('Vercel request failed. Check project access.');
  return r.json();
}
export async function POST(req: Request) {
  const denied=authorize(req,true); if(denied)return denied;
  if(!configured())return Response.json({error:'Storage not configured'},{status:503});
  try {
    const {action,slug,revision,deployment}=await req.json();
    if(typeof slug!=='string'||!getRecipeBySlug(slug))throw new Error('Unknown recipe');
    const published=await kv.get<Revision>(key(slug,'published'));
    if(!published || published.revision!==revision)throw new Error('Publish this saved revision first');
    if(action==='verify') {
      const origin=new URL(process.env.PUBLISHER_PRODUCTION_ORIGIN || 'https://www.vegan-masala.com');
      if(origin.protocol!=='https:')throw new Error('Configure an HTTPS production origin');
      const url=new URL(`/recipes/${slug}`,origin);
      url.searchParams.set('publisher-check',randomUUID());
      const r=await fetch(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
      const html=await r.text();
      if(!r.ok || !html.includes(`data-publisher-revision="${published.revision}"`))return Response.json({verified:false,url:`${origin.origin}/recipes/${slug}`,message:'Your update is saved, but the live website is not serving it yet. The website deployment or storage connection needs attention.'});
      return Response.json({verified:true,url:`${origin.origin}/recipes/${slug}`,message:`Your update is live at ${origin.origin}/recipes/${slug}.`});
    }
    if(action==='trigger') {
      if(!process.env.VERCEL_DEPLOYMENT_ID || !process.env.VERCEL_PROJECT_ID)throw new Error('Vercel project and deployment identifiers are required');
      const lock=await kv.set('publisher:deploy-lock','1',{nx:true,ex:120});
      if(!lock)return Response.json({error:'A rebuild was recently requested. Wait two minutes.'},{status:429});
      const d=await vercel('/v13/deployments',{name:process.env.PUBLISHER_VERCEL_PROJECT_NAME || 'vegan-masala',project:process.env.VERCEL_PROJECT_ID,deploymentId:process.env.VERCEL_DEPLOYMENT_ID,target:'production'});
      const id=randomUUID();await kv.set(`publisher:deployment:${id}`,{id:d.id,slug,revision},{ex:86400});
      return Response.json({deployment:id,message:'Rebuild requested. Checking status until completion; production content requires separate verification.'});
    }
    if(action==='status' && typeof deployment==='string' && /^[a-f0-9-]{36}$/.test(deployment)) {
      const record=await kv.get<{id:string;slug:string;revision:string}>(`publisher:deployment:${deployment}`);
      if(!record || record.slug!==slug || record.revision!==revision)throw new Error('Unknown deployment');
      const d=await vercel(`/v13/deployments/${encodeURIComponent(record.id)}`);
      const state=d.readyState || d.status;
      return Response.json({state,message:state==='READY'?'Build complete. Verify production content to confirm it is live.':`Build status: ${state}`});
    }
    throw new Error('Unknown action');
  }catch(e){return Response.json({error:(e as Error).message},{status:400});}
}
