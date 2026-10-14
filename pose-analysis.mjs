import {JOINTS,visible,measurements,center} from './pose-math.mjs';
let active;
const BONES=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]];
window.ArgusPose={stop(){active?.stop();active=null;},attach(video){
 this.stop();if(!video)return;
 const frame=video.parentElement;frame.classList.add('pose-video-frame');
 const canvas=document.createElement('canvas');canvas.className='pose-canvas';canvas.setAttribute('aria-hidden','true');frame.append(canvas);
 const panel=document.createElement('section');panel.className='pose-panel';panel.innerHTML=`<div class="pose-heading"><div><h3>真人關節角度</h3><p>MediaPipe · 影片影像估計 · 2D 角度</p></div><button type="button" class="button dark pose-toggle">開始關節辨識</button></div><p class="pose-state" role="status">點選開始，在此裝置辨識影片中的人物</p><div class="pose-values">${JOINTS.map(([name])=>`<div><span>${name}</span><strong>—</strong><small>等待辨識</small></div>`).join('')}</div><p class="pose-note">只顯示信心足夠的關節；Δ 為相鄰有效辨識影格的角度差。遮擋、人物切換或影片跳轉會重置比較。這是影像估計，事件通知仍由情境按鈕模擬。</p>`;frame.after(panel);
 const button=panel.querySelector('button'),status=panel.querySelector('.pose-state'),cells=[...panel.querySelectorAll('.pose-values>div')],ctx=canvas.getContext('2d');
 let worker,enabled=false,ready=false,busy=false,timer,previous=null,target=null,lastVideo=-1,lastFrame=0,epoch=0,generation=0;
 function clear(message){ctx.clearRect(0,0,canvas.width,canvas.height);previous=null;target=null;cells.forEach(c=>{c.querySelector('strong').textContent='—';c.querySelector('small').textContent='無法辨識';});status.textContent=message;}
 function stop(){enabled=false;epoch++;clearTimeout(timer);worker?.terminate();worker=null;ready=false;busy=false;clear('關節辨識已停止');button.textContent='開始關節辨識';button.disabled=false;}
 function draw(points){
  canvas.width=video.videoWidth;canvas.height=video.videoHeight;ctx.clearRect(0,0,canvas.width,canvas.height);
  for(const [a,b] of BONES){if(!visible(points[a])||!visible(points[b]))continue;const x=points[a],y=points[b];ctx.beginPath();ctx.moveTo(x.x*canvas.width,x.y*canvas.height);ctx.lineTo(y.x*canvas.width,y.y*canvas.height);ctx.strokeStyle='#111';ctx.lineWidth=6;ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();}
  for(const [,a,b,c] of JOINTS){if(![a,b,c].every(i=>visible(points[i])))continue;const p=points[b];ctx.beginPath();ctx.arc(p.x*canvas.width,p.y*canvas.height,4,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#111';ctx.lineWidth=1.5;ctx.stroke();}
 }
 function result(data){
  busy=false;if(!enabled||data.generation!==generation)return;
  const poses=data.landmarks.map(points=>({points,c:center(points)})).filter(p=>p.c);
  if(!poses.length){clear('目前無法辨識清楚的人體關節；可換一個鏡頭');return;}
  let selected,matched=false;
  if(target){const sorted=poses.map(p=>({...p,d:Math.hypot(p.c.x-target.x,p.c.y-target.y)})).sort((a,b)=>a.d-b.d);if(sorted[0].d<.12&&(!sorted[1]||sorted[1].d-sorted[0].d>.025)){selected=sorted[0];matched=true;}}
  if(!selected)selected=poses.sort((a,b)=>{const extent=p=>{const v=p.points.filter(visible);return Math.max(...v.map(x=>x.y))-Math.min(...v.map(x=>x.y));};return extent(b)-extent(a);})[0];
  if(!matched||!previous||data.time<=previous.time||data.time-previous.time>.75)previous=null;
  target=selected.c;const values=measurements(selected.points,video.videoWidth,video.videoHeight);
  draw(selected.points);let valid=0;
  values.forEach((a,i)=>{const c=cells[i];if(a.value===null){c.querySelector('strong').textContent='—';c.querySelector('small').textContent='遮擋／信心不足';return;}valid++;c.querySelector('strong').textContent=Math.round(a.value)+'°';const before=previous?.values[i].value;c.querySelector('small').textContent=before==null?'新比較起點':Math.abs(a.value-before)>45?'追蹤變動，重新比較':`Δ ${a.value-before>=0?'+':''}${Math.round(a.value-before)}°`;});
  status.textContent=valid?`已辨識 ${poses.length} 人 · 顯示主要人物 · ${valid} 個有效關節 · 影片 ${data.time.toFixed(1)} 秒`:'人物可見，但關節遮擋或信心不足';previous={values,time:data.time};
 }
 async function tick(){
  if(!enabled)return;
  if(!document.querySelector('#dialog').open){stop();return;}
  if(video.paused||video.readyState<2){status.textContent=video.paused?'影片已暫停；角度停止更新':'等待影片載入';timer=setTimeout(tick,200);return;}
  if(ready&&!busy&&video.currentTime!==lastVideo&&performance.now()-lastFrame>=180){
   if(video.currentTime<lastVideo||Math.abs(video.currentTime-lastVideo)>1)clear('影片跳轉，重新開始比較');
   lastVideo=video.currentTime;lastFrame=performance.now();busy=true;const current=epoch;
   try{const image=await createImageBitmap(video);if(!enabled||current!==epoch){image.close();return;}worker.postMessage({type:'frame',image,timestamp:performance.now(),time:video.currentTime,generation},[image]);}catch{busy=false;clear('目前影格無法讀取，請重新播放影片');}
  }
  timer=setTimeout(tick,80);
 }
 button.onclick=()=>{
  if(enabled){stop();return;}
  enabled=true;epoch++;button.textContent='停止關節辨識';status.textContent='正在載入姿態模型，首次啟動需稍候…';
  worker=new Worker('/pose-worker.mjs',{type:'module'});
  worker.onmessage=({data})=>{if(data.type==='ready'){ready=true;status.textContent='模型就緒，正在辨識影片…';tick();}else if(data.type==='result')result(data);else if(data.type==='error'){stop();status.textContent='姿態模型無法啟動，請重新嘗試或使用支援 WebAssembly 的瀏覽器';console.error('Pose model:',data.message);}};
  worker.onerror=()=>{stop();status.textContent='姿態模型載入失敗，請重新嘗試';};worker.postMessage({type:'init'});
 };
 video.addEventListener('seeking',()=>{generation++;if(enabled)clear('影片跳轉，重新開始比較');});
 active={stop};
}};
