// Run with: node --test tests/wallet.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/wallet.js'),'utf8');
async function run({response,responses,connectError,fetchError,phantom=true,lang='en'}={}){
 const button={disabled:false,textContent:'Connect wallet',addEventListener(_,handler){this.click=handler}};
 let fallbackLink;
 const status={textContent:'Not connected',dataset:{}},balance={textContent:'—',insertAdjacentElement(_,el){fallbackLink=el}};
 const elements={'connect-wallet':button,'wallet-status':status,'dnch-balance':balance};
 let calls=0,request;
 const provider={isPhantom:true,async connect(){if(connectError)throw connectError;return {publicKey:{toString:()=> 'FL7GW7testWalletAddresszzqZev'}}}};
 const context={
  document:{documentElement:{lang},getElementById:id=>elements[id],createElement:()=>({style:{}})},
  window:{phantom:phantom?{solana:provider}:undefined},
  fetch:async(url,opts)=>{if(url.includes('/functions/v1/dnch-wallet-balance'))return {ok:false,status:503};calls++;request=JSON.parse(opts.body);if(fetchError)throw fetchError;return responses?.[calls-1]??response??{ok:true,json:async()=>({result:{value:[]}})}},
  AbortController, setTimeout,clearTimeout,BigInt,console:{warn(){}}
 };
 vm.runInNewContext(source,context);
 await button.click();
 return {button,status,balance,calls,request,fallbackLink};
}
const account=amount=>({account:{data:{parsed:{info:{tokenAmount:{amount}}}}}});
test('zero token accounts displays 0 DNCH',async()=>{
 const x=await run();assert.equal(x.balance.textContent,'0 DNCH');assert.equal(x.calls,1);
 assert.equal(x.request.method,'getTokenAccountsByOwner');
 assert.equal(x.request.params[1].mint,'8Ku27a4FnfzGmkLMQck3haKKAt4SJ4fmaCZDvrLtNSgi');
});
test('token balances sum exactly across accounts',async()=>{
 const x=await run({response:{ok:true,json:async()=>({result:{value:[account('1010000000000'),account('123456789')]}})}});
 assert.equal(x.balance.textContent,'1,010.123456789 DNCH');
 assert.equal(x.button.textContent,'Refresh balance');
});
test('rate limiting shows useful error, not zero',async()=>{
 const x=await run({response:{ok:false,status:429}});
 assert.match(x.balance.textContent,/429/);assert.equal(x.button.disabled,false);
});
test('RPC errors show retry message',async()=>{
 const x=await run({response:{ok:true,json:async()=>({error:{code:-32005,message:'Limit exceeded'}})}});
 assert.match(x.balance.textContent,/RPC/);
});
test('wallet rejection is shown without fetching balance',async()=>{
 const x=await run({connectError:{code:4001},lang:'bg'});
 assert.match(x.status.textContent,/отказано/);assert.equal(x.calls,0);
});
test('Phantom missing avoids network requests',async()=>{
 const x=await run({phantom:false});
 assert.match(x.status.textContent,/unavailable/);assert.equal(x.calls,0);
});
test('malformed RPC payload is not displayed as zero',async()=>{
 const x=await run({response:{ok:true,json:async()=>({result:{value:[account('bad')]}})}});
 assert.match(x.balance.textContent,/Unable to check/);
});

test('403 on first RPC falls back to second endpoint',async()=>{
 const x=await run({responses:[{ok:false,status:403},{ok:true,json:async()=>({result:{value:[account('1010000000000')]}})}]});
 assert.equal(x.calls,2);
 assert.equal(x.balance.textContent,'1,010 DNCH');
 assert.equal(x.fallbackLink,undefined);
});
test('403 on both RPCs offers read-only explorer link',async()=>{
 const x=await run({response:{ok:false,status:403}});
 assert.equal(x.calls,2);
 assert.match(x.balance.textContent,/403/);
 assert.match(x.fallbackLink.href,/solscan.io\/account\/FL7GW7testWalletAddresszzqZev/);
 assert.equal(x.fallbackLink.rel,'noopener noreferrer');
});

test('edge balance is preferred when backend responds successfully',async()=>{
 const button={disabled:false,addEventListener(_,cb){this.click=cb}};
 const status={textContent:'',dataset:{}},balance={textContent:'—'};
 const elems={'connect-wallet':button,'wallet-status':status,'dnch-balance':balance};
 let rpcCalls=0;
 const ctx={document:{documentElement:{lang:'en'},getElementById:id=>elems[id]},window:{phantom:{solana:{isPhantom:true,connect:async()=>({publicKey:{toString:()=> 'FL7GW7testWalletAddresszzqZev'}})}}},fetch:async(url)=>{if(url.includes('/functions/v1/'))return {ok:true,json:async()=>({raw:'1010000000000',decimals:9})};rpcCalls++;throw Error('Direct RPC should not run');},AbortController,setTimeout,clearTimeout,BigInt,console:{warn(){}}};
 vm.runInNewContext(source,ctx);await button.click();
 assert.equal(balance.textContent,'1,010 DNCH');assert.equal(rpcCalls,0);
});
