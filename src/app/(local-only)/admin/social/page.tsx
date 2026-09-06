"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type QueueItem = {
  id: string;
  title?: string;
  slug: string;
  platform: string;
  scheduledFor: string;
  status: "queued" | "posted" | "failed";
  retryable?: boolean;
  error?: string;
};

type PlatformHealth = {
  youtube?: { configured: boolean; privacyStatus: string };
  tiktok?: { configured: boolean; directPostEnabled: boolean; privacyLevel: string };
};

type MetaHealth = {
  instagramConfigured?: boolean;
  facebookConfigured?: boolean;
};

type ToolCard = {
  title:string;
  href:string;
  description:string;
  cta:string;
};

const tools:ToolCard[]=[

{
title:"Recipe Importer",

href:"/admin/import",

description:
"Import and prepare new recipes for the website, including the source content and recipe details.",

cta:"Open recipe importer"
},

{
title:"Recipe Pipeline",

href:"/admin/pipeline",

description:
"Run the recipe production workflow and move new content through the generation pipeline.",

cta:"Open recipe pipeline"
},

{
title:"Growth Dashboard",

href:"/admin/growth",

description:
"Track audience, search, email, affiliate and social growth from one combined dashboard.",

cta:"Open growth dashboard"
},

{
title:"Health Dashboard",

href:"/admin/social/health",

description:
"Inspect queue status, platform readiness, recent failures and publishing activity without exposing tokens or secrets.",

cta:"Open health dashboard"
},

{
title:"Content Generator",

href:"/admin/social/generate",

description:
"Generate Instagram posts and Pinterest pins for single slugs, latest content, or your full recipe library.",

cta:"Open generator"
},

{
title:"Queue Manager",

href:"/admin/social/queue",

description:
"Schedule posts, build your 30 day publishing queue, run due posts and manage failures.",

cta:"Open queue"
},

{
title:"Social Automation",

href:"/admin/social/automation",

description:
"Generate assets and prepare coordinated Pinterest, Instagram and Facebook posts in one workflow.",

cta:"Open automation"
},

{
title:"Video Generator",

href:"/admin/social/video",

description:
"Generate branded short-form recipe videos with intro, outro, music and animation.",

cta:"Open video tools"
},

{
title:"SEO Health",

href:"/admin/seo/health",

description:
"Monitor recipe, guide, hub and sitemap SEO structure health using local repository data.",

cta:"Open SEO health"
},

{
title:"App Recipe Health",

href:"/admin/app/health",

description:
"Find recipe data that could weaken meal planning, shopping quantities, cooking mode or future step videos.",

cta:"Open app health"
}

];

