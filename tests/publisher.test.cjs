const {test}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript');
const fs=require('node:fs');
const vm=require('node:vm');
function load(file,stubs={},globals={}) {
 const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(source,{exports,require:n=>stubs[n]||require(n),process,Response,Buffer,URL,AbortSignal,...globals});return exports;
}
const {authorize}=load('src/lib/publisher/auth.ts');
const {validate}=load('src/lib/publisher/content.ts',{'@vercel/kv':{kv:{}},'@/lib/recipes':{},'@/lib/recipeDepth':{}});
test('authentication fails closed locally and in production; rejects cross-origin mutation',()=>{
 process.env.ADMIN_PASSWORD='test-password';
 const request=(origin,password='test-password')=>new Request('https://example.com/api/admin/publisher',{headers:{authorization:'Basic '+Buffer.from('vegan-masala:'+password).toString('base64'),origin}});
 assert.equal(authorize(request('https://example.com')),null);
 assert.equal(authorize(request('https://evil.com'),true).status,403);
 assert.equal(authorize(request('https://example.com','wrong')).status,401);
 delete process.env.ADMIN_PASSWORD;delete process.env.ADMIN_TOKEN;
 assert.equal(authorize(request('https://example.com')).status,401);
});
test('content validation blocks untrusted media and executable schemes; preserves original media',()=>{
 process.env.PUBLISHER_MEDIA_ORIGIN='https://store.public.blob.vercel-storage.com';
 const content={ingredients:['  lentils  '],instructions:['Cook until tender'],image:'/images/recipes/dal.webp',video:''};
 assert.equal(validate(content).ingredients[0],'lentils');
 for(const image of ['javascript:alert(1)','https://evil.com/photo.jpg','/images/../../secret','https://user:password@store.public.blob.vercel-storage.com/x'])assert.throws(()=>validate({...content,image}));
 assert.throws(()=>validate({...content,ingredients:[]}));
 assert.throws(()=>validate({...content,instructions:['']}));
 assert.equal(validate({...content,video:'https://store.public.blob.vercel-storage.com/publisher/dal/video.mp4'}).video.endsWith('.mp4'),true);
 const original={...content,video:'https://old-store.example/video.mp4'};
 assert.equal(validate(original,original).video,original.video);
});
test('draft stays separate; stale saves and stale publish requests conflict',async()=>{
 const records=new Map();
 const kv={get:async k=>records.get(k)||null,eval:async(_script,keys,args)=>{
   const old=records.get(keys[0]);
   if(keys.length===1){if((old?.revision||'')!==args[0])return 0;records.set(keys[0],JSON.parse(args[1]));return 1;}
   if(!old||old.revision!==args[0])return 0;records.set(keys[1],old);return 1;
 }};
 const base={ingredients:['Lentils'],instructions:['Cook'],image:'',video:''};
 const content=load('src/lib/publisher/content.ts',{'@vercel/kv':{kv},'@/lib/recipes':{getRecipeBySlug:s=>s==='dal'?base:null},'@/lib/recipeDepth':{getRecipeDepth:()=>null}});
 process.env.KV_REST_API_URL='https://test';process.env.KV_REST_API_TOKEN='test';
 const routes=load('src/app/api/admin/publisher/route.ts',{'@vercel/kv':{kv},'@/lib/recipes':{getRecipeBySlug:s=>s==='dal'?base:null},'@/lib/publisher/auth':{authorize:()=>null},'@/lib/publisher/content':content});
 const post=body=>routes.POST(new Request('https://test/api/admin/publisher',{method:'POST',body:JSON.stringify(body)}));
 const first=await post({slug:'dal',action:'draft',content:base,revision:''});assert.equal(first.status,200);const saved=await first.json();
 assert.equal(records.has(content.key('dal','published')),false);
 assert.equal((await post({slug:'dal',action:'draft',content:base,revision:''})).status,409);
 assert.equal((await post({slug:'dal',action:'publish',revision:'outdated'})).status,409);
 assert.equal((await post({slug:'dal',action:'publish',revision:saved.revision})).status,200);
 assert.equal(records.get(content.key('dal','published')).revision,saved.revision);
 assert.equal((await post({slug:'missing',action:'publish',revision:saved.revision})).status,404);
 delete process.env.KV_REST_API_URL;delete process.env.KV_REST_API_TOKEN;
});
test('production verification requires exact revision and successful response',async()=>{
 let status=200,html='<main data-publisher-revision="old"></main>';
 const routes=load('src/app/api/admin/publisher/deploy/route.ts',{
 '@vercel/kv':{kv:{get:async()=>({revision:'saved-123'})}},
 '@/lib/publisher/auth':{authorize:()=>null},
 '@/lib/publisher/content':{configured:()=>true,key:()=>''},
 '@/lib/recipes':{getRecipeBySlug:()=>({})}
 },{fetch:async()=>new Response(html,{status})});
 const check=async()=>{const r=await routes.POST(new Request('https://test/api/admin/publisher/deploy',{method:'POST',body:JSON.stringify({action:'verify',slug:'dal',revision:'saved-123'})}));return r.json();};
 assert.match((await check()).message,/not yet verified/);
 html='<main data-publisher-revision="saved-123"></main>';
 assert.match((await check()).message,/Verified live/);
 status=503;assert.match((await check()).message,/not yet verified/);
});
