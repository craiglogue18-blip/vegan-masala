import { authorize } from '@/lib/publisher/auth';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ENDPOINT = 'https://external.api.recraft.ai/v1/images/imageToImage';
const PROMPT = 'Create ONE photorealistic finished food photograph, not a collage. The LEFT reference shows the desired bowl, rice, naan, setting, lighting and camera angle. The RIGHT reference is the real cooked curry: reproduce its visible ingredients, colour, texture and shapes faithfully in the left-hand setting. Do not invent potatoes or any additional ingredients. Remove the reference sheet layout, labels and dividing line. No text or watermark.';

export async function POST(req: Request) {
  const denied = authorize(req, true);
  if (denied) return denied;
  if (!process.env.RECRAFT_API_TOKEN) return Response.json({error:'RECRAFT_API_TOKEN is not configured.'},{status:503});
  if (Number(req.headers.get('content-length') || 0) > 12_000_000) return Response.json({error:'Reference image is too large.'},{status:413});
  try {
    const form = await req.formData();
    if (form.get('confirmed') !== 'yes') return Response.json({error:'Confirm the paid single-image test before submitting.'},{status:400});
    const file = form.get('reference');
    if (!(file instanceof File) || !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10_000_000 || !file.size) return Response.json({error:'Upload a JPG, PNG or WebP combined reference (maximum 10 MB).'},{status:400});
    const input = Buffer.from(await file.arrayBuffer());
    const meta = await sharp(input).metadata();
    if (!meta.width || !meta.height || meta.width > 6000 || meta.height > 6000) return Response.json({error:'Unsupported image dimensions.'},{status:400});
    const png = await sharp(input).rotate().resize({width:2048,height:2048,fit:'inside',withoutEnlargement:true}).png().toBuffer();
    const payload = new FormData();
    payload.set('image',new Blob([new Uint8Array(png)],{type:'image/png'}),'combined-reference.png');
    payload.set('prompt',PROMPT);
    payload.set('strength','0.35');
    payload.set('model','recraftv3');
    const response = await fetch(ENDPOINT,{method:'POST',headers:{Authorization:`Bearer ${process.env.RECRAFT_API_TOKEN}`},body:payload,signal:AbortSignal.timeout(90000),cache:'no-store'});
    const result = await response.json().catch(()=>null);
    if (!response.ok) return Response.json({error:`Recraft rejected the request (HTTP ${response.status}).`,details:typeof result?.message==='string'?result.message:undefined},{status:502});
    const url = result?.data?.[0]?.url ?? result?.image?.url;
    if (typeof url !== 'string' || !url.startsWith('https://')) return Response.json({error:'Recraft returned no valid preview URL. Check API usage before retrying.'},{status:502});
    return Response.json({url,message:'One paid API request completed. The result is a temporary preview; the original hero has not changed.',usage:result?.usage ?? null},{headers:{'Cache-Control':'no-store'}});
  } catch(e) {
    return Response.json({error:e instanceof Error && e.name==='TimeoutError'?'Recraft timed out. Check API usage before trying again; the request may have been billed.':'Image processing failed. Check API usage before trying again; no automatic retry was made.'},{status:502});
  }
}
