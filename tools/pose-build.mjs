const button=document.querySelector('button'),video=document.querySelector('video'),status=document.querySelector('pre');
button.onclick=async()=>{
 button.disabled=true;let worker;
 try{
  worker=new Worker('/pose-worker.mjs',{type:'module'});let resolve,reject;
  worker.onmessage=({data})=>data.type==='error'?reject?.(Error(data.message)):resolve?.(data);
  worker.onerror=e=>reject?.(Error(e.message));
  const send=data=>new Promise((res,rej)=>{resolve=res;reject=rej;worker.postMessage(data,data.image?[data.image]:[]);});
  status.textContent='載入真人姿態模型…';await send({type:'init',mode:'IMAGE'});
  const finished=[];
  for(let i=1;i<=9;i++){
   const camera='cam'+String(i).padStart(2,'0');video.src='/media/'+camera+'.mp4';
   await new Promise((res,rej)=>{video.onloadeddata=res;video.onerror=()=>rej(Error('影片載入失敗 '+camera));video.load();});
   const frames=[],duration=video.duration,step=.12,canvas=new OffscreenCanvas(video.videoWidth,video.videoHeight),ctx=canvas.getContext('2d',{willReadFrequently:true});
   for(let t=0;t<duration;t+=step){
    const source=await createImageBitmap(await (await fetch('/pose-frames/'+camera+'/frame-'+String(frames.length+1).padStart(4,'0')+'.jpg')).blob());
    ctx.drawImage(source,0,0);source.close();const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let signature=0;for(let k=0;k<pixels.length;k+=997)signature=(signature*31+pixels[k])>>>0;
    const image=canvas.transferToImageBitmap(),data=await send({type:'frame',image,time:t,timestamp:performance.now()});
    frames.push({t:Number(t.toFixed(3)),signature,poses:data.landmarks.map(p=>p.map(v=>[v.x,v.y,v.visibility??0,v.presence??1].map(n=>Math.round(n*100000)/100000)))});
    status.textContent=finished.join('\n')+'\n'+camera+' '+Math.round(t/duration*100)+'% · 已辨識 '+frames.length+' 個影格';
   }
   const result={version:1,camera,width:video.videoWidth,height:video.videoHeight,duration,sampleSeconds:step,model:'MediaPipe Pose Landmarker Lite',source:'Actual recorded video frame inference',frames};
   const response=await fetch('/api/pose-records/'+camera,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(result)});if(!response.ok)throw Error(await response.text());
   finished.push(camera+' 完成：'+frames.length+' 影格，'+frames.filter(f=>f.poses.length).length+' 影格辨識到人物');
  }
  status.textContent=finished.join('\n')+'\n九段錄影辨識完成';
 }catch(e){status.textContent='辨識失敗：'+e.message;button.disabled=false;}finally{worker?.terminate();}
};
