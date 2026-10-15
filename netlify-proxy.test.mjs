import test from 'node:test';
import assert from 'node:assert/strict';
import proxy,{nineCameraSnapshot} from './netlify-functions/api-proxy.mjs';
test('nine-camera view keeps event counts and settings consistent',()=>{
 const data=nineCameraSnapshot({cameras:Array.from({length:10},(_,i)=>({id:'cam'+String(i+1).padStart(2,'0'),online:i!==8})),events:[{camera_id:'cam09',state:'pending',ack_at:null},{camera_id:'cam10',state:'ack',ack_at:100,notified_at:0}],logs:[{camera_id:'cam10'},{camera_id:'cam09'},{camera_id:null}],stats:{total:10,online:9,pending:1,active:1}});
 assert.equal(data.cameras.length,9);assert.equal(data.stats.total,9);assert.equal(data.stats.online,8);assert.equal(data.stats.pending,1);assert.equal(data.stats.active,0);assert.equal(data.stats.averageAckSeconds,null);assert.equal(data.logs.length,2);assert.equal(data.events.length,1);
});
test('Netlify proxy preserves session and rejects cross-origin writes',async()=>{
 const oldFetch=globalThis.fetch;let forwarded;
 globalThis.fetch=async(url,options)=>{forwarded={url:String(url),options};const headers=new Headers({'content-type':'application/json','set-cookie':'argus_demo=00000000-0000-0000-0000-000000000000; Path=/; HttpOnly; SameSite=Lax; Secure','content-encoding':'gzip'});headers.append('set-cookie','__cf_bm=upstream-only; Path=/; Domain=chatgpt.site');return new Response('{"ok":true}',{headers});};
 try{
  const rejected=await proxy(new Request('https://argus-test.netlify.app/api/scenarios',{method:'POST',headers:{origin:'https://other.example'},body:'{}'}));assert.equal(rejected.status,403);assert.equal(forwarded,undefined);
  const res=await proxy(new Request('https://argus-test.netlify.app/api/scenarios',{method:'POST',headers:{origin:'https://argus-test.netlify.app',cookie:'unrelated=private; argus_demo=00000000-0000-0000-0000-000000000000','content-type':'application/json'},body:'{}'}));
  assert.equal(res.status,200);assert.equal(forwarded.options.headers.get('origin'),'https://argus-ai-class-demo.fancy-curry-3072.chatgpt.site');assert.equal(forwarded.options.headers.get('cookie'),'argus_demo=00000000-0000-0000-0000-000000000000');assert.match(res.headers.get('set-cookie'),/HttpOnly/);assert.equal(res.headers.getSetCookie().length,1);assert.doesNotMatch(res.headers.get('set-cookie'),/__cf_bm/);assert.equal(res.headers.get('content-encoding'),null);assert.equal(await res.text(),'{"ok":true}');
 }finally{globalThis.fetch=oldFetch;}
});
