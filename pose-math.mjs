export const JOINTS=[['左膝',23,25,27],['右膝',24,26,28],['左髖',11,23,25],['右髖',12,24,26],['左肘',11,13,15],['右肘',12,14,16]];
export function visible(p){return p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1&&(p.visibility??0)>=.65&&(p.presence??1)>=.65;}
export function angle(a,b,c,width=1,height=1){
 if(![a,b,c].every(visible)||width<=0||height<=0)return null;
 const u=[(a.x-b.x)*width,(a.y-b.y)*height],v=[(c.x-b.x)*width,(c.y-b.y)*height];
 const norm=Math.hypot(...u)*Math.hypot(...v);if(norm<1e-6)return null;
 return Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/norm)))*180/Math.PI;
}
export function measurements(points,w,h){return JOINTS.map(([label,a,b,c])=>({label,value:angle(points[a],points[b],points[c],w,h)}));}
export function center(points){const p=[11,12,23,24].map(i=>points[i]).filter(visible);return p.length>=2?{x:p.reduce((n,a)=>n+a.x,0)/p.length,y:p.reduce((n,a)=>n+a.y,0)/p.length}:null;}
