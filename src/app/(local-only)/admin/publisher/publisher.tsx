'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, Check, CheckCircle2, ChevronRight, CloudUpload, Eye, Film, ImagePlus, Leaf, ListChecks, Plus, Rocket, Save, ShieldCheck, Trash2, Utensils } from 'lucide-react';
import styles from './publisher.module.css';
import { upload } from '@vercel/blob/client';
import type { Content, Revision } from '@/lib/publisher/content';
export default function Publisher() {
  const [activeTab,setActiveTab]=useState<'media'|'ingredients'|'instructions'>('media');
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
              <div className={styles.mediaCard}><div className={styles.mediaVisual}>{content.image?<Image src={content.image} alt={`${title} current hero`} width={720} height={480} unoptimized/>:<div className={styles.mediaPlaceholder}><ImagePlus size={36}/><span>Your dish takes centre stage</span></div>}<span className={styles.mediaTag}><ImagePlus size={12}/> HERO IMAGE</span></div><div className={styles.mediaDetails}><h4>The cover photo</h4><p>The main image on your recipe page.</p><label className={styles.uploadButton}><ImagePlus size={16}/>{content.image?'Change photo':'Add a photo'}<input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload hero image" onChange={e=>e.target.files?.[0]&&media(e.target.files[0],'image')}/></label><small>JPG, PNG or WebP · up to 10 MB</small></div></div>
              <div className={styles.mediaCard}><div className={styles.mediaVisual}>{content.video?<video controls preload="metadata" src={content.video} poster={content.image||undefined} aria-label="Current recipe video"/>:<div className={styles.mediaPlaceholder}><Film size={36}/><span>A front-row seat in your kitchen</span><small>No video added yet</small></div>}<span className={styles.mediaTag}><Film size={12}/> COOKING VIDEO</span></div><div className={styles.mediaDetails}><div className={styles.mediaTitle}><h4>{content.video?'The cooking video':'Bring the recipe to life'}</h4>{content.video&&<button className={styles.iconButton} aria-label="Remove recipe video" onClick={()=>change({...content,video:''})}><Trash2 size={15}/></button>}</div><p>{content.video?'Your full cooking video, ready to watch.':'Add your finished video to this recipe page.'}</p><label className={styles.uploadButton}><CloudUpload size={16}/>{content.video?'Replace video':'Upload video'}<input type="file" accept="video/mp4" aria-label="Upload finished cooking video" onChange={e=>e.target.files?.[0]&&media(e.target.files[0],'video')}/></label><small>Finished MP4 · up to 500 MB</small></div></div>
            </div><div className={styles.tip}><Leaf size={18}/><p>Already happy with the recipe? You can add just a video and leave everything else as it is.</p></div>
          </>:<>
            <div className={styles.sectionIntro}><div><h3>{activeTab==='ingredients'?'Every ingredient, just right':'A method that’s easy to follow'}</h3><p>{activeTab==='ingredients'?'Include the quantity, ingredient and any preparation notes.':'Keep each cooking step clear and in the order your readers need.'}</p></div><span className={styles.count}>{content[activeTab].length} {activeTab==='ingredients'?'ingredients':'steps'}</span></div>
            <div className={styles.rows}>{content[activeTab].map((line,i)=><div className={styles.editRow} key={i}><span className={styles.rowNumber}>{String(i+1).padStart(2,'0')}</span><textarea rows={activeTab==='instructions'?3:1} aria-label={`${activeTab} ${i+1}`} value={line} placeholder={activeTab==='ingredients'?'e.g. 1 tsp ground cumin':'Describe this cooking step…'} onChange={e=>change({...content,[activeTab]:content[activeTab].map((s,j)=>j===i?e.target.value:s)})}/><button className={styles.iconButton} aria-label={`Remove ${activeTab==='ingredients'?'ingredient':'step'} ${i+1}`} onClick={()=>change({...content,[activeTab]:content[activeTab].filter((_,j)=>j!==i)})}><Trash2 size={16}/></button></div>)}</div><button className={styles.addButton} onClick={()=>change({...content,[activeTab]:[...content[activeTab],'']})}><Plus size={16}/>Add {activeTab==='ingredients'?'ingredient':'step'}</button>
          </>}
        </fieldset>
        <footer className={styles.editorFooter}><span><ShieldCheck size={14}/>Changes stay private until you publish.</span>{!preview&&<button disabled={busy} onClick={()=>setPreview(true)}>Preview recipe <ChevronRight size={15}/></button>}</footer>
      </div>
      <aside className={styles.sidebar}>
        <div className={styles.publishCard}><div className={styles.publishIcon}><Rocket size={22}/></div><p className={styles.eyebrow}>FROM YOUR KITCHEN TO THE WORLD</p><h3>Ready when you are.</h3><p className={styles.sidebarCopy}>Save your changes, take a final look, then share the update with your readers.</p><ol className={styles.checklist}><li><span className={revision&&!dirty?styles.done:''}>{revision&&!dirty?<Check size={12}/>:1}</span><div>Save your draft<small>{dirty?'You have unsaved changes':revision?'Your draft is saved':'Keep your changes private'}</small></div></li><li><span className={preview?styles.done:''}>{preview?<Check size={12}/>:2}</span><div>Take a final look<small>Check your recipe in Preview</small></div></li><li><span>3</span><div>Publish your update<small>Available on the recipe page</small></div></li></ol><button className={styles.saveButton} disabled={busy} onClick={()=>act('draft')}><Save size={16}/>{busy?'Working…':'Save draft'}</button><button className={styles.publishButton} disabled={busy||dirty||!revision||!preview} onClick={()=>act('publish')}><Rocket size={16}/>Publish update</button><p className={styles.publishHint}>{dirty?'Save your changes before publishing.':!revision?'Save a draft to get started.':!preview?'Preview your draft to enable publishing.':'Your saved draft is ready to publish.'}</p></div>
        <div className={styles.productionCard}><h4><CheckCircle2 size={17}/>Check it’s live</h4><p>Confirm your published update appears on your website.</p><button disabled={busy} onClick={()=>deploy('verify')}>Verify production page <ArrowUpRight size={14}/></button><details><summary>Deployment options</summary><p>Content updates usually appear without rebuilding the website.</p><button disabled={busy} onClick={()=>deploy('trigger')}>Rebuild on Vercel</button>{deployment&&<button disabled={busy} onClick={()=>deploy('status')}>Check build status</button>}</details></div>
      </aside>
    </div>}
  </section>;
}
