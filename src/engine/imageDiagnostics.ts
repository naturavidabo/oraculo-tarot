import { tarotCards } from '../data/cards';
import { cardImageCandidates } from '../data/cardImages';

export type ImageDiagnosticItem={cardId:string;name:string;ok:boolean;source?:string};
export type ImageDiagnosticResult={ok:boolean;loaded:number;total:number;failed:ImageDiagnosticItem[];items:ImageDiagnosticItem[]};

const TIMEOUT=6500;
function testSource(src:string){
  return new Promise<boolean>(resolve=>{
    const img=new Image();
    let done=false;
    const finish=(ok:boolean)=>{if(done)return;done=true;clearTimeout(timer);img.onload=null;img.onerror=null;resolve(ok)};
    const timer=window.setTimeout(()=>finish(false),TIMEOUT);
    img.referrerPolicy='no-referrer';img.onload=()=>finish(true);img.onerror=()=>finish(false);img.src=src;
  });
}

async function testCard(cardId:string,name:string):Promise<ImageDiagnosticItem>{
  for(const source of cardImageCandidates(cardId)){
    if(await testSource(source)) return {cardId,name,ok:true,source};
  }
  return {cardId,name,ok:false};
}

export async function runImageDiagnostic(onProgress?:(done:number,total:number)=>void):Promise<ImageDiagnosticResult>{
  const items:ImageDiagnosticItem[]=[];
  const queue=[...tarotCards];
  let done=0;
  const worker=async()=>{
    while(queue.length){
      const card=queue.shift(); if(!card) break;
      items.push(await testCard(card.id,card.name));
      done++;onProgress?.(done,tarotCards.length);
    }
  };
  await Promise.all(Array.from({length:6},()=>worker()));
  const failed=items.filter(x=>!x.ok);
  return {ok:failed.length===0,loaded:items.length-failed.length,total:items.length,failed,items};
}
