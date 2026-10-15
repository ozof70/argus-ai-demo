import {BONE_LINES,frameAt,confident,skeletonColor} from './pose-grid-utils.mjs';
const feeds=new Map();let show=true;
function attach(video){
 const card=video.closest('.camera'),id=video.dataset.feed,frame=video.parentElement;
 const canvas=document.createElement('canvas');canvas.className='grid-pose';canvas.setAttribute('aria-hidden','true');frame.append(canvas);
 const label=document.createElement('span');label.className='grid-pose-label';label.textContent='骨架載入中';frame.append(label);
 const ctx=canvas.getContext('2d'),entry={video,card,canvas,label,ctx,record:null,key:null};feeds.set(id,entry);
 fetch('/media/pose-'+id+'.json').then(r=>{if(!r.ok)throw Error('Missing pose data');return r.json();}).then(record=>{if(record.camera!==id||!record.frames?.length)throw Error('Invalid pose data');entry.record=record;draw(entry);}).catch(()=>{entry.error=true;label.textContent='骨架資料未載入';});
 const next=()=>{if(!video.isConnected)return;draw(entry);if(video.requestVideoFrameCallback)video.requestVideoFrameCallback(next);};
 if(video.requestVideoFrameCallback)video.requestVideoFrameCallback(next);
 video.addEventListener('seeking',()=>{entry.key=null;ctx.clearRect(0,0,canvas.width,canvas.height);label.textContent='同步骨架中';});
}
function draw(entry){
 const {video,card,canvas,label,ctx,record}=entry,color=skeletonColor(card.classList.contains('alert'));
 const enabled=show&&!card.hidden&&!card.classList.contains('offline')&&card.closest('.page')?.classList.contains('active');
 canvas.hidden=!enabled;label.hidden=!enabled;if(!enabled)return;
 if(!record){if(!entry.error)label.textContent='骨架載入中';return;}
 const found=frameAt(record,video.currentTime),key=`${found?.index}:${color}`;if(key===entry.key)return;entry.key=key;
 canvas.width=record.width;canvas.height=record.height;ctx.clearRect(0,0,canvas.width,canvas.height);let people=0,lines=0;
 for(const pose of found?.frame.poses||[]){let personLines=0;
  for(const [a,b] of BONE_LINES){if(!confident(pose[a])||!confident(pose[b]))continue;const p=pose[a],q=pose[b];ctx.beginPath();ctx.moveTo(p[0]*canvas.width,p[1]*canvas.height);ctx.lineTo(q[0]*canvas.width,q[1]*canvas.height);ctx.lineCap='round';ctx.strokeStyle='#101010d0';ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=4;ctx.stroke();personLines++;}
  if(personLines){people++;lines+=personLines;}
 }
 label.classList.toggle('pose-warning',card.classList.contains('alert'));
 label.textContent=lines?(card.classList.contains('alert')?'橘線 · 異常待確認':'綠線 · 真人骨架'):'未辨識到清楚關節';
 canvas.dataset.poseFrame=String(found?.index??-1);canvas.dataset.poseColor=color;canvas.dataset.posePeople=String(people);canvas.dataset.poseLines=String(lines);
}
function refresh(){document.querySelectorAll('#cameras video[data-feed]').forEach(video=>{if(!feeds.has(video.dataset.feed))attach(video);});feeds.forEach(draw);}
document.querySelector('#skeleton-toggle')?.addEventListener('click',event=>{show=!show;event.currentTarget.textContent='骨架線：'+(show?'開啟':'關閉');event.currentTarget.setAttribute('aria-pressed',String(show));feeds.forEach(entry=>entry.key=null);refresh();});
refresh();setInterval(refresh,200);
