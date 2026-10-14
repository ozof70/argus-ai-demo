import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('./vendor/mediapipe/',import.meta.url),manifest=JSON.parse(await readFile(new URL('./pose-assets.json',import.meta.url),'utf8'));
for(const file of manifest.files){
 const target=new URL(file.path,root),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
 try{if(hash(await readFile(target))===file.sha256)continue;}catch{}
 const response=await fetch(file.url,{signal:AbortSignal.timeout(60000)});if(!response.ok)throw Error(`Pose asset download failed: ${file.path} (${response.status})`);
 const bytes=new Uint8Array(await response.arrayBuffer());if(hash(bytes)!==file.sha256)throw Error(`Pose asset checksum mismatch: ${file.path}`);
 await mkdir(new URL('./',target),{recursive:true});await writeFile(target,bytes);
}
console.log(`Verified MediaPipe ${manifest.version} and Pose Landmarker Lite assets`);
