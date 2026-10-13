import test from 'node:test';
import assert from 'node:assert/strict';
import proxy from './netlify-functions/api-proxy.mjs';
test('Netlify proxy preserves session and rejects cross-origin writes',async()=>{
 const oldFetch=globalThis.fetch;let forwarded;
 globalThis.fetch=async(url,options)=>{forwarded={url:String(url),options};return new Response('{"ok":true}',{headers:{'content-type':'application/json','set-cookie':'argus_demo=00000000-0000-0000-0000-000000000000; Path=/; HttpOnly; SameSite=Lax; Secure','content-encoding':'gzip'}});};
 try{
  const rejected=await proxy(new Request('https://argus-test.netlify.app/api/scenarios',{method:'POST',headers:{origin:'https://other.example'},body:'{}'}));assert.equal(rejected.status,403);assert.equal(forwarded,undefined);
  const res=await proxy(new Request('https://argus-test.netlify.app/api/scenarios',{method:'POST',headers:{origin:'https://argus-test.netlify.app',cookie:'unrelated=private; argus_demo=00000000-0000-0000-0000-000000000000','content-type':'application/json'},body:'{}'}));
  assert.equal(res.status,200);assert.equal(forwarded.options.headers.get('origin'),'https://argus-ai-class-demo.fancy-curry-3072.chatgpt.site');assert.equal(forwarded.options.headers.get('cookie'),'argus_demo=00000000-0000-0000-0000-000000000000');assert.match(res.headers.get('set-cookie'),/HttpOnly/);assert.equal(res.headers.get('content-encoding'),null);assert.equal(await res.text(),'{"ok":true}');
 }finally{globalThis.fetch=oldFetch;}
});
