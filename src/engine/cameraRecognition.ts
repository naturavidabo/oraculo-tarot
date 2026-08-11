import { tarotCards, tarotCardById } from '../data/cards';
import { cardImagePath } from '../data/cardImages';
import type { Orientation } from '../types/tarot';

export type CameraConfidence='HIGH'|'MEDIUM'|'LOW'|'INCONCLUSIVE';
export type CameraCandidate={
  cardId:string;
  cardName:string;
  orientation:Orientation;
  score:number;
  rank:number;
};
export type CameraRecognitionResult={
  candidates:CameraCandidate[];
  all:CameraCandidate[];
  confidence:CameraConfidence;
  margin:number;
  cropMethod:'AUTO_EDGES'|'CENTER_GUIDE';
  cropQuality:number;
};
export type CameraFeedback={
  id:string;
  createdAt:string;
  actualCardId:string;
  predictedCardId?:string;
  actualRank:number;
  topScore:number;
  confidence:CameraConfidence;
};

const TARGET_RATIO=.58;
const ANALYSIS_W=48;
const ANALYSIS_H=80;
const GRID_W=16;
const GRID_H=26;
const EDGE_W=16;
const EDGE_H=26;
const REGION_X=4;
const REGION_Y=6;
const FEEDBACK_KEY='oraculo_camera_feedback_v2';

const referenceCache=new Map<string,{upright:Descriptor;reversed:Descriptor}>();

type CropRect={sx:number;sy:number;sw:number;sh:number};
type Descriptor={
  gray:Float32Array;
  edges:Float32Array;
  rgb:Float32Array;
  hist:Float32Array;
};

function clamp(n:number,min:number,max:number){return Math.max(min,Math.min(max,n));}

function loadImage(src:string|Blob){
  return new Promise<HTMLImageElement>((resolve,reject)=>{
    const img=new Image();
    const objectUrl=src instanceof Blob?URL.createObjectURL(src):'';
    img.onload=()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);resolve(img)};
    img.onerror=()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);reject(new Error('IMAGE_LOAD_FAILED'))};
    img.src=typeof src==='string'?src:objectUrl;
  });
}

function centerCrop(width:number,height:number):CropRect{
  const ratio=width/height;
  if(ratio>TARGET_RATIO){
    const sw=height*TARGET_RATIO;
    return {sx:(width-sw)/2,sy:0,sw,sh:height};
  }
  const sh=width/TARGET_RATIO;
  return {sx:0,sy:(height-sh)/2,sw:width,sh};
}

function luminance(r:number,g:number,b:number){return r*.299+g*.587+b*.114}

function estimateCardRect(img:HTMLImageElement):{rect:CropRect;method:'AUTO_EDGES'|'CENTER_GUIDE';quality:number}{
  const maxW=260,maxH=360;
  const scale=Math.min(maxW/img.width,maxH/img.height,1);
  const w=Math.max(80,Math.round(img.width*scale));
  const h=Math.max(120,Math.round(img.height*scale));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx)return {rect:centerCrop(img.width,img.height),method:'CENTER_GUIDE',quality:0};
  ctx.drawImage(img,0,0,w,h);
  const data=ctx.getImageData(0,0,w,h).data;
  const gray=new Float32Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4;gray[y*w+x]=luminance(data[i],data[i+1],data[i+2]);
  }
  const gx=new Float32Array(w);
  const gy=new Float32Array(h);
  const y0=Math.floor(h*.14), y1=Math.floor(h*.86);
  const x0=Math.floor(w*.14), x1=Math.floor(w*.86);
  for(let x=1;x<w-1;x++){
    let s=0;for(let y=y0;y<y1;y++)s+=Math.abs(gray[y*w+x+1]-gray[y*w+x-1]);
    gx[x]=s/Math.max(1,y1-y0);
  }
  for(let y=1;y<h-1;y++){
    let s=0;for(let x=x0;x<x1;x++)s+=Math.abs(gray[(y+1)*w+x]-gray[(y-1)*w+x]);
    gy[y]=s/Math.max(1,x1-x0);
  }
  const argMax=(arr:Float32Array,a:number,b:number)=>{
    let idx=a,best=-Infinity;for(let i=a;i<=b;i++)if(arr[i]>best){best=arr[i];idx=i}return {idx,best};
  };
  const left=argMax(gx,Math.floor(w*.06),Math.floor(w*.46));
  const right=argMax(gx,Math.floor(w*.54),Math.floor(w*.94));
  const top=argMax(gy,Math.floor(h*.04),Math.floor(h*.46));
  const bottom=argMax(gy,Math.floor(h*.54),Math.floor(h*.96));
  const cw=right.idx-left.idx,ch=bottom.idx-top.idx;
  const ratio=cw/Math.max(1,ch);
  const area=(cw*ch)/(w*h);
  const edgeMean=(left.best+right.best+top.best+bottom.best)/4;
  const quality=clamp(Math.round((edgeMean/28)*55 + (1-Math.abs(ratio-TARGET_RATIO)/TARGET_RATIO)*30 + Math.min(1,area/.55)*15),0,100);
  const plausible=cw>w*.28&&ch>h*.42&&ratio>.42&&ratio<.78&&area>.18&&quality>=38;
  if(!plausible)return {rect:centerCrop(img.width,img.height),method:'CENTER_GUIDE',quality};
  const inv=1/scale;
  const padX=cw*.015,padY=ch*.015;
  const sx=clamp((left.idx-padX)*inv,0,img.width-1);
  const sy=clamp((top.idx-padY)*inv,0,img.height-1);
  const sw=clamp((cw+padX*2)*inv,1,img.width-sx);
  const sh=clamp((ch+padY*2)*inv,1,img.height-sy);
  return {rect:{sx,sy,sw,sh},method:'AUTO_EDGES',quality};
}

