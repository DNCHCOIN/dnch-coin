'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('assets/forum.js','utf8');
const line=source.split('\n').find(s=>s.startsWith('const forumPostError='));
assert.ok(line,'Forum error translator must exist');
function translate(bg,error){
 const context={bg,T:{invalid:'invalid input',error:'generic error'},String};
 return vm.runInNewContext(line+';forumPostError(error)',{...context,error});
}
test('duplicate topic and reply errors are understandable in both languages',()=>{
 for(const message of ['Duplicate topic; please edit your previous post','Duplicate reply; please avoid reposting']){
  assert.match(translate(true,{message}),/10 минути/);
  assert.match(translate(false,{message}),/10 minutes/);
 }
});
test('rate limits give specific localized delays',()=>{
 assert.match(translate(true,{message:'Wait a minute before creating another topic'}),/60 секунди/);
 assert.match(translate(false,{message:'Wait a minute before creating another topic'}),/60 seconds/);
 assert.match(translate(true,{message:'Wait before replying again'}),/15 секунди/);
 assert.match(translate(false,{message:'Wait before replying again'}),/15 seconds/);
});
test('unknown and validation errors have safe fallback',()=>{
 assert.equal(translate(false,{message:'unexpected'}),'generic error');
 assert.equal(translate(false,{code:'23514'}),'invalid input');
 assert.equal(translate(true,null),'generic error');
});
test('both posting handlers use translated errors',()=>{
 const count=(source.match(/setStatus\(forumPostError\(error\)\)/g)||[]).length;
 assert.equal(count,2);
});
