import test from 'node:test';import assert from 'node:assert/strict';import {angle} from './pose-math.mjs';
const p=(x,y,visibility=1)=>({x,y,visibility,presence:1});
test('joint angles use image pixels and reject missing or occluded joints',()=>{
 assert.equal(angle(p(0,.5),p(.5,.5),p(.5,0)),90);
 assert.equal(angle(p(0,.5),p(.5,.5),p(1,.5)),180);
 assert.ok(Math.abs(angle(p(0,0),p(.5,.5),p(1,0),2,1)-126.8699)<.001);
 assert.equal(angle(p(0,0),p(.5,.5,.2),p(1,0)),null);
 assert.equal(angle(p(0,0),p(0,0),p(1,0)),null);
 assert.equal(angle(p(0,0),undefined,p(1,0)),null);
});