function renderNormalized(img:HTMLImageElement,rect:CropRect,rotationDeg=0,zoom=1,dx=0,dy=0){
  const canvas=document.createElement('canvas');canvas.width=ANALYSIS_W;canvas.height=ANALYSIS_H;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('CANVAS_UNAVAILABLE');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,ANALYSIS_W,ANALYSIS_H);
  ctx.save();
  ctx.translate(ANALYSIS_W/2,ANALYSIS_H/2);
  ctx.rotate(rotationDeg*Math.PI/180);
  const dw=ANALYSIS_W*zoom,dh=ANALYSIS_H*zoom;
  const sourceX=clamp(rect.sx+rect.sw*dx,0,Math.max(0,img.width-rect.sw));
  const sourceY=clamp(rect.sy+rect.sh*dy,0,Math.max(0,img.height-rect.sh));
  ctx.drawImage(img,sourceX,sourceY,rect.sw,rect.sh,-dw/2,-dh/2,dw,dh);
  ctx.restore();
  return ctx.getImageData(0,0,ANALYSIS_W,ANALYSIS_H);
}

function downsample(values:Float32Array,srcW:number,srcH:number,dstW:number,dstH:number){
  const out=new Float32Array(dstW*dstH);
  for(let oy=0;oy<dstH;oy++)for(let ox=0;ox<dstW;ox++){
    const x0=Math.floor(ox*srcW/dstW),x1=Math.max(x0+1,Math.floor((ox+1)*srcW/dstW));
    const y0=Math.floor(oy*srcH/dstH),y1=Math.max(y0+1,Math.floor((oy+1)*srcH/dstH));
    let sum=0,n=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){sum+=values[y*srcW+x];n++}
    out[oy*dstW+ox]=sum/Math.max(1,n);
  }
  return out;
}

function zNormalize(values:Float32Array){
  let mean=0;for(const v of values)mean+=v;mean/=values.length;
  let variance=0;for(const v of values)variance+=(v-mean)*(v-mean);
  const std=Math.sqrt(variance/values.length)||1;
  const out=new Float32Array(values.length);for(let i=0;i<values.length;i++)out[i]=(values[i]-mean)/std;
  return out;
}

function rgbToHsv(r:number,g:number,b:number){
  r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
  let h=0;if(d){if(max===r)h=((g-b)/d)%6;else if(max===g)h=(b-r)/d+2;else h=(r-g)/d+4;h/=6;if(h<0)h+=1}
  return [h,max===0?0:d/max,max] as const;
}

