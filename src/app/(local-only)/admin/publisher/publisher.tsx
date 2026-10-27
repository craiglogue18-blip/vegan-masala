'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, Check, CheckCircle2, ChevronRight, CloudUpload, Eye, Film, ImagePlus, Leaf, ListChecks, Plus, Rocket, Save, ShieldCheck, Trash2, Utensils } from 'lucide-react';
import { checkUpload, formatBytes, VIDEO_LIMIT_LABEL } from '@/lib/publisher/uploads';
import { RECOVERY_KEY, readRecovery, type Recovery } from '@/lib/publisher/recovery';
import styles from './publisher.module.css';
import { upload } from '@vercel/blob/client';
import type { Content, Revision } from '@/lib/publisher/content';
export default function Publisher() {
  const [activeTab,setActiveTab]=useState<'media'|'ingredients'|'instructions'>('media');
  const uploadController=useRef<AbortController|null>(null);
  const [transfer,setTransfer]=useState<{name:string;size:number;loaded:number;percentage:number;phase:string}|null>(null);
  const [recipes,setRecipes]=useState<{slug:string;title:string}[]>([]);
  const [slug,setSlug]=useState('');
  const [content,setContent]=useState<Content>();
  const [revision,setRevision]=useState('');
  const [dirty,setDirty]=useState(false);
  const [preview,setPreview]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [deployment,setDeployment]=useState('');
  const [publication,setPublication]=useState<{state:string;message:string;url?:string}|null>(null);
  async function api(url:string,body?:unknown) {
    const r=await fetch(url,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,cache:'no-store',signal:AbortSignal.timeout(20000)});
    const text=await r.text(); let data; try { data=JSON.parse(text); } catch {throw new Error(`The server returned an unexpected response (${r.status}). Your edits are kept in this tab. Try again.`);}
    if(!r.ok) throw new Error(data.error || `Request failed (${r.status}). Your edits are kept in this tab.`); return data;
  }
  useEffect(()=>{
    let cancelled=false;
    const restore=async()=>{
      try {
        const list=await api('/api/admin/publisher'); if(cancelled)return;setRecipes(list.recipes);
        let saved:Recovery|null=null;try{saved=readRecovery(sessionStorage.getItem(RECOVERY_KEY));}catch{}
        if(!saved || !list.recipes.some((r:{slug:string})=>r.slug===saved!.slug))return;
        setBusy(true);setSlug(saved.slug);
        const d=await api(`/api/admin/publisher?slug=${encodeURIComponent(saved.slug)}`);if(cancelled)return;
        if(saved.dirty){setContent(saved.content);setRevision(saved.revision);setDirty(true);setMessage((d.draft?.revision||'')!==saved.revision?'Your local edits were recovered, but the saved draft changed elsewhere. Reload the saved draft before combining changes.':'Your unsaved edits were recovered. Save the draft when ready.');}
        else{setContent(d.draft?.content||d.published?.content||d.initial);setRevision(d.draft?.revision||'');setDirty(false);if(d.published?.revision&&d.published.revision===d.draft?.revision)setPublication({state:'pending',message:'Published update found. Checking the live website automatically…'});}
        if(saved.uploading)setMessage('The previous upload was interrupted. Your recipe draft is safe. Choose the video again to retry.');
      }catch(e){if(!cancelled)setMessage((e as Error).message);}finally{if(!cancelled)setBusy(false);}
    };void restore();return ()=>{cancelled=true;};
  },[]);
  useEffect(()=>{if(content&&slug){try{sessionStorage.setItem(RECOVERY_KEY,JSON.stringify({slug,content,revision,dirty,uploading:!!transfer&&['uploading','saving'].includes(transfer.phase)}));}catch{}}},[slug,content,revision,dirty,transfer]);
  useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(dirty||uploadController.current){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return ()=>window.removeEventListener('beforeunload',warn);},[dirty]);
  async function select(value:string) {
    if(dirty && !confirm('Discard unsaved changes?')) return;
    if(!value){setContent(undefined);setSlug('');setDirty(false);try{sessionStorage.removeItem(RECOVERY_KEY);}catch{}return;}
    setBusy(true);setContent(undefined);setSlug(value);setMessage('');setPreview(false);setTransfer(null);setPublication(null);
    try {const d=await api(`/api/admin/publisher?slug=${encodeURIComponent(value)}`);setContent(d.draft?.content || d.published?.content || d.initial);setRevision(d.draft?.revision || '');setDirty(false);if(d.published?.revision&&d.published.revision===d.draft?.revision)setPublication({state:'pending',message:'Published update found. Checking the live website automatically…'});}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}
  }
  function change(next:Content) {setContent(next);setDirty(true);setPreview(false);setPublication(null);}
  async function act(action:string) {
    setBusy(true);setMessage('');
    if(action==='publish')setPublication({state:'publishing',message:'Saving this revision as the published update…'});
    try {const d=await api('/api/admin/publisher',{slug,action,content,revision});if(action==='draft'){setPublication(null);setRevision((d as Revision).revision);setDirty(false);setMessage('Draft saved. Preview before publishing.');}else {
      setPublication({state:'checking',message:'Your publication is saved. Checking the live website…'});
      setMessage('Your publication is saved. Checking the live website…');
      try{const verified=await api('/api/admin/publisher/deploy',{action:'verify',slug,revision});setPublication({state:verified.verified?'live':'pending',message:verified.message,url:verified.url});setMessage(verified.message);}catch{const message='Your publication is saved, but the live website could not be verified. Check the production page before assuming it is live.';setPublication({state:'pending',message});setMessage(message);}
    }}
    catch(e){setMessage((e as Error).message);if(action==='publish')setPublication({state:'error',message:`Publishing could not be completed: ${(e as Error).message}`});}finally{setBusy(false);}
  }
  async function media(file:File,field:'image'|'video') {
    if(!content||uploadController.current) return;
    let descriptor;
    try{descriptor=checkUpload(file,field);}catch(e){setMessage((e as Error).message);return;}
    let uploaded=false;
    const controller=new AbortController();uploadController.current=controller;
    setBusy(true);setMessage('Saving your recipe before starting the upload…');
    setTransfer({name:file.name,size:file.size,loaded:0,percentage:0,phase:'uploading'});
    try {
      await api('/api/publisher/upload');
      const saved=await api('/api/admin/publisher',{slug,action:'draft',content,revision});setRevision(saved.revision);setDirty(false);
      if(controller.signal.aborted)throw new Error('Upload cancelled. Your saved recipe is safe.');
      setMessage('Uploading directly to media storage. Keep this tab open.');
      const blob=await upload(`publisher/${slug}/${field==='video'?'video':'hero'}.${descriptor.ext}`,file,{access:'public',contentType:descriptor.contentType,handleUploadUrl:'/api/publisher/upload',multipart:field==='video',abortSignal:controller.signal,onUploadProgress:p=>setTransfer({name:file.name,size:file.size,loaded:p.loaded,percentage:p.percentage,phase:'uploading'})});
      uploaded=true;
      const next={...content,[field]:blob.url};
      // Persist the completed URL immediately, before awaiting the server-side draft save.
      try{sessionStorage.setItem(RECOVERY_KEY,JSON.stringify({slug,content:next,revision:saved.revision,dirty:true,uploading:false}));}catch{}
      setContent(next);setDirty(true);setPreview(false);setTransfer({name:file.name,size:file.size,loaded:file.size,percentage:100,phase:'saving'});setMessage('Upload complete. Saving the media to your private draft…');
      const updated=await api('/api/admin/publisher',{slug,action:'draft',content:next,revision:saved.revision});setRevision(updated.revision);setDirty(false);
      setTransfer({name:file.name,size:file.size,loaded:file.size,percentage:100,phase:'done'});setMessage('Upload complete and draft saved. Preview it before publishing.');
    }catch(e){setTransfer(t=>t?{...t,phase:uploaded?'save-failed':controller.signal.aborted?'cancelled':'failed'}:null);setMessage(uploaded?`The file uploaded, but saving the draft failed: ${(e as Error).message} Use Save draft to retry without uploading again.`:controller.signal.aborted?'Upload cancelled. Your recipe draft is safe.':`${(e as Error).message} Your edits are kept. You can select the file again to retry.`);}finally{uploadController.current=null;setBusy(false);}
  }
  async function reloadSaved() {
    if(dirty&&!confirm('Discard local edits and load the saved draft?'))return;
    setBusy(true);
    try{const d=await api(`/api/admin/publisher?slug=${encodeURIComponent(slug)}`);setContent(d.draft?.content||d.published?.content||d.initial);setRevision(d.draft?.revision||'');setDirty(false);setPreview(false);setTransfer(null);setPublication(null);setMessage('Loaded the latest saved draft.');}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}
  }
  async function deploy(action:string) {
    setBusy(true);try {const d=await api('/api/admin/publisher/deploy', {action,slug,revision,deployment});if(d.deployment)setDeployment(d.deployment);setMessage(d.message);if(action==='verify')setPublication({state:d.verified?'live':'pending',message:d.message,url:d.url});if(d.state==='READY'||d.state==='ERROR'||d.state==='CANCELED')setDeployment('');}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}
  }
  useEffect(()=>{if(!deployment)return;const timer=setInterval(()=>{api('/api/admin/publisher/deploy',{action:'status',slug,revision,deployment}).then(d=>{setMessage(d.message);if(['READY','ERROR','CANCELED'].includes(d.state))setDeployment('');}).catch(e=>{setMessage(e.message);setDeployment('');});},10000);return ()=>clearInterval(timer);},[deployment,slug,revision]);
  useEffect(()=>{
    if(publication?.state!=='pending')return;
    let cancelled=false;let running=false;const deadline=Date.now()+5*60*1000;
    const check=async()=>{
      if(running)return;running=true;
      try{const d=await api('/api/admin/publisher/deploy',{action:'verify',slug,revision});if(cancelled)return;if(d.verified){setPublication({state:'live',message:d.message,url:d.url});setMessage(d.message);}else if(Date.now()>=deadline){setPublication({state:'timeout',message:'Your update is saved, but the live page is not ready after five minutes. Use Verify production page to check again, or check the deployment.',url:d.url});}}
      catch{if(!cancelled&&Date.now()>=deadline)setPublication({state:'timeout',message:'Your update is saved. The live check could not finish; use Verify production page to retry.'});}
      finally{running=false;}
    };
    void check();const timer=setInterval(()=>void check(),10000);return()=>{cancelled=true;clearInterval(timer);};
  },[publication?.state,slug,revision]);
  const title=recipes.find(r=>r.slug===slug)?.title || 'Your next recipe update';
  const tabs=[{id:'media',label:'Photos & video',icon:Film,count:undefined},{id:'ingredients',label:'Ingredients',icon:Utensils,count:content?.ingredients.length},{id:'instructions',label:'Method',icon:ListChecks,count:content?.instructions.length}] as const;
  return <section className={styles.publisher}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}><Leaf size={14}/> VEGAN MASALA · YOUR RECIPE DESK</p><h1>Recipe Publisher<span>.</span></h1><p className={styles.subtitle}>A little polish. A fresh video. Ready for your readers.</p></div>
      <span className={styles.secure}><ShieldCheck size={15}/> Private workspace</span>
    </header>
    <div className={styles.selectorCard}>
      <div className={styles.selectorIcon}><Utensils size={22}/></div>
      <div className={styles.selectorField}><label htmlFor="publisher-recipe">Which recipe are we working on?</label><select id="publisher-recipe" disabled={busy} value={slug} onChange={e=>select(e.target.value)}><option value="">Choose a recipe from your collection</option>{recipes.map(r=><option key={r.slug} value={r.slug}>{r.title}</option>)}</select></div>
      {content&&<a className={styles.pageLink} href={`/recipes/${slug}`} target="_blank" rel="noreferrer">View recipe <ArrowUpRight size={16}/></a>}
    </div>
    {transfer&&<div className={styles.transfer} role="status" aria-live="polite"><div><strong>{transfer.phase==='done'?'Upload saved':transfer.phase==='saving'?'Saving uploaded media':['failed','save-failed'].includes(transfer.phase)?'Upload needs attention':transfer.phase==='cancelled'?'Upload cancelled':'Uploading media'}</strong><span>{transfer.name}</span></div><progress aria-label="Upload progress" max={100} value={transfer.percentage}/><small>{formatBytes(transfer.loaded)} of {formatBytes(transfer.size)} · {Math.round(transfer.percentage)}%</small>{transfer.phase==='uploading'&&<button onClick={()=>uploadController.current?.abort()}>Cancel upload</button>}</div>}
    {message&&<div className={styles.notice} role="status" aria-live="polite"><CheckCircle2 size={18}/><span>{message}</span></div>}
    {!content&&<div className={styles.empty}><div className={styles.emptyIcon}><Leaf size={32}/></div><h2>{busy?'Opening your recipe…':'Good food deserves a great page.'}</h2><p>Choose a recipe above to update its photos, add a cooking video,<br/>or make the ingredients and method just right.</p><div className={styles.emptySteps}><span>01 Choose</span><ChevronRight size={15}/><span>02 Make it yours</span><ChevronRight size={15}/><span>03 Publish</span></div></div>}
    {content&&<div className={styles.workspace}>
      <div className={styles.editor}>
        <div className={styles.recipeHeading}><div><p className={styles.eyebrow}>EDITING RECIPE</p><h2>{title}</h2></div><span className={`${styles.badge} ${dirty?styles.unsaved:''}`}>{dirty?'Unsaved changes':revision?'Saved draft':'Ready to edit'}</span></div>
        <nav className={styles.tabs} aria-label="Recipe editor sections">{tabs.map(t=><button key={t.id} disabled={busy} aria-current={!preview&&activeTab===t.id?'page':undefined} onClick={()=>{setActiveTab(t.id);setPreview(false);}}><t.icon size={16}/>{t.label}{t.count!==undefined&&<span>{t.count}</span>}</button>)}<button disabled={busy} aria-current={preview?'page':undefined} onClick={()=>setPreview(true)}><Eye size={16}/>Preview</button></nav>
        <fieldset disabled={busy} className={styles.editorBody}>
          {preview?<article className={styles.preview}><div className={styles.sectionIntro}><div><p className={styles.eyebrow}>BEFORE YOU PUBLISH</p><h3>Your recipe, at a glance</h3><p>Review the content and media for your recipe page.</p></div><span className={styles.badge}>Draft preview</span></div>{content.image&&<Image src={content.image} alt={`${title} hero preview`} width={960} height={540} unoptimized className={styles.previewHero}/>}<h2>{title}</h2>{content.video&&<video controls preload="metadata" src={content.video} poster={content.image} className={styles.video}/>}<h3>Ingredients</h3><ul>{content.ingredients.map((s,i)=><li key={i}>{s}</li>)}</ul><h3>Method</h3><ol>{content.instructions.map((s,i)=><li key={i}><span>{String(i+1).padStart(2,'0')}</span><p>{s}</p></li>)}</ol></article>:activeTab==='media'?<>
            <div className={styles.sectionIntro}><div><h3>Make it look delicious</h3><p>Choose the first impression. Then show how it’s made.</p></div></div>
            <div className={styles.mediaGrid}>
              <div className={styles.mediaCard}><div className={styles.mediaVisual}>{content.image?<Image src={content.image} alt={`${title} current hero`} width={720} height={480} unoptimized/>:<div className={styles.mediaPlaceholder}><ImagePlus size={36}/><span>Your dish takes centre stage</span></div>}<span className={styles.mediaTag}><ImagePlus size={12}/> HERO IMAGE</span></div><div className={styles.mediaDetails}><h4>The cover photo</h4><p>The main image on your recipe page.</p><label className={styles.uploadButton}><ImagePlus size={16}/>{content.image?'Change photo':'Add a photo'}<input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload hero image" onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';if(file)void media(file,'image');}}/></label><small>JPG, PNG or WebP · up to 10 MB</small></div></div>
              <div className={styles.mediaCard}><div className={styles.mediaVisual}>{content.video?<video controls preload="metadata" src={content.video} poster={content.image||undefined} aria-label="Current recipe video"/>:<div className={styles.mediaPlaceholder}><Film size={36}/><span>A front-row seat in your kitchen</span><small>No video added yet</small></div>}<span className={styles.mediaTag}><Film size={12}/> COOKING VIDEO</span></div><div className={styles.mediaDetails}><div className={styles.mediaTitle}><h4>{content.video?'The cooking video':'Bring the recipe to life'}</h4>{content.video&&<button className={styles.iconButton} aria-label="Remove recipe video" onClick={()=>change({...content,video:''})}><Trash2 size={15}/></button>}</div><p>{content.video?'Your full cooking video, ready to watch.':'Add your finished video to this recipe page.'}</p><label className={styles.uploadButton}><CloudUpload size={16}/>{content.video?'Replace video':'Upload video'}<input type="file" accept="video/mp4,.mp4" aria-label="Upload finished cooking video" onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';if(file)void media(file,'video');}}/></label><small>Finished MP4 · up to {VIDEO_LIMIT_LABEL}</small></div></div>
            </div><div className={styles.tip}><Leaf size={18}/><p>Already happy with the recipe? You can add just a video and leave everything else as it is.</p></div>
          </>:<>
            <div className={styles.sectionIntro}><div><h3>{activeTab==='ingredients'?'Every ingredient, just right':'A method that’s easy to follow'}</h3><p>{activeTab==='ingredients'?'Include the quantity, ingredient and any preparation notes.':'Keep each cooking step clear and in the order your readers need.'}</p></div><span className={styles.count}>{content[activeTab].length} {activeTab==='ingredients'?'ingredients':'steps'}</span></div>
            <div className={styles.rows}>{content[activeTab].map((line,i)=><div className={styles.editRow} key={i}><span className={styles.rowNumber}>{String(i+1).padStart(2,'0')}</span><textarea rows={activeTab==='instructions'?3:1} aria-label={`${activeTab} ${i+1}`} value={line} placeholder={activeTab==='ingredients'?'e.g. 1 tsp ground cumin':'Describe this cooking step…'} onChange={e=>change({...content,[activeTab]:content[activeTab].map((s,j)=>j===i?e.target.value:s)})}/><button className={styles.iconButton} aria-label={`Remove ${activeTab==='ingredients'?'ingredient':'step'} ${i+1}`} onClick={()=>change({...content,[activeTab]:content[activeTab].filter((_,j)=>j!==i)})}><Trash2 size={16}/></button></div>)}</div><button className={styles.addButton} onClick={()=>change({...content,[activeTab]:[...content[activeTab],'']})}><Plus size={16}/>Add {activeTab==='ingredients'?'ingredient':'step'}</button>
          </>}
        </fieldset>
        <footer className={styles.editorFooter}><span><ShieldCheck size={14}/>Changes stay private until you publish.</span>{!preview&&<button disabled={busy} onClick={()=>setPreview(true)}>Preview recipe <ChevronRight size={15}/></button>}</footer>
      </div>
      <aside className={styles.sidebar}>
        <div className={styles.publishCard}><div className={styles.publishIcon}><Rocket size={22}/></div><p className={styles.eyebrow}>FROM YOUR KITCHEN TO THE WORLD</p><h3>Ready when you are.</h3><p className={styles.sidebarCopy}>Save your changes, take a final look, then share the update with your readers.</p><ol className={styles.checklist}><li><span className={revision&&!dirty?styles.done:''}>{revision&&!dirty?<Check size={12}/>:1}</span><div>Save your draft<small>{dirty?'You have unsaved changes':revision?'Your draft is saved':'Keep your changes private'}</small></div></li><li><span className={preview?styles.done:''}>{preview?<Check size={12}/>:2}</span><div>Take a final look<small>Check your recipe in Preview</small></div></li><li><span>3</span><div>Publish your update<small>Available on the recipe page</small></div></li></ol>{publication&&<div className={styles.publication} role="status" aria-live="polite"><strong>{publication.state==='live'?'Live and ready to view':publication.state==='publishing'?'Publishing your update…':publication.state==='checking'||publication.state==='pending'?'Checking the live website…':publication.state==='error'?'Publishing needs attention':'Saved · verification needs attention'}</strong><ol className={styles.publishSteps}><li data-complete={publication.state!=='publishing'&&publication.state!=='error'}><span>{publication.state!=='publishing'&&publication.state!=='error'?<Check size={12}/>:1}</span>Save published update</li><li data-complete={publication.state==='live'}><span>{publication.state==='live'?<Check size={12}/>:2}</span>Verify live recipe</li><li data-complete={publication.state==='live'}><span>{publication.state==='live'?<Check size={12}/>:3}</span>Ready for your readers</li></ol><p>{publication.message}</p>{publication.state==='pending'&&<small>Checking automatically every 10 seconds.</small>}{publication.state==='live'&&publication.url&&<a className={styles.liveLink} href={publication.url} target="_blank" rel="noreferrer">View live recipe <ArrowUpRight size={15}/></a>}</div>}<button className={styles.saveButton} disabled={busy} onClick={()=>act('draft')}><Save size={16}/>{busy?'Working…':'Save draft'}</button><button className={styles.publishButton} disabled={busy||dirty||!revision||!preview} onClick={()=>act('publish')}><Rocket size={16}/>{busy&&publication?.state==='publishing'?'Publishing…':busy&&publication?.state==='checking'?'Checking live page…':'Publish update'}</button><p className={styles.publishHint}>{dirty?'Save your changes before publishing.':!revision?'Save a draft to get started.':!preview?'Preview your draft to enable publishing.':'Your saved draft is ready to publish.'}</p><button className={styles.reloadButton} disabled={busy} onClick={()=>void reloadSaved()}>Load saved draft</button></div>
        <div className={styles.productionCard}><h4><CheckCircle2 size={17}/>Check it’s live</h4><p>Confirm your published update appears on your website.</p><button disabled={busy} onClick={()=>deploy('verify')}>Verify production page <ArrowUpRight size={14}/></button><details><summary>Deployment options</summary><p>Content updates usually appear without rebuilding the website.</p><button disabled={busy} onClick={()=>deploy('trigger')}>Rebuild on Vercel</button>{deployment&&<button disabled={busy} onClick={()=>deploy('status')}>Check build status</button>}</details></div>
      </aside>
    </div>}
  </section>;
}
