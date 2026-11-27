// Run after npm run build. Uses only a local fake Redis REST server, never real KV.
const assert = require('node:assert/strict');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { setTimeout: pause } = require('node:timers/promises');
const slug = 'chana-masala';
async function scenario(coldFailure = false) {
  let title = `Cache test ${Date.now()}`, fail = coldFailure, reads = 0;
  const revision = () => ({ revision: title, updatedAt: '2026-11-27T10:00:00Z', content: { title, ingredients: ['Test lentils'], instructions: ['Test cooking'], image: '/images/recipes/chana-masala.webp', video: '' } });
  const provider = http.createServer(async (req, res) => {
    let body='';for await(const part of req)body+=part;
    const request=JSON.parse(body);
    const command = args => {
      if(args[0].toLowerCase()==='mget') {
        reads++;
        if(fail)return {error:'Simulated storage failure'};
        return {result:args.slice(1).map(key=>key===`publisher:v1:${slug}:published`?JSON.stringify(revision()):null)};
      }
      if(args[0].toLowerCase()==='eval')return {result:1};
      throw Error(`Unexpected fake command: ${args[0]}`);
    };
    res.setHeader('Content-Type','application/json');
    res.end(JSON.stringify(Array.isArray(request[0])?request.map(command):command(request)));
  });
  provider.listen(0,'127.0.0.1');await once(provider,'listening');
  // Choose an unused application port without touching any existing service.
  const portProbe=http.createServer();portProbe.listen(0,'127.0.0.1');await once(portProbe,'listening');
  const appPort=portProbe.address().port;await new Promise(resolve=>portProbe.close(resolve));
  const origin=`http://127.0.0.1:${appPort}`;
  const app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(appPort)],{env:{...process.env,KV_REST_API_URL:`http://127.0.0.1:${provider.address().port}`,KV_REST_API_TOKEN:'local-test-only',ADMIN_PASSWORD:'local-test-only'},stdio:['ignore','pipe','pipe']});
  let output='';app.stdout.on('data',d=>output+=d);app.stderr.on('data',d=>output+=d);
  const page=async path=>{
    const r=await fetch(origin+path);const html=await r.text();
    assert.equal(r.status,200);assert.ok(!html.includes('data-dgst=') && !/\\"digest\\":/.test(html));return html;
  };
  const publish=async()=>{
    const r=await fetch(origin+'/api/admin/publisher',{method:'POST',headers:{'Content-Type':'application/json',Origin:`http://localhost:${appPort}`,Authorization:'Basic '+Buffer.from('vegan-masala:local-test-only').toString('base64')},body:JSON.stringify({action:'publish',slug,revision:'local'})});
    assert.equal(r.status,200,await r.text());
  };
  try {
    for(let attempt=0;attempt<100 && !output.includes('Ready in');attempt++){
      if(app.exitCode!==null)throw Error(output);await pause(100);
    }
    assert.match(output,/Ready in/);
    const first=await page('/recipes');
    if(coldFailure){
      assert.ok(first.includes('Chana Masala'));assert.ok(!first.includes(title));
      await page('/recipes/'+slug);
      fail=false;
      const recovered=await page('/recipes');assert.ok(recovered.includes(title),'cold failure must not be cached as a successful empty snapshot');
      console.log('PASS cold storage failure: source recipes remain available; recovery becomes visible');
      return;
    }
    assert.ok(first.includes(title),'catalogue uses published title');
    assert.ok((await page('/recipes/'+slug)).includes(title),'detail shares published snapshot');
    await page('/recipes');assert.equal(reads,1,'repeated requests and metadata must reuse one cached MGET');
    title+=' updated';await publish();
    for(let i=0;i<30;i++){if((await page('/recipes')).includes(title))break;await pause(100);}
    assert.ok((await page('/recipes/'+slug)).includes(title),'publish refresh reaches catalogue and detail');
    assert.equal(reads,2,'one batch refresh after publish');
    fail=true;await publish();
    assert.ok((await page('/recipes')).includes(title));
    await pause(2400);
    assert.ok((await page('/recipes/'+slug)).includes(title),'failed refresh must retain last successful published snapshot');
    console.log('PASS cache reuse, publish invalidation, shared catalogue/detail data, stale published content during storage failure');
  } catch(error){throw new Error(error.message+'\n'+output,{cause:error});}
  finally { app.kill('SIGTERM');await once(app,'exit');provider.closeAllConnections();await new Promise(resolve=>provider.close(resolve)); }
}
(async()=>{await scenario();await scenario(true);})().catch(error=>{console.error(error);process.exitCode=1;});
