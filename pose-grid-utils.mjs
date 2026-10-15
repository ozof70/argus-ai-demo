export const BONE_LINES=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]];
export const SKELETON_COLORS={normal:'#25d486',alert:'#ff9a38'};
export function frameAt(record,time){
 if(!record?.frames?.length||!Number.isFinite(time))return null;
 const i=Math.min(record.frames.length-1,Math.max(0,Math.round(time/record.sampleSeconds))),frame=record.frames[i];
 return Math.abs(frame.t-time)<=record.sampleSeconds*.6?{frame,index:i}:null;
}
export function confident(point){return Array.isArray(point)&&point.length>=4&&point.slice(0,4).every(Number.isFinite)&&point[0]>=0&&point[0]<=1&&point[1]>=0&&point[1]<=1&&point[2]>=.65&&point[3]>=.65;}
export function skeletonColor(openEvent){return openEvent?SKELETON_COLORS.alert:SKELETON_COLORS.normal;}
