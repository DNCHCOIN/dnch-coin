(()=>{
'use strict';
const MINT='8Ku27a4FnfzGmkLMQck3haKKAt4SJ4fmaCZDvrLtNSgi';
const RPCS=['https://solana-rpc.publicnode.com','https://api.mainnet.solana.com'];
const bg=document.documentElement.lang==='bg';
const t=(en,bul)=>bg?bul:en;
const button=document.getElementById('connect-wallet');
const status=document.getElementById('wallet-status');
const balance=document.getElementById('dnch-balance');
if(!button||!status||!balance)return;
const message=(error)=>{
 if(error?.name==='AbortError')return t('Solana lookup timed out. Please retry.','Проверката в Solana изтече. Опитайте отново.');
 if(error?.code===4001)return t('Wallet connection was cancelled.','Свързването с портфейла беше отказано.');
 if(error?.status===429)return t('Solana server is busy (429). Please retry later.','Сървърът на Solana е претоварен (429). Опитайте по-късно.');
 if(error?.status)return t('Solana server error ('+error.status+'). Please retry.','Грешка от сървъра на Solana ('+error.status+'). Опитайте отново.');
 if(error?.rpcError)return t('Solana RPC rejected the lookup. Please retry later.','Solana RPC отказа проверката. Опитайте по-късно.');
 return t('Unable to check balance. Check connection and retry.','Балансът не може да се провери. Проверете връзката и опитайте отново.');
};
const format=(raw)=>{
 const n=BigInt(raw);
 const whole=(n/1000000000n).toLocaleString('en-US');
 const fraction=(n%1000000000n).toString().padStart(9,'0').replace(/0+$/,'');
 return whole+(fraction?'.'+fraction:'')+' DNCH';
};
button.addEventListener('click',async()=>{
 const provider=window.phantom?.solana||(window.solana?.isPhantom?window.solana:null);
 if(!provider?.isPhantom){status.textContent=t('Phantom is unavailable in this browser.','Phantom не е наличен в този браузър.');return;}
 button.disabled=true;
 let connected=false;
 try{
  const conn=await provider.connect();
  const address=conn.publicKey.toString();
  connected=true;
  status.textContent=address.slice(0,6)+'…'+address.slice(-6);
  balance.textContent=t('Checking…','Проверка…');
  let payload,lastError;
  for(const rpc of RPCS){
   const controller=new AbortController();
   const timeout=setTimeout(()=>controller.abort(),10000);
   try{
    const response=await fetch(rpc,{
     method:'POST',
     headers:{'Content-Type':'application/json'},
     signal:controller.signal,
     body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getTokenAccountsByOwner',params:[address,{mint:MINT},{encoding:'jsonParsed',commitment:'confirmed'}]})
    });
    if(!response.ok){const e=new Error('HTTP '+response.status);e.status=response.status;throw e;}
    const data=await response.json();
    if(data.error){const e=new Error('Solana RPC error');e.rpcError=true;throw e;}
    if(!Array.isArray(data.result?.value))throw new Error('Invalid RPC response');
    payload=data;
    break;
   }catch(error){
    lastError=error;
    console.warn('DNCH RPC lookup failed:',rpc,error);
   }finally{clearTimeout(timeout);}
  }
  if(!payload)throw lastError||new Error('All RPC endpoints unavailable');
  const raw=payload.result.value.reduce((sum,account)=>{
   const amount=account.account?.data?.parsed?.info?.tokenAmount?.amount;
   if(typeof amount!=='string'||!/^[0-9]+$/.test(amount))throw new Error('Invalid token amount');
   return sum+BigInt(amount);
  },0n);
  balance.textContent=format(raw);
  button.textContent=t('Refresh balance','Обнови баланса');
 }catch(error){
  console.warn('DNCH wallet lookup:',error);
  if(connected)balance.textContent=message(error);
  else status.textContent=message(error);
 }finally{button.disabled=false;}
});
})();