import {FilesetResolver,PoseLandmarker} from './vendor/mediapipe/vision_bundle.mjs';
let model;
self.onmessage=async({data})=>{
 try{
  if(data.type==='init'){
   const wasm=await FilesetResolver.forVisionTasks(new URL('./vendor/mediapipe/wasm/',import.meta.url).href,true);
   model=await PoseLandmarker.createFromOptions(wasm,{baseOptions:{modelAssetPath:new URL('./vendor/mediapipe/pose_landmarker_lite.task',import.meta.url).href,delegate:'CPU'},canvas:new OffscreenCanvas(640,360),runningMode:'VIDEO',numPoses:3,minPoseDetectionConfidence:.55,minPosePresenceConfidence:.55,minTrackingConfidence:.55});
   self.postMessage({type:'ready'});
  }else if(data.type==='frame'){
   try{const result=model.detectForVideo(data.image,data.timestamp);self.postMessage({type:'result',landmarks:result.landmarks,time:data.time,generation:data.generation});}finally{data.image.close();}
  }
 }catch(error){self.postMessage({type:'error',message:error.message});}
};
