export const DEFAULT_SETTINGS={fallSeconds:3,lowSeconds:10,crowdSeconds:10,crowdThreshold:18,escalationSeconds:30};
export const CAMERA_NAMES=['北側入口','南側入口','觀眾席左側','觀眾席右側','舞台左通道','舞台右通道','一樓連通道','二樓連通道','東側出口','西側出口'];
const TYPES={fall:'疑似倒地',low:'持續低位',crowd:'區域聚集'};
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers}});
class APIError extends Error{constructor(message,status=400){super(message);this.status=status;}}
const uuid=()=>crypto.randomUUID();
function stmt(db,sql,...args){return db.prepare(sql).bind(...args);}
async function rows(db,sql,...args){return (await stmt(db,sql,...args).all()).results;}
async function one(db,sql,...args){return stmt(db,sql,...args).first();}
async function run(db,sql,...args){return stmt(db,sql,...args).run();}
async function body(request){const raw=await request.text();if(raw.length>16384)throw new APIError('請求內容過大',413);try{return raw?JSON.parse(raw):{};}catch{throw new APIError('無效的 JSON');}}
function sessionCookie(request,id){return `argus_demo=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=172800${new URL(request.url).protocol==='https:'?'; Secure':''}`;}
async function getSession(request,db){const id=request.headers.get('cookie')?.match(/(?:^|;\s*)argus_demo=([a-f0-9-]{36})(?:;|$)/)?.[1];return id?one(db,'SELECT * FROM demo_sessions WHERE id=?',id):null;}
async function createSession(db,now){const id=uuid(),token=uuid();await db.batch([stmt(db,'INSERT INTO demo_sessions(id,join_token,created_at,settings) VALUES(?,?,?,?)',id,token,now,JSON.stringify(DEFAULT_SETTINGS)),...CAMERA_NAMES.map((name,i)=>stmt(db,'INSERT INTO demo_cameras(session_id,id,name,zone,people) VALUES(?,?,?,?,?)',id,'cam'+String(i+1).padStart(2,'0'),name,String.fromCharCode(65+Math.floor(i/2)),5+i%5))]);return {id,join_token:token,created_at:now,settings:JSON.stringify(DEFAULT_SETTINGS)};}
async function log(db,sid,now,action,detail,event=null,camera=null,actor='控制中心'){return run(db,'INSERT INTO demo_logs(id,session_id,event_id,camera_id,at,action,actor,detail) VALUES(?,?,?,?,?,?,?,?)',uuid(),sid,event,camera,now,action,actor,detail);}
async function advanceRules(db,session,now){
 const settings=JSON.parse(session.settings),cameras=await rows(db,'SELECT * FROM demo_cameras WHERE session_id=?',session.id);
 for(const cam of cameras){
  if(!cam.online||cam.scenario==='normal'||cam.fired||cam.scenario_started===null)continue;
  const seconds=settings[cam.scenario+'Seconds'];if(!seconds||now<cam.scenario_started+seconds*1000)continue;
  const id=cam.scenario_key,conditionAt=cam.scenario_started+seconds*1000;
  await db.batch([
   stmt(db,"INSERT OR IGNORE INTO demo_events(id,session_id,camera_id,zone,type,condition_at,notified_at) SELECT ?,session_id,id,zone,?,?,? FROM demo_cameras WHERE session_id=? AND id=? AND scenario_key=? AND fired=0 AND online=1",id,cam.scenario,conditionAt,now,session.id,cam.id,id),
   stmt(db,'UPDATE demo_cameras SET fired=1 WHERE session_id=? AND id=? AND scenario_key=? AND online=1',session.id,cam.id,id),
   stmt(db,"INSERT OR IGNORE INTO demo_logs(id,session_id,event_id,camera_id,at,action,actor,detail) SELECT ?,session_id,id,camera_id,notified_at,'detected','規則服務',? FROM demo_events WHERE id=?",id+'-detected',`${TYPES[cam.scenario]}條件成立，建立分區通知（模擬輸入）`,id)
  ]);
 }
 const pending=await rows(db,"SELECT * FROM demo_events WHERE session_id=? AND state='pending' AND escalated_at IS NULL AND deleted_at IS NULL AND notified_at<=?",session.id,now-settings.escalationSeconds*1000);
 for(const ev of pending){await db.batch([stmt(db,"UPDATE demo_events SET escalated_at=? WHERE id=? AND state='pending' AND escalated_at IS NULL",now,ev.id),stmt(db,"INSERT OR IGNORE INTO demo_logs(id,session_id,event_id,camera_id,at,action,actor,detail) SELECT ?,session_id,id,camera_id,escalated_at,'escalated','規則服務','未接案已升級控制中心' FROM demo_events WHERE id=? AND escalated_at IS NOT NULL",ev.id+'-escalated',ev.id)]);}
}
async function snapshot(db,session,now){
 await advanceRules(db,session,now);
 const cameras=await rows(db,'SELECT * FROM demo_cameras WHERE session_id=? ORDER BY id',session.id),events=await rows(db,'SELECT * FROM demo_events WHERE session_id=? AND deleted_at IS NULL ORDER BY notified_at DESC LIMIT 100',session.id),logs=await rows(db,'SELECT * FROM demo_logs WHERE session_id=? ORDER BY at DESC LIMIT 200',session.id);
 const acked=events.filter(e=>e.ack_at!==null),stats={online:cameras.filter(c=>c.online).length,total:10,pending:events.filter(e=>e.state==='pending').length,active:events.filter(e=>['ack','arrived'].includes(e.state)).length,closed:events.filter(e=>e.state==='closed').length,escalated:events.filter(e=>e.state==='pending'&&e.escalated_at).length,averageAckSeconds:acked.length?Math.round(acked.reduce((n,e)=>n+(e.ack_at-e.notified_at)/1000,0)/acked.length*10)/10:null};
 return {serverTime:now,session:{id:session.id,joinToken:session.join_token},settings:JSON.parse(session.settings),cameras,events,logs,stats,simulation:true,backend:'persistent',storage:'SQL',ruleVersion:'demo-2.0'};
}
export async function handleAPI(request,env,now=Date.now()){
 try{
  const db=env.DB;if(!db)throw new APIError('後端資料庫尚未連接',503);
  const url=new URL(request.url),path=url.pathname,method=request.method;
  if(!['GET','POST','PATCH'].includes(method))throw new APIError('不支援的方法',405);
  if(method!=='GET'&&request.headers.get('origin')&&request.headers.get('origin')!==url.origin)throw new APIError('不允許跨站操作',403);
  if(path==='/api/health')return json({ok:!!(await one(db,'SELECT 1 AS ok')),simulation:true,cameras:10,backend:'persistent'});
  if(path==='/api/join'&&method==='GET'){
   const token=url.searchParams.get('token');if(!token||!/^[a-f0-9-]{36}$/.test(token))throw new APIError('值班連結無效');
   const session=await one(db,'SELECT * FROM demo_sessions WHERE join_token=?',token);if(!session)throw new APIError('值班連結不存在或已失效',404);
   return new Response(null,{status:303,headers:{location:'/operator','set-cookie':sessionCookie(request,session.id),'cache-control':'no-store'}});
  }
  let session=await getSession(request,db);let cookie;
  if(path==='/api/bootstrap'&&method==='GET'){if(!session){session=await createSession(db,now);cookie=sessionCookie(request,session.id);}return json(await snapshot(db,session,now),200,cookie?{'set-cookie':cookie}:{});}
  if(!session)throw new APIError('請先初始化展示工作區',401);
  if(path==='/api/state'&&method==='GET')return json(await snapshot(db,session,now));
  if(path==='/api/scenarios'&&method==='POST'){
   const input=await body(request);if(!TYPES[input.type]&&input.type!=='normal')throw new APIError('無效的展示情境');if(typeof input.cameraId!=='string'||!/^cam\d{2}$/.test(input.cameraId))throw new APIError('無效的鏡頭編號');
   const cam=await one(db,'SELECT * FROM demo_cameras WHERE session_id=? AND id=?',session.id,input.cameraId);if(!cam)throw new APIError('找不到鏡頭',404);if(!cam.online)throw new APIError('鏡頭離線，無法開始判讀',409);
   const limit=await one(db,'SELECT COUNT(*) AS n FROM demo_events WHERE session_id=? AND deleted_at IS NULL',session.id);if(limit.n>=100)throw new APIError('本次展示已達100事件，請重置後繼續',409);
   await run(db,'UPDATE demo_cameras SET scenario=?,scenario_started=?,scenario_key=?,fired=0,people=? WHERE session_id=? AND id=?',input.type,input.type==='normal'?null:now,uuid(),input.type==='crowd'?JSON.parse(session.settings).crowdThreshold+6:5+Number(cam.id.slice(-2))%5,session.id,cam.id);
   await log(db,session.id,now,'scenario',input.type==='normal'?'恢復正常模擬畫面':`啟動${TYPES[input.type]}模擬輸入`,null,cam.id);
   return json(await snapshot(db,session,now),201);
  }
  const cameraRoute=path.match(/^\/api\/cameras\/(cam\d{2})$/);
  if(cameraRoute&&method==='PATCH'){
   const input=await body(request),cam=await one(db,'SELECT * FROM demo_cameras WHERE session_id=? AND id=?',session.id,cameraRoute[1]);if(!cam)throw new APIError('找不到鏡頭',404);
   if(input.online!==undefined&&typeof input.online!=='boolean')throw new APIError('連線狀態無效');if(input.zone!==undefined&&!/^[A-E]$/.test(input.zone))throw new APIError('分區無效');
   const online=input.online===undefined?cam.online:Number(input.online);await run(db,"UPDATE demo_cameras SET online=?,zone=?,scenario=CASE WHEN ?=0 THEN 'normal' ELSE scenario END,scenario_started=CASE WHEN ?=0 THEN NULL ELSE scenario_started END WHERE session_id=? AND id=?",online,input.zone||cam.zone,online,online,session.id,cam.id);
   await log(db,session.id,now,'camera',`${cam.id} ${online?'連線':'失聯，分析暫停'}，分區${input.zone||cam.zone}`,null,cam.id);return json(await snapshot(db,session,now));
  }
  if(path==='/api/settings'&&method==='PATCH'){
   const input=await body(request),settings=JSON.parse(session.settings),limits={fallSeconds:[.5,30],lowSeconds:[.5,60],crowdSeconds:[.5,60],crowdThreshold:[3,100],escalationSeconds:[1,120]};
   for(const [key,value] of Object.entries(input)){if(!limits[key]||!Number.isFinite(value)||value<limits[key][0]||value>limits[key][1])throw new APIError('規則設定超出範圍');settings[key]=value;}
   session.settings=JSON.stringify(settings);await run(db,'UPDATE demo_sessions SET settings=? WHERE id=?',session.settings,session.id);await log(db,session.id,now,'settings','更新示範規則與升級門檻');return json(await snapshot(db,session,now));
  }
  const eventRoute=path.match(/^\/api\/events\/([a-f0-9-]{36})\/(delivered|ack|arrived|closed)$/);
  if(eventRoute&&method==='POST'){
   const input=await body(request),ev=await one(db,'SELECT * FROM demo_events WHERE session_id=? AND id=? AND deleted_at IS NULL',session.id,eventRoute[1]);if(!ev)throw new APIError('事件不存在',404);
   const action=eventRoute[2],actor=input.actor==='operator'?'分區值班人員':'控制中心';
   if(action==='delivered'){await run(db,'UPDATE demo_events SET delivered_at=COALESCE(delivered_at,?) WHERE id=?',now,ev.id);return json({ok:true});}
   const expected={ack:'pending',arrived:'ack',closed:'arrived'}[action];if(ev.state!==expected)throw new APIError('事件狀態已改變，請重新整理',409);
   const owner=String(input.owner||`${ev.zone}區保全01`).slice(0,60),note=String(input.note||'').slice(0,500),result=String(input.result||'').slice(0,120);
   if(action==='closed'&&!['已完成協助','正常活動／誤報','已轉交現場主管'].includes(result))throw new APIError('請選擇確認結果');
   const column={ack:'ack_at',arrived:'arrived_at',closed:'closed_at'}[action],state=action==='closed'?'closed':action;
   const changes=await run(db,`UPDATE demo_events SET state=?,${column}=?,owner=?,note=?,result=? WHERE id=? AND session_id=? AND state=?`,state,now,owner,action==='closed'?note:ev.note,action==='closed'?result:ev.result,ev.id,session.id,expected);
   if(!changes.meta.changes)throw new APIError('其他人已更新此事件',409);
   await log(db,session.id,now,action,action==='ack'?`${owner}已接案`:action==='arrived'?'人員回報已到場':`結案：${result}`,ev.id,ev.camera_id,actor);return json(await snapshot(db,session,now));
  }
  if(path==='/api/export'&&method==='GET'){
   const events=await rows(db,'SELECT * FROM demo_events WHERE session_id=? AND deleted_at IS NULL ORDER BY notified_at',session.id);
   const fields=['id','camera_id','zone','type','state','condition_at','notified_at','delivered_at','ack_at','arrived_at','closed_at','escalated_at','owner','result','note'];
   const quote=v=>{let s=String(v??'');if(/^[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
   return new Response('\ufeff'+[fields,...events.map(ev=>fields.map(k=>ev[k]))].map(row=>row.map(quote).join(',')).join('\r\n'),{headers:{'content-type':'text/csv; charset=utf-8','content-disposition':'attachment; filename="argus-demo-events.csv"','cache-control':'no-store'}});
  }
  if(path==='/api/reset'&&method==='POST'){
   await db.batch([stmt(db,'UPDATE demo_events SET deleted_at=? WHERE session_id=? AND deleted_at IS NULL',now,session.id),stmt(db,"UPDATE demo_cameras SET online=1,scenario='normal',scenario_started=NULL,fired=0 WHERE session_id=?",session.id)]);await log(db,session.id,now,'reset','重置本次模擬展示，歷史事件已封存');return json(await snapshot(db,session,now));
  }
  throw new APIError('找不到此功能',404);
 }catch(error){if(error instanceof APIError)return json({error:error.message},error.status);console.error('Argus backend error:',error.message);return json({error:'後端暫時無法完成操作，請稍後重試'},500);}
}