export default function AdminSocialHubPage(){

const [queueItems,setQueueItems]=useState<QueueItem[]>([]);
const [platformHealth,setPlatformHealth]=useState<PlatformHealth>({});
const [metaHealth,setMetaHealth]=useState<MetaHealth>({});
const [pinterestConnected,setPinterestConnected]=useState<boolean|null>(null);
const [statusLoading,setStatusLoading]=useState(true);

useEffect(()=>{
  let active=true;
  async function loadStatus(){
    try{
      const [queueRes,platformRes,metaRes,pinterestRes]=await Promise.all([
        fetch("/api/admin/social/queue",{cache:"no-store"}),
        fetch("/api/admin/social/platform-health",{cache:"no-store"}),
        fetch("/api/admin/social/meta-health",{cache:"no-store"}),
        fetch("/api/pinterest/boards",{cache:"no-store"}),
      ]);
      const [queueData,platformData,metaData,pinterestData]=await Promise.all([
        queueRes.json().catch(()=>({})),
        platformRes.json().catch(()=>({})),
        metaRes.json().catch(()=>({})),
        pinterestRes.json().catch(()=>({})),
      ]);
      if(!active)return;
      setQueueItems(Array.isArray(queueData?.items)?queueData.items:[]);
      setPlatformHealth(platformData?.ok?platformData:{});
      setMetaHealth(metaData||{});
      setPinterestConnected(Boolean(pinterestData?.ok));
    }finally{
      if(active)setStatusLoading(false);
    }
  }
  void loadStatus();
  return()=>{active=false;};
},[]);

const queuedItems=useMemo(()=>queueItems.filter(item=>item.status==="queued"),[queueItems]);
const retryingItems=useMemo(()=>queuedItems.filter(item=>item.retryable&&item.error),[queuedItems]);
const failedItems=useMemo(()=>queueItems.filter(item=>item.status==="failed"),[queueItems]);
const nextPost=useMemo(()=>[...queuedItems].sort((a,b)=>new Date(a.scheduledFor).getTime()-new Date(b.scheduledFor).getTime())[0]||null,[queuedItems]);
const warnings=useMemo(()=>{
  const items:string[]=[];
  if(metaHealth.instagramConfigured===false)items.push("Instagram is not configured");
  if(metaHealth.facebookConfigured===false)items.push("Facebook is not configured");
  if(pinterestConnected===false)items.push("Pinterest is not connected");
  if(platformHealth.youtube?.configured===false)items.push("YouTube is not connected");
  if(platformHealth.youtube?.privacyStatus==="private")items.push("YouTube uploads are set to private");
  if(platformHealth.tiktok?.configured===false)items.push("TikTok publishing is not fully configured");
  else if(platformHealth.tiktok?.privacyLevel==="SELF_ONLY")items.push("TikTok posts are private-only while approval is pending");
  return items;
},[metaHealth,pinterestConnected,platformHealth]);

return(

<main className="mx-auto max-w-7xl px-6 py-10">

<section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8">

<div className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-gold)]/70">
Admin
</div>

<h1 className="mt-2 text-3xl font-extrabold text-[var(--brand-gold)]">
 Vegan Masala Admin Hub
</h1>

<p className="mt-4 max-w-3xl text-sm text-[var(--text-soft)]">

Open every Vegan Masala administration tool from one place.
Import recipes, generate content, build videos, schedule posts, and monitor growth and site health.

</p>


<div className="mt-6 flex flex-wrap gap-3">

<Link

href="/admin/growth"

className="rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-bold text-[var(--brand-gold)]"

>

Growth dashboard

</Link>

<Link

href="/admin/social/generate"

className="rounded-xl bg-[var(--brand-red)] px-6 py-3 text-sm font-bold text-white"

>

Generate content

</Link>


<Link

href="/admin/social/queue"

className="rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-bold text-[var(--brand-gold)]"

>

Open queue

</Link>


<Link

href="/admin/social/video"

className="rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-bold text-[var(--brand-gold)]"

>

Generate videos

</Link>

<Link

href="/admin/social/automation"

className="rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-bold text-[var(--brand-gold)]"

>

Social automation

</Link>


<Link

href="/admin/seo/health"

className="rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-bold text-[var(--brand-gold)]"

>

SEO health

</Link>

<Link

href="/admin/app/health"

className="rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-bold text-[var(--brand-gold)]"

>

App recipe health

</Link>

</div>

</section>

