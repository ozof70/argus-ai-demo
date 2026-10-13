const UPSTREAM='https://argus-ai-class-demo.fancy-curry-3072.chatgpt.site';
export default async function handler(request){
 const url=new URL(request.url),origin=request.headers.get('origin');
 if(!url.pathname.startsWith('/api/'))return new Response('Not found',{status:404});
 if(!['GET','HEAD'].includes(request.method)&&origin&&origin!==url.origin)return Response.json({error:'不允許跨站操作'},{status:403});
 const target=new URL(url.pathname+url.search,UPSTREAM),headers=new Headers();
 for(const name of ['accept','content-type'])if(request.headers.has(name))headers.set(name,request.headers.get(name));
 const cookie=request.headers.get('cookie')?.match(/(?:^|;\s*)argus_demo=([a-f0-9-]{36})(?:;|$)/)?.[1];
 if(cookie)headers.set('cookie','argus_demo='+cookie);
 if(origin)headers.set('origin',target.origin);
 let body;
 if(!['GET','HEAD'].includes(request.method)){body=await request.arrayBuffer();if(body.byteLength>16384)return Response.json({error:'請求內容過大'},{status:413});}
 try{
  const response=await fetch(target,{method:request.method,headers,body,redirect:'manual',signal:AbortSignal.timeout(15000)}),out=new Headers(response.headers);
  out.delete('content-encoding');out.delete('content-length');out.set('cache-control','no-store');
  const location=out.get('location');if(location?.startsWith(UPSTREAM))out.set('location',location.slice(UPSTREAM.length)||'/');
  return new Response(request.method==='HEAD'?null:response.body,{status:response.status,headers:out});
 }catch{return Response.json({error:'事件服務暫時無法連線，請稍後重試'},{status:502,headers:{'cache-control':'no-store'}});}
}
export const config={path:'/api/*'};