function descriptorFromImageData(image:ImageData):Descriptor{
  const {data,width,height}=image;
  const grayFull=new Float32Array(width*height);
  const edgeFull=new Float32Array(width*height);
  const hist=new Float32Array(24); // 12 hue + 6 saturation + 6 value
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const p=y*width+x,i=p*4;const r=data[i],g=data[i+1],b=data[i+2];
    grayFull[p]=luminance(r,g,b);
    const [h,s,v]=rgbToHsv(r,g,b);
    hist[Math.min(11,Math.floor(h*12))]++;
    hist[12+Math.min(5,Math.floor(s*6))]++;
    hist[18+Math.min(5,Math.floor(v*6))]++;
  }
  for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
    const p=y*width+x;
    const gx=(grayFull[p-width+1]+2*grayFull[p+1]+grayFull[p+width+1])-(grayFull[p-width-1]+2*grayFull[p-1]+grayFull[p+width-1]);
    const gy=(grayFull[p+width-1]+2*grayFull[p+width]+grayFull[p+width+1])-(grayFull[p-width-1]+2*grayFull[p-width]+grayFull[p-width+1]);
    edgeFull[p]=Math.sqrt(gx*gx+gy*gy);
  }
  const gray=zNormalize(downsample(grayFull,width,height,GRID_W,GRID_H));
  const edges=zNormalize(downsample(edgeFull,width,height,EDGE_W,EDGE_H));
  const rgb=new Float32Array(REGION_X*REGION_Y*3);
  let ri=0;
  for(let ry=0;ry<REGION_Y;ry++)for(let rx=0;rx<REGION_X;rx++){
    const x0=Math.floor(rx*width/REGION_X),x1=Math.floor((rx+1)*width/REGION_X);
    const y0=Math.floor(ry*height/REGION_Y),y1=Math.floor((ry+1)*height/REGION_Y);
    let sr=0,sg=0,sb=0,n=0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*width+x)*4;sr+=data[i];sg+=data[i+1];sb+=data[i+2];n++}
    rgb[ri++]=sr/Math.max(1,n)/255;rgb[ri++]=sg/Math.max(1,n)/255;rgb[ri++]=sb/Math.max(1,n)/255;
  }
  const pixels=width*height;for(let i=0;i<12;i++)hist[i]/=pixels;for(let i=12;i<18;i++)hist[i]/=pixels;for(let i=18;i<24;i++)hist[i]/=pixels;
  return {gray,edges,rgb,hist};
}

function reverseDescriptor(d:Descriptor):Descriptor{
  const reverseGrid=(src:Float32Array,channels=1)=>{
    const cells=src.length/channels,out=new Float32Array(src.length);
    for(let c=0;c<cells;c++)for(let k=0;k<channels;k++)out[(cells-1-c)*channels+k]=src[c*channels+k];
    return out;
  };
  return {gray:reverseGrid(d.gray),edges:reverseGrid(d.edges),rgb:reverseGrid(d.rgb,3),hist:d.hist};
}

function cosine(a:Float32Array,b:Float32Array){
  let dot=0,aa=0,bb=0;for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i]}
  if(!aa||!bb)return 0;return clamp((dot/Math.sqrt(aa*bb)+1)/2,0,1);
}
function l1Similarity(a:Float32Array,b:Float32Array,scale=1){
  let d=0;for(let i=0;i<a.length;i++)d+=Math.abs(a[i]-b[i]);d/=a.length;
  return clamp(1-d/scale,0,1);
}
function descriptorSimilarity(a:Descriptor,b:Descriptor){
  const structure=cosine(a.gray,b.gray);
  const edges=cosine(a.edges,b.edges);
  const color=l1Similarity(a.rgb,b.rgb,.58);
  const hist=l1Similarity(a.hist,b.hist,.075);
  return edges*.38+structure*.31+color*.21+hist*.10;
}

async function referenceDescriptors(cardId:string){
  const cached=referenceCache.get(cardId);if(cached)return cached;
  const img=await loadImage(cardImagePath(cardId));
  const rect=centerCrop(img.width,img.height);
  const upright=descriptorFromImageData(renderNormalized(img,rect));
  const value={upright,reversed:reverseDescriptor(upright)};
  referenceCache.set(cardId,value);return value;
}

