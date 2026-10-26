'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { upload } from '@vercel/blob/client';
import type { Content, Revision } from '@/lib/publisher/content';
export default function Publisher() {
  const [recipes,setRecipes]=useState<{slug:string;title:string}[]>([]);
  const [slug,setSlug]=useState('');
  const [content,setContent]=useState<Content>();
  const [revision,setRevision]=useState('');
  const [dirty,setDirty]=useState(false);
  const [preview,setPreview]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [deployment,setDeployment]=useState('');
  async function api(url:string,body?:unknown) {
    const r=await fetch(url,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,cache:'no-store'});
    const data=await r.json(); if(!r.ok) throw new Error(data.error || 'Request failed'); return data;
  }
  useEffect(()=>{api('/api/admin/publisher').then(d=>setRecipes(d.recipes)).catch(e=>setMessage(e.message));},[]);
  async function select(value:string) {
    if(dirty && !confirm('Discard unsaved changes?')) return;
    setBusy(true);setContent(undefined);setSlug(value);setMessage('');setPreview(false);
    try {const d=await api(`/api/admin/publisher?slug=${encodeURIComponent(value)}`);setContent(d.draft?.content || d.published?.content || d.initial);setRevision(d.draft?.revision || '');setDirty(false);}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}
  }
  function change(next:Content) {setContent(next);setDirty(true);setPreview(false);}
  async function act(action:string) {
    setBusy(true);setMessage('');
    try {const d=await api('/api/admin/publisher',{slug,action,content,revision});if(action==='draft'){setRevision((d as Revision).revision);setDirty(false);setMessage('Draft saved. Preview before publishing.');}else {setMessage('Published. Verify the production page below.');}}
    catch(e){setMessage((e as Error).message);}finally{setBusy(false);}
  }
  async function media(file:File,field:'image'|'video') {
    if(!content) return;
    setBusy(true);
    try {const ext=field==='video'?'mp4':({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type]);if(!ext)throw new Error('Choose JPG, PNG or WebP');
      const blob=await upload(`publisher/${slug}/${field==='video'?'video':'hero'}.${ext}`,file,{access:'public',handleUploadUrl:'/api/publisher/upload',multipart:field==='video',onUploadProgress:p=>setMessage(`Uploading ${Math.round(p.percentage)}%`)});
      change({...content,[field]:blob.url});setMessage('Uploaded. Save draft to keep this change.');
    }catch(e){setMessage((e as Error).message);}finally{setBusy(false);}
  }
  async function deploy(action:string) {
    setBusy(true);try {const d=await api('/api/admin/publisher/deploy', {action,slug,revision,deployment});if(d.deployment)setDeployment(d.deployment);setMessage(d.message);if(d.state==='READY'||d.state==='ERROR'||d.state==='CANCELED')setDeployment('');}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}
  }
  useEffect(()=>{if(!deployment)return;const timer=setInterval(()=>{api('/api/admin/publisher/deploy',{action:'status',slug,revision,deployment}).then(d=>{setMessage(d.message);if(['READY','ERROR','CANCELED'].includes(d.state))setDeployment('');}).catch(e=>{setMessage(e.message);setDeployment('');});},10000);return ()=>clearInterval(timer);},[deployment,slug,revision]);
  return <section className="mx-auto max-w-4xl space-y-5 p-6">
    <h1 className="text-3xl font-bold">Vegan Masala Recipe Publisher</h1>
    <p>Choose an existing recipe. Upload finished media, edit, save a draft, preview, then publish.</p>
    <label>Recipe <select disabled={busy} value={slug} onChange={e=>select(e.target.value)} className="w-full border p-3 text-black"><option value="">Choose recipe</option>{recipes.map(r=><option key={r.slug} value={r.slug}>{r.title}</option>)}</select></label>
    <p role="status" aria-live="polite">{message}</p>
    {content && <fieldset disabled={busy} className="space-y-5">
      {(['ingredients','instructions'] as const).map(field=><div key={field}><h2 className="text-xl font-bold capitalize">{field}</h2>{content[field].map((line,i)=><div className="flex gap-2 my-2" key={i}><textarea aria-label={`${field} ${i+1}`} className="w-full border p-2 text-black" value={line} onChange={e=>change({...content,[field]:content[field].map((s,j)=>j===i?e.target.value:s)})}/><button onClick={()=>change({...content,[field]:content[field].filter((_,j)=>j!==i)})}>Remove {i+1}</button></div>)}<button onClick={()=>change({...content,[field]:[...content[field],'']})}>Add {field==='ingredients'?'ingredient':'step'}</button></div>)}
      <label className="block">Replace hero image (JPG, PNG or WebP, up to 10 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>e.target.files?.[0]&&media(e.target.files[0],'image')}/></label>
      <label className="block">Replace finished video (MP4, up to 500 MB)<input type="file" accept="video/mp4" onChange={e=>e.target.files?.[0]&&media(e.target.files[0],'video')}/></label>
      <button onClick={()=>change({...content,video:''})}>Remove video</button>
      <div className="flex gap-5"><button onClick={()=>act('draft')}>Save draft</button><button onClick={()=>setPreview(true)}>Preview</button><button disabled={dirty||!revision||!preview} onClick={()=>act('publish')}>Publish saved draft</button></div>
      {dirty&&<p>Unsaved changes — save and preview before publishing.</p>}
      {preview&&<article className="border p-5 space-y-4"><h2 className="text-2xl">Draft preview</h2>{content.image&&<Image src={content.image} alt="Recipe hero preview" width={960} height={540} unoptimized className="max-h-80 w-auto object-contain"/>}{content.video&&<video controls preload="metadata" src={content.video} poster={content.image} className="w-full"/>}<h3>Ingredients</h3><ul>{content.ingredients.map((s,i)=><li key={i}>{s}</li>)}</ul><h3>Method</h3><ol>{content.instructions.map((s,i)=><li key={i}>{i+1}. {s}</li>)}</ol></article>}
      <p><a href={`/recipes/${slug}`} target="_blank" rel="noreferrer">Open recipe page</a></p>
      <div className="flex gap-5"><button onClick={()=>deploy('verify')}>Verify production content</button><button onClick={()=>deploy('trigger')}>Optional: rebuild on Vercel</button>{deployment&&<button onClick={()=>deploy('status')}>Check build status</button>}</div>
    </fieldset>}
  </section>;
}
