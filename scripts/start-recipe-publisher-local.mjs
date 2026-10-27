// A stable, loopback-only launcher for the actual publisher, not a development preview.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { parse } from 'dotenv';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
const envIndex=args.indexOf('--env-file');
const env={...process.env,...(envIndex>=0?parse(fs.readFileSync(args[envIndex+1])):{})};
env.PUBLISHER_BUILD_DIR='.next-publisher';
const password=env.ADMIN_PASSWORD||env.ADMIN_TOKEN;
if(!password||!env.KV_REST_API_URL||!env.KV_REST_API_TOKEN||!env.PUBLISHER_MEDIA_ORIGIN||!(env.BLOB_READ_WRITE_TOKEN||env.PUBLIC_VIDEO_BLOB_READ_WRITE_TOKEN))throw new Error('Set administrator, KV, Blob and media-origin settings before starting the publisher.');
const next=path.join(root,'node_modules/next/dist/bin/next');
function runNext(command){return new Promise((resolve,reject)=>{const p=spawn(process.execPath,[next,...command],{cwd:root,env,stdio:'inherit'});p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(new Error('Website build failed')));});}
(async()=>{
 if(args.includes('--build'))await runNext(['build','--webpack']);
 if(!fs.existsSync(path.join(root,env.PUBLISHER_BUILD_DIR,'BUILD_ID')))throw new Error('Run the launcher with --build to prepare the production build.');
 const child=spawn(process.execPath,[next,'start','--hostname','127.0.0.1','--port','3140'],{cwd:root,env,stdio:'inherit'});
 const server=http.createServer(async(req,res)=>{
  try{
   if(!['127.0.0.1:3141','localhost:3141'].includes(req.headers.host)){res.writeHead(403);return res.end('Local requests only');}
   const outerOrigin=`http://${req.headers.host}`;
   if(req.method!=='GET'&&req.method!=='HEAD'&&req.headers.origin!==outerOrigin){res.writeHead(403);return res.end('Same-origin request required');}
   const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>1024*1024){res.writeHead(413);return res.end('This endpoint accepts recipe data only. Upload media directly to storage.');}chunks.push(chunk);}
   const headers={authorization:'Basic '+Buffer.from((env.ADMIN_USERNAME||'vegan-masala')+':'+password).toString('base64'),'accept-encoding':'identity'};
   if(req.headers['content-type'])headers['content-type']=req.headers['content-type'];
   if(req.headers.origin)headers.origin='http://localhost:3140';
   const upstream=await fetch('http://127.0.0.1:3140'+req.url,{method:req.method,headers,body:chunks.length?Buffer.concat(chunks):undefined,redirect:'manual'});
   res.statusCode=upstream.status;
   for(const [k,v]of upstream.headers)if(!['content-length','content-encoding','transfer-encoding','connection'].includes(k))res.setHeader(k,v);
   if(upstream.body)for await(const chunk of upstream.body)res.write(chunk);
   res.end();
  }catch{if(!res.headersSent)res.writeHead(502,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'The publisher is starting or unavailable. Your edits are kept in this tab. Please retry.'}));}
 });
 server.listen(3141,'127.0.0.1',()=>console.log('Recipe Publisher: http://127.0.0.1:3141/admin/publisher'));
 function stop(){child.kill();server.close();}
 process.on('SIGINT',()=>{stop();process.exit();});process.on('SIGTERM',()=>{stop();process.exit();});child.on('exit',()=>{server.close();});
})().catch(e=>{console.error(e.message);process.exitCode=1;});