<section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8">
  <div className="flex flex-wrap items-start justify-between gap-4">
    <div>
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-gold)]/70">Live publishing status</div>
      <h2 className="mt-2 text-2xl font-extrabold text-[var(--brand-gold)]">Queue at a glance</h2>
    </div>
    <Link href="/admin/social/queue" className="rounded-xl bg-[var(--brand-red)] px-5 py-3 text-sm font-bold text-white">Open Social Queue</Link>
  </div>

  {statusLoading?(
    <div className="mt-6 rounded-2xl bg-black/20 p-5 text-sm text-[var(--text-soft)]">Loading live status…</div>
  ):(
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-black/20 p-5"><div className="text-xs uppercase tracking-[0.14em] text-[var(--text-soft)]">Queued</div><div className="mt-2 text-3xl font-extrabold text-[var(--brand-gold)]">{queuedItems.length}</div></div>
        <div className="rounded-2xl border border-[var(--border)] bg-black/20 p-5"><div className="text-xs uppercase tracking-[0.14em] text-[var(--text-soft)]">Auto-retrying</div><div className="mt-2 text-3xl font-extrabold text-yellow-300">{retryingItems.length}</div></div>
        <div className="rounded-2xl border border-[var(--border)] bg-black/20 p-5"><div className="text-xs uppercase tracking-[0.14em] text-[var(--text-soft)]">Needs attention</div><div className={`mt-2 text-3xl font-extrabold ${failedItems.length?"text-red-300":"text-emerald-300"}`}>{failedItems.length}</div></div>
        <div className="rounded-2xl border border-[var(--border)] bg-black/20 p-5">
          <div className="text-xs uppercase tracking-[0.14em] text-[var(--text-soft)]">Next scheduled</div>
          {nextPost?<><div className="mt-2 truncate font-bold text-white">{nextPost.title||nextPost.slug}</div><div className="mt-1 text-xs capitalize text-[var(--text-soft)]">{nextPost.platform} · {new Date(nextPost.scheduledFor).toLocaleString("en-GB",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</div></>:<div className="mt-2 text-sm text-[var(--text-soft)]">Nothing scheduled</div>}
        </div>
      </div>

      <div className={`mt-5 rounded-2xl border p-5 ${warnings.length?"border-amber-500/30 bg-amber-500/10":"border-emerald-500/30 bg-emerald-500/10"}`}>
        <div className={`font-bold ${warnings.length?"text-amber-200":"text-emerald-200"}`}>{warnings.length?`${warnings.length} platform warning${warnings.length===1?"":"s"}`:"All connected platforms look ready"}</div>
        {warnings.length?<ul className="mt-3 space-y-1 text-sm text-amber-100/90">{warnings.map(warning=><li key={warning}>• {warning}</li>)}</ul>:null}
      </div>
    </>
  )}
</section>



<section className="mt-8 grid gap-6 lg:grid-cols-3">

{tools.map(tool=>(

<Link

key={tool.href}

href={tool.href}

className="group rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:bg-black/20 transition"

>

<div className="text-xs uppercase tracking-[0.16em] text-[var(--brand-gold)]/70">
Tool
</div>


<h2 className="mt-2 text-2xl font-extrabold text-[var(--brand-gold)]">
{tool.title}
</h2>


<p className="mt-4 text-sm text-[var(--text-soft)] min-h-[80px]">

{tool.description}

</p>


<div className="mt-6 inline-flex rounded-xl bg-black/30 px-4 py-2 text-sm font-bold text-white group-hover:bg-[var(--brand-red)] transition">

{tool.cta}

</div>

</Link>

))}

</section>



<section className="mt-8 grid gap-6 lg:grid-cols-2">

<div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8">

<h2 className="text-xl font-extrabold text-[var(--brand-gold)]">

Recommended workflow

</h2>


<div className="mt-5 space-y-4 text-sm text-[var(--text-soft)]">

<div className="rounded-2xl bg-black/20 p-4">

<b className="text-[var(--brand-gold)]">1.</b>
 Import or prepare recipes in the Recipe Pipeline

</div>


<div className="rounded-2xl bg-black/20 p-4">

<b className="text-[var(--brand-gold)]">2.</b>
 Generate social images and recipe videos

</div>


<div className="rounded-2xl bg-black/20 p-4">

<b className="text-[var(--brand-gold)]">3.</b>
 Preview and schedule content in the Social Queue

</div>

<div className="rounded-2xl bg-black/20 p-4">

<b className="text-[var(--brand-gold)]">4.</b>
 Review growth, publishing, SEO and app health

</div>

</div>

</div>



<div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8">

<h2 className="text-xl font-extrabold text-[var(--brand-gold)]">

Why this structure works

</h2>


<div className="mt-5 space-y-4 text-sm text-[var(--text-soft)]">

<div className="rounded-2xl bg-black/20 p-4">
Pages load faster
</div>

<div className="rounded-2xl bg-black/20 p-4">
Easier debugging
</div>

<div className="rounded-2xl bg-black/20 p-4">
Ready for Meta / TikTok / YouTube expansion
</div>

</div>

</div>

</section>


</main>

);

}
