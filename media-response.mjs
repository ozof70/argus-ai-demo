export function mediaResponse(request, bytes, type){
 const size=bytes.byteLength,headers={'content-type':type,'accept-ranges':'bytes','cache-control':'public, max-age=3600','x-content-type-options':'nosniff'};
 const range=request.headers.get('range');
 if(range){
  const match=/^bytes=(\d*)-(\d*)$/.exec(range);let start,end;
  if(match&&match[1]){start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),size-1):size-1;}
  else if(match&&match[2]){start=Math.max(0,size-Number(match[2]));end=size-1;}
  if(start===undefined||start>=size||start>end){return new Response(null,{status:416,headers:{...headers,'content-range':`bytes */${size}`}});}
  return new Response(request.method==='HEAD'?null:bytes.slice(start,end+1),{status:206,headers:{...headers,'content-range':`bytes ${start}-${end}/${size}`,'content-length':String(end-start+1)}});
 }
 return new Response(request.method==='HEAD'?null:bytes,{headers:{...headers,'content-length':String(size)}});
}
