import test from 'node:test';import assert from 'node:assert/strict';import {frameAt,confident,skeletonColor} from './pose-grid-utils.mjs';
test('recorded skeleton follows video time including loop and seeking without stale poses',()=>{
 const record={sampleSeconds:.125,frames:[{t:0,poses:[1]},{t:.125,poses:[]},{t:.25,poses:[2]}]};
 assert.equal(frameAt(record,.03).index,0);assert.equal(frameAt(record,.13).frame.poses.length,0);assert.equal(frameAt(record,.25).index,2);assert.equal(frameAt(record,0).index,0);assert.equal(frameAt(record,2),null);assert.equal(frameAt(null,.5),null);
});
test('only confident in-frame joints produce lines and unresolved events turn them orange',()=>{
 assert.equal(confident([.4,.5,.9,.9]),true);assert.equal(confident([.4,.5,.2,.9]),false);assert.equal(confident([1.2,.5,.9,.9]),false);assert.equal(confident([NaN,.5,.9,.9]),false);assert.equal(skeletonColor(false),'#25d486');assert.equal(skeletonColor(true),'#ff9a38');
});
