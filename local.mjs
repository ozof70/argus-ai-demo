import {mediaResponse} from './media-response.mjs';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
import {handleAPI} from './api.mjs';
import {createDatabase} from './sqlite.mjs';
const root=resolve(fileURLToPath(new URL('./',import.meta.url))),db=createDatabase(process.env.ARGUS_DB_PATH||fileURLToPath(new URL('./.data/argus.sqlite',import.meta.url)));
const port=Number(process.env.PORT||8765),mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,`http://${req.headers.host}`);let response;
 if(url.pathname.startsWith('/api/')){const parts=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>16384){res.writeHead(413);res.end('Request too large');return;}parts.push(chunk);}response=await handleAPI(new Request(url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(parts)})}),{DB:db});}
 else{const pathname=['/','/operator'].includes(url.pathname)?'/index.html':url.pathname;const allowed=['/index.html','/app.js','/style.css','/logo.svg'];if(!allowed.includes(pathname)&&!/^\/media\/(cam\d{2}\.mp4|sources\.json)$/.test(pathname)){res.writeHead(404);res.end('Not found');return;}const content=await readFile(join(root,pathname));response=pathname.endsWith('.mp4')?mediaResponse(new Request(url,{method:req.method,headers:req.headers}),content,'video/mp4'):new Response(content,{headers:{'content-type':mime[pathname.slice(pathname.lastIndexOf('.'))],'cache-control':'no-cache','x-content-type-options':'nosniff'}});}
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(e){console.error(e.message);res.writeHead(500);res.end('Server error');}});
server.listen(port,process.env.ARGUS_HOST||'127.0.0.1',()=>console.log(`Argus AI backend ready: http://127.0.0.1:${port}`));
process.on('SIGINT',()=>server.close(()=>{db.close();process.exit(0);}));
