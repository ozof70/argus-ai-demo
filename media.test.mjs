import test from 'node:test';
import assert from 'node:assert/strict';
import {mediaResponse} from './media-response.mjs';
test('serves seekable video ranges and handles HEAD without a body',async()=>{
 const bytes=new Uint8Array([0,1,2,3,4,5]);
 const partial=mediaResponse(new Request('https://demo.test/media/a.mp4',{headers:{range:'bytes=2-4'}}),bytes,'video/mp4');
 assert.equal(partial.status,206);assert.equal(partial.headers.get('content-range'),'bytes 2-4/6');assert.deepEqual([...new Uint8Array(await partial.arrayBuffer())],[2,3,4]);
 const suffix=mediaResponse(new Request('https://demo.test/media/a.mp4',{headers:{range:'bytes=-2'}}),bytes,'video/mp4');assert.deepEqual([...new Uint8Array(await suffix.arrayBuffer())],[4,5]);
 const invalid=mediaResponse(new Request('https://demo.test/media/a.mp4',{headers:{range:'bytes=9-10'}}),bytes,'video/mp4');assert.equal(invalid.status,416);
 const head=mediaResponse(new Request('https://demo.test/media/a.mp4',{method:'HEAD'}),bytes,'video/mp4');assert.equal(head.headers.get('content-length'),'6');assert.equal((await head.arrayBuffer()).byteLength,0);
});
