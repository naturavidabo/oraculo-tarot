import { tarotCards, tarotCardById } from '../data/cards';
import { cardImagePath } from '../data/cardImages';
import type { Orientation } from '../types/tarot';

export type CameraCandidate={
  cardId:string;
  cardName:string;
  orientation:Orientation;
  score:number;
};

const W=20;
const H=32;
const referenceCache=new Map<string,Float32Array>();

function loadImage(src:string|Blob){
  return new Promise<HTMLImageElement>((resolve,reject)=>{
    const img=new Image();
    const objectUrl=src instanceof Blob?URL.createObjectURL(src):'';
    img.onload=()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);resolve(img)};
    img.onerror=()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);reject(new Error('IMAGE_LOAD_FAILED'))};
    img.src=typeof src==='string'?src:objectUrl;
  });
}

function cropRect(img:HTMLImageElement){
  // Proporción aproximada de una carta Rider-Waite. Se recorta el centro para
  // que el usuario pueda fotografiar la carta dentro de la guía de cámara.
  const target=.58;
  const ratio=img.width/img.height;
  if(ratio>target){
    const width=img.height*target;
    return {sx:(img.width-width)/2,sy:0,sw:width,sh:img.height};
  }
  const height=img.width/target;
  return {sx:0,sy:(img.height-height)/2,sw:img.width,sh:height};
}

function signatureFromImage(img:HTMLImageElement){
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx) throw new Error('CANVAS_UNAVAILABLE');
  const {sx,sy,sw,sh}=cropRect(img);
  ctx.drawImage(img,sx,sy,sw,sh,0,0,W,H);
  const data=ctx.getImageData(0,0,W,H).data;
  const raw=new Float32Array(W*H);
  let sum=0;
  for(let i=0,p=0;i<data.length;i+=4,p++){
    const y=data[i]*.299+data[i+1]*.587+data[i+2]*.114;
    raw[p]=y;sum+=y;
  }
  const mean=sum/raw.length;
  let variance=0;
  for(const v of raw) variance+=(v-mean)*(v-mean);
  const std=Math.sqrt(variance/raw.length)||1;
  for(let i=0;i<raw.length;i++) raw[i]=(raw[i]-mean)/std;
  return raw;
}

function rotate180(sig:Float32Array){
  const out=new Float32Array(sig.length);
  for(let i=0;i<sig.length;i++) out[i]=sig[sig.length-1-i];
  return out;
}

function difference(a:Float32Array,b:Float32Array){
  let total=0;
  for(let i=0;i<a.length;i++) total+=Math.abs(a[i]-b[i]);
  return total/a.length;
}

async function referenceSignature(cardId:string){
  const cached=referenceCache.get(cardId);if(cached)return cached;
  const img=await loadImage(cardImagePath(cardId));
  const sig=signatureFromImage(img);referenceCache.set(cardId,sig);return sig;
}

export async function recognizeTarotCard(file:File,onProgress?:(done:number,total:number)=>void):Promise<CameraCandidate[]>{
  const photo=await loadImage(file);
  const query=signatureFromImage(photo);
  const results:CameraCandidate[]=[];
  let done=0;
  const queue=[...tarotCards];
  const worker=async()=>{
    while(queue.length){
      const card=queue.shift();if(!card)break;
      try{
        const ref=await referenceSignature(card.id);
        const normal=difference(query,ref);
        const reversed=difference(query,rotate180(ref));
        const diff=Math.min(normal,reversed);
        // Puntaje orientativo, no probabilidad estadística. La confirmación del usuario es obligatoria.
        const score=Math.max(0,Math.min(99,Math.round(100-(diff*24))));
        results.push({cardId:card.id,cardName:card.name,orientation:reversed<normal?'REVERSED':'UPRIGHT',score});
      }catch{/* una referencia local ausente no debe romper toda la comparación */}
      done++;onProgress?.(done,tarotCards.length);
    }
  };
  await Promise.all(Array.from({length:6},()=>worker()));
  return results.sort((a,b)=>b.score-a.score).slice(0,5);
}

export function confirmedCameraCard(cardId:string,orientation:Orientation){
  const card=tarotCardById.get(cardId);if(!card)throw new Error('CARD_UNKNOWN');
  return {cardId,cardName:card.name,orientation};
}
