import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
test('nine recordings have distinct decoded frames, changing model output and matching video provenance',async()=>{
 for(let i=1;i<=9;i++){
  const id='cam'+String(i).padStart(2,'0'),record=JSON.parse(await readFile(new URL('./media/pose-'+id+'.json',import.meta.url),'utf8'));
  const video=await readFile(new URL('./media/'+id+'.mp4',import.meta.url));
  assert.equal(record.camera,id);assert.equal(record.sourceSha256,createHash('sha256').update(video).digest('hex'));assert.equal(record.sampleSeconds,.12);
  assert.equal(record.frames.length,167);assert.ok(new Set(record.frames.map(f=>f.signature)).size>150,id+' must contain different real video frames');
  assert.ok(record.frames.every((f,n)=>f.t===Number((n*.12).toFixed(3))&&f.poses.length<=3));
  const detected=record.frames.filter(f=>f.poses.length);if(detected.length>1)assert.ok(new Set(detected.map(f=>JSON.stringify(f.poses))).size>1,id+' poses must not be copied between frames');
  for(const frame of detected)for(const pose of frame.poses){assert.equal(pose.length,33);assert.ok(pose.every(p=>p.length===4&&p.every(Number.isFinite)));}
 }
});