function queryDescriptors(img:HTMLImageElement,rect:CropRect){
  // Variantes pequeñas para tolerar encuadre, zoom e inclinación imperfectos.
  const variants=[
    {r:0,z:1,dx:0,dy:0},
    {r:-4,z:1.03,dx:0,dy:0},{r:4,z:1.03,dx:0,dy:0},
    {r:0,z:1.05,dx:-.025,dy:0},{r:0,z:1.05,dx:.025,dy:0},
    {r:0,z:1.05,dx:0,dy:-.02},{r:0,z:1.05,dx:0,dy:.02},
    {r:-7,z:1.07,dx:0,dy:0},{r:7,z:1.07,dx:0,dy:0},
  ];
  return variants.map(v=>descriptorFromImageData(renderNormalized(img,rect,v.r,v.z,v.dx,v.dy)));
}

function confidenceFor(best:number,second:number):CameraConfidence{
  const margin=best-second;
  if(best>=.82&&margin>=.035)return 'HIGH';
  if(best>=.73&&margin>=.02)return 'MEDIUM';
  if(best>=.63)return 'LOW';
  return 'INCONCLUSIVE';
}

export async function recognizeTarotCard(file:File,onProgress?:(done:number,total:number)=>void):Promise<CameraRecognitionResult>{
  const photo=await loadImage(file);
  const crop=estimateCardRect(photo);
  const queries=queryDescriptors(photo,crop.rect);
  const results:Array<Omit<CameraCandidate,'rank'>&{raw:number}>=[];
  let done=0;
  const queue=[...tarotCards];
  const worker=async()=>{
    while(queue.length){
      const card=queue.shift();if(!card)break;
      try{
        const ref=await referenceDescriptors(card.id);
        let bestNormal=0,bestReversed=0;
        for(const q of queries){bestNormal=Math.max(bestNormal,descriptorSimilarity(q,ref.upright));bestReversed=Math.max(bestReversed,descriptorSimilarity(q,ref.reversed));}
        const raw=Math.max(bestNormal,bestReversed);
        const score=Math.round(clamp((raw-.42)/.52*100,0,99));
        results.push({cardId:card.id,cardName:card.name,orientation:bestReversed>bestNormal?'REVERSED':'UPRIGHT',score,raw});
      }catch{/* referencia ausente: la validación 78/78 la detecta por separado */}
      done++;onProgress?.(done,tarotCards.length);
    }
  };
  await Promise.all(Array.from({length:4},()=>worker()));
  const sorted=results.sort((a,b)=>b.raw-a.raw);
  const all:CameraCandidate[]=sorted.map((x,index)=>({cardId:x.cardId,cardName:x.cardName,orientation:x.orientation,score:x.score,rank:index+1}));
  const best=sorted[0]?.raw??0,second=sorted[1]?.raw??0;
  return {
    candidates:all.slice(0,8),
    all,
    confidence:confidenceFor(best,second),
    margin:Math.round(Math.max(0,best-second)*1000)/10,
    cropMethod:crop.method,
    cropQuality:crop.quality,
  };
}

export function recordCameraFeedback(result:CameraRecognitionResult,actualCardId:string){
  const actual=result.all.find(x=>x.cardId===actualCardId);
  const row:CameraFeedback={
    id:crypto.randomUUID(),createdAt:new Date().toISOString(),actualCardId,
    predictedCardId:result.all[0]?.cardId,actualRank:actual?.rank??79,topScore:result.all[0]?.score??0,confidence:result.confidence,
  };
  let rows:CameraFeedback[]=[];
  try{rows=JSON.parse(localStorage.getItem(FEEDBACK_KEY)||'[]') as CameraFeedback[]}catch{rows=[]}
  rows.push(row);if(rows.length>200)rows=rows.slice(-200);
  localStorage.setItem(FEEDBACK_KEY,JSON.stringify(rows));
  return row;
}

export function cameraFeedbackSummary(){
  let rows:CameraFeedback[]=[];
  try{rows=JSON.parse(localStorage.getItem(FEEDBACK_KEY)||'[]') as CameraFeedback[]}catch{rows=[]}
  const top1=rows.filter(x=>x.actualRank===1).length;
  const top5=rows.filter(x=>x.actualRank<=5).length;
  const avgRank=rows.length?rows.reduce((s,x)=>s+x.actualRank,0)/rows.length:0;
  return {samples:rows.length,top1,top5,avgRank:Math.round(avgRank*10)/10,rows};
}

export function confirmedCameraCard(cardId:string,orientation:Orientation){
  const card=tarotCardById.get(cardId);if(!card)throw new Error('CARD_UNKNOWN');
  return {cardId,cardName:card.name,orientation};
}
