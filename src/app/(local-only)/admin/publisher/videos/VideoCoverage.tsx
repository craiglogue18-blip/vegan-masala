'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type RecipeRow={slug:string;title:string;hasVideo:boolean;source:string};
type Report={total:number;withVideos:number;withoutVideos:number;checkedAt:string;recipes:RecipeRow[]};
export default function VideoCoverage() {
  const [report,setReport]=useState<Report|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [filter,setFilter]=useState<'all'|'with'|'without'>('all');
  const [query,setQuery]=useState('');
  async function refresh(){
    setLoading(true);setError('');
    try{
      const response=await fetch('/api/admin/publisher/video-coverage',{cache:'no-store'});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'Unable to load report');
      setReport(data);
    }catch(e){setError((e as Error).message);setReport(null);}
    finally{setLoading(false);}
  }
  useEffect(()=>{void refresh();},[]);
  const rows=useMemo(()=>report?.recipes.filter(r=>(filter==='all'||(filter==='with'===r.hasVideo))&&(`${r.title} ${r.slug}`).toLowerCase().includes(query.toLowerCase()))||[],[report,filter,query]);
  return <main className="mx-auto max-w-5xl px-5 py-10">
    <p className="text-sm text-[var(--text-soft)]">Vegan Masala · Admin Hub</p>
    <h1 className="mt-2 text-3xl font-bold">Recipe video coverage</h1>
    <p className="mt-3 text-[var(--text-soft)]">Counts published recipe videos, including updates stored in Vercel KV. Unpublished drafts are excluded. A video is counted when a published URL is present; playback is not tested.</p>
    <div className="mt-5 flex flex-wrap gap-3"><button type="button" disabled={loading} onClick={()=>void refresh()} className="rounded-lg border border-[var(--border)] px-4 py-2 font-semibold">{loading?'Checking…':'Refresh report'}</button><Link href="/admin/publisher" className="rounded-lg border border-[var(--border)] px-4 py-2">Recipe Publisher</Link></div>
    {error&&<p role="alert" className="mt-5 text-red-400">{error}</p>}
    {report&&<>
      <div className="mt-7 grid grid-cols-3 gap-3">{([['Total recipes',report.total],['With videos',report.withVideos],['Without videos',report.withoutVideos]] as const).map(([label,value])=><div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"><p className="text-sm text-[var(--text-soft)]">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>)}</div>
      <p className="mt-3 text-xs text-[var(--text-soft)]">Checked {new Date(report.checkedAt).toLocaleString()}</p>
      <div className="mt-6 flex flex-wrap gap-3"><label className="sr-only" htmlFor="video-coverage-search">Search recipes</label><input id="video-coverage-search" className="min-w-48 flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search recipes"/><label className="sr-only" htmlFor="video-coverage-filter">Filter video coverage</label><select id="video-coverage-filter" className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2" value={filter} onChange={e=>setFilter(e.target.value as typeof filter)}><option value="all">All recipes</option><option value="with">With videos</option><option value="without">Without videos</option></select></div>
      <p className="mt-4 text-sm text-[var(--text-soft)]">Showing {rows.length} recipes</p>
      <div className="mt-3 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)]">{rows.map(row=><div key={row.slug} className="flex flex-wrap items-center gap-3 px-4 py-3"><span className="min-w-0 flex-1 font-medium">{row.title}</span><span className={row.hasVideo?'text-green-400':'text-[var(--text-soft)]'}>{row.hasVideo?'Video published':'No video'}</span><Link className="underline underline-offset-4" href={`/recipes/${encodeURIComponent(row.slug)}`}>View recipe</Link><Link className="underline underline-offset-4" href={`/admin/publisher?slug=${encodeURIComponent(row.slug)}`}>Edit</Link></div>)}</div>
    </>}
  </main>;
}
