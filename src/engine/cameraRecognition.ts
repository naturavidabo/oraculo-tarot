import { tarotCards, tarotCardById } from '../data/cards';
import { cardImagePath } from '../data/cardImages';
import type { Orientation } from '../types/tarot';

export type CameraConfidence='HIGH'|'MEDIUM'|'LOW'|'INCONCLUSIVE';
export type CameraOrientationConfidence='HIGH'|'MEDIUM'|'LOW'|'AMBIGUOUS';
export type CameraPoint={x:number;y:number};
export type CameraCorners=[CameraPoint,CameraPoint,CameraPoint,CameraPoint];
export type CameraRecognitionOptions={corners?:CameraCorners};
export type CameraFramingStatus='GOOD'|'ADJUST'|'MULTIPLE_SUSPECTED';
export type CameraFramingInspection={status:CameraFramingStatus;quality:number;method:'AUTO_EDGES'|'CENTER_GUIDE';message:string;observedRatio:number;multipleEvidence:number};
export type CameraCandidate={
  cardId:string;
  cardName:string;
  orientation:Orientation;
  orientationConfidence:CameraOrientationConfidence;
  orientationMargin:number;
  score:number;
  rank:number;
};
export type CameraRecognitionResult={
  candidates:CameraCandidate[];
  all:CameraCandidate[];
  confidence:CameraConfidence;
  margin:number;
  cropMethod:'AUTO_EDGES'|'CENTER_GUIDE'|'MANUAL_CORNERS';
  cropQuality:number;
  framingWarning:boolean;
  framingStatus:CameraFramingStatus;
  framingMessage:string;
  cropHypothesesTested:number;
  confidenceScore:number;
  recognitionStability:number;
};
export type CameraFeedback={
  id:string;
  createdAt:string;
  actualCardId:string;
  predictedCardId?:string;
  actualRank:number;
  topScore:number;
  confidence:CameraConfidence;
  predictedOrientation?:Orientation;
  actualOrientation?:Orientation;
  orientationCorrect?:boolean;
};

const TARGET_RATIO=.58;
const ANALYSIS_W=64;
const ANALYSIS_H=104;
const GRID_W=20;
const GRID_H=34;
const EDGE_W=20;
const EDGE_H=34;
const REGION_X=4;
const REGION_Y=6;
const HOG_X=4;
const HOG_Y=6;
const HOG_BINS=8;
const FINE_W=32;
const FINE_H=54;
const CHROMA_X=8;
const CHROMA_Y=12;
const FEEDBACK_KEY='oraculo_camera_feedback_v2';

const referenceCache=new Map<string,Descriptor>();

type CropRect={sx:number;sy:number;sw:number;sh:number};
type Descriptor={
  gray:Float32Array;
  edges:Float32Array;
  rgb:Float32Array;
  hist:Float32Array;
  hog:Float32Array;
  fineGray:Float32Array;
  chroma:Float32Array;
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

function insetCrop(rect:CropRect,factor:number):CropRect{
  const px=rect.sw*factor,py=rect.sh*factor;
  return {sx:rect.sx+px,sy:rect.sy+py,sw:rect.sw-px*2,sh:rect.sh-py*2};
}

function luminance(r:number,g:number,b:number){return r*.299+g*.587+b*.114}


function quickRegionCardLikelihood(gray:Float32Array,w:number,h:number,rx0:number,ry0:number,rx1:number,ry1:number){
  const xStart=Math.max(1,Math.floor(w*rx0)),xEnd=Math.min(w-2,Math.floor(w*rx1));
  const yStart=Math.max(1,Math.floor(h*ry0)),yEnd=Math.min(h-2,Math.floor(h*ry1));
  const rw=Math.max(4,xEnd-xStart),rh=Math.max(4,yEnd-yStart);
  const gx=new Float32Array(rw),gy=new Float32Array(rh);
  for(let lx=1;lx<rw-1;lx++){
    const x=xStart+lx;let sum=0;
    for(let y=yStart;y<yEnd;y++)sum+=Math.abs(gray[y*w+x+1]-gray[y*w+x-1]);
    gx[lx]=sum/Math.max(1,rh);
  }
  for(let ly=1;ly<rh-1;ly++){
    const y=yStart+ly;let sum=0;
    for(let x=xStart;x<xEnd;x++)sum+=Math.abs(gray[(y+1)*w+x]-gray[(y-1)*w+x]);
    gy[ly]=sum/Math.max(1,rw);
  }
  const argMax=(arr:Float32Array,a:number,b:number)=>{let idx=a,best=-Infinity;for(let i=a;i<=b;i++)if(arr[i]>best){best=arr[i];idx=i}return {idx,best}};
  const left=argMax(gx,Math.floor(rw*.02),Math.floor(rw*.46));
  const right=argMax(gx,Math.floor(rw*.54),Math.floor(rw*.98));
  const top=argMax(gy,Math.floor(rh*.02),Math.floor(rh*.46));
  const bottom=argMax(gy,Math.floor(rh*.54),Math.floor(rh*.98));
  const cw=right.idx-left.idx,ch=bottom.idx-top.idx;
  const ratio=cw/Math.max(1,ch),area=(cw*ch)/(rw*rh);
  const edge=(left.best+right.best+top.best+bottom.best)/4;
  const ratioQuality=1-Math.min(1,Math.abs(ratio-TARGET_RATIO)/TARGET_RATIO);
  const quality=clamp(Math.round((edge/28)*50+ratioQuality*34+Math.min(1,area/.52)*16),0,100);
  return {plausible:cw>rw*.28&&ch>rh*.42&&ratio>.40&&ratio<.80&&area>.16&&quality>=42,quality,ratio};
}

function multipleCardEvidence(gray:Float32Array,w:number,h:number){
  const left=quickRegionCardLikelihood(gray,w,h,0,.03,.62,.97);
  const right=quickRegionCardLikelihood(gray,w,h,.38,.03,1,.97);
  const top=quickRegionCardLikelihood(gray,w,h,.03,0,.97,.62);
  const bottom=quickRegionCardLikelihood(gray,w,h,.03,.38,.97,1);
  const horizontal=left.plausible&&right.plausible?Math.min(left.quality,right.quality):0;
  const vertical=top.plausible&&bottom.plausible?Math.min(top.quality,bottom.quality):0;
  return Math.max(horizontal,vertical);
}

function estimateCardRect(img:HTMLImageElement):{rect:CropRect;method:'AUTO_EDGES'|'CENTER_GUIDE';quality:number;status:CameraFramingStatus;message:string;observedRatio:number;multipleEvidence:number}{
  const maxW=300,maxH=420;
  const scale=Math.min(maxW/img.width,maxH/img.height,1);
  const w=Math.max(80,Math.round(img.width*scale));
  const h=Math.max(120,Math.round(img.height*scale));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx)return {rect:centerCrop(img.width,img.height),method:'CENTER_GUIDE',quality:0,status:'ADJUST',message:'No se pudo evaluar el encuadre. Usa los cuatro bordes visibles.',observedRatio:0,multipleEvidence:0};
  ctx.drawImage(img,0,0,w,h);
  const data=ctx.getImageData(0,0,w,h).data;
  const gray=new Float32Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4;gray[y*w+x]=luminance(data[i],data[i+1],data[i+2]);
  }
  const multipleEvidence=multipleCardEvidence(gray,w,h);
  const gx=new Float32Array(w),gy=new Float32Array(h);
  const y0=Math.floor(h*.08),y1=Math.floor(h*.92),x0=Math.floor(w*.08),x1=Math.floor(w*.92);
  for(let x=1;x<w-1;x++){let sum=0;for(let y=y0;y<y1;y++)sum+=Math.abs(gray[y*w+x+1]-gray[y*w+x-1]);gx[x]=sum/Math.max(1,y1-y0)}
  for(let y=1;y<h-1;y++){let sum=0;for(let x=x0;x<x1;x++)sum+=Math.abs(gray[(y+1)*w+x]-gray[(y-1)*w+x]);gy[y]=sum/Math.max(1,x1-x0)}
  const argMax=(arr:Float32Array,a:number,b:number)=>{let idx=a,best=-Infinity;for(let i=a;i<=b;i++)if(arr[i]>best){best=arr[i];idx=i}return {idx,best}};
  const left=argMax(gx,Math.floor(w*.02),Math.floor(w*.48));
  const right=argMax(gx,Math.floor(w*.52),Math.floor(w*.98));
  const top=argMax(gy,Math.floor(h*.015),Math.floor(h*.48));
  const bottom=argMax(gy,Math.floor(h*.52),Math.floor(h*.985));
  const cw=right.idx-left.idx,ch=bottom.idx-top.idx;
  const ratio=cw/Math.max(1,ch),area=(cw*ch)/(w*h);
  const edgeMean=(left.best+right.best+top.best+bottom.best)/4;
  const ratioQuality=1-Math.min(1,Math.abs(ratio-TARGET_RATIO)/TARGET_RATIO);
  const quality=clamp(Math.round((edgeMean/30)*48 + ratioQuality*34 + Math.min(1,area/.55)*18),0,100);
  const plausible=cw>w*.24&&ch>h*.38&&ratio>.41&&ratio<.77&&area>.15&&quality>=38;
  const multipleLike=multipleEvidence>=48||(!plausible&&quality>=55&&(ratio>.84||ratio<.34)&&area>.20);
  if(multipleLike){
    return {rect:centerCrop(img.width,img.height),method:'CENTER_GUIDE',quality:Math.max(quality,multipleEvidence),status:'MULTIPLE_SUSPECTED',message:'Se detectan dos zonas con forma de carta o un encuadre incompatible con una sola carta. En este modo usa una sola carta o encierra una con 4 esquinas.',observedRatio:ratio,multipleEvidence};
  }
  if(!plausible){
    return {rect:centerCrop(img.width,img.height),method:'CENTER_GUIDE',quality,status:'ADJUST',message:'No se aislaron los cuatro bordes con suficiente claridad. Acerca y centra la carta o usa 4 esquinas.',observedRatio:ratio,multipleEvidence};
  }
  const inv=1/scale,padX=cw*.018,padY=ch*.018;
  const sx=clamp((left.idx-padX)*inv,0,img.width-1),sy=clamp((top.idx-padY)*inv,0,img.height-1);
  const sw=clamp((cw+padX*2)*inv,1,img.width-sx),sh=clamp((ch+padY*2)*inv,1,img.height-sy);
  return {rect:{sx,sy,sw,sh},method:'AUTO_EDGES',quality,status:quality>=58?'GOOD':'ADJUST',message:quality>=58?'Encuadre apto: se localizaron bordes compatibles con una carta.':'Se detectó una carta, pero el encuadre puede mejorarse.',observedRatio:ratio,multipleEvidence};
}

export async function inspectTarotPhoto(file:File):Promise<CameraFramingInspection>{
  const photo=await loadImage(file);
  const crop=estimateCardRect(photo);
  return {status:crop.status,quality:crop.quality,method:crop.method,message:crop.message,observedRatio:Math.round(crop.observedRatio*100)/100,multipleEvidence:crop.multipleEvidence};
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

function sourcePixels(img:HTMLImageElement){
  const maxSide=1400;
  const scale=Math.min(1,maxSide/Math.max(img.width,img.height));
  const w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('CANVAS_UNAVAILABLE');
  ctx.drawImage(img,0,0,w,h);
  return {image:ctx.getImageData(0,0,w,h),scale};
}

function bilinearPoint(corners:CameraCorners,u:number,v:number){
  const [tl,tr,br,bl]=corners;
  const x=(1-u)*(1-v)*tl.x+u*(1-v)*tr.x+u*v*br.x+(1-u)*v*bl.x;
  const y=(1-u)*(1-v)*tl.y+u*(1-v)*tr.y+u*v*br.y+(1-u)*v*bl.y;
  return {x,y};
}

function sampleBilinear(data:Uint8ClampedArray,w:number,h:number,x:number,y:number,channel:number){
  const fx=clamp(x,0,w-1),fy=clamp(y,0,h-1);
  const x0=Math.floor(fx),y0=Math.floor(fy),x1=Math.min(w-1,x0+1),y1=Math.min(h-1,y0+1);
  const tx=fx-x0,ty=fy-y0;
  const v00=data[(y0*w+x0)*4+channel],v10=data[(y0*w+x1)*4+channel];
  const v01=data[(y1*w+x0)*4+channel],v11=data[(y1*w+x1)*4+channel];
  return (v00*(1-tx)+v10*tx)*(1-ty)+(v01*(1-tx)+v11*tx)*ty;
}

function renderManualCorners(img:HTMLImageElement,corners:CameraCorners){
  const {image,scale}=sourcePixels(img);
  const out=new Uint8ClampedArray(ANALYSIS_W*ANALYSIS_H*4);
  for(let y=0;y<ANALYSIS_H;y++)for(let x=0;x<ANALYSIS_W;x++){
    const u=(x+.5)/ANALYSIS_W,v=(y+.5)/ANALYSIS_H;
    const p=bilinearPoint(corners,u,v);
    const sx=p.x*img.width*scale,sy=p.y*img.height*scale;
    const i=(y*ANALYSIS_W+x)*4;
    out[i]=sampleBilinear(image.data,image.width,image.height,sx,sy,0);
    out[i+1]=sampleBilinear(image.data,image.width,image.height,sx,sy,1);
    out[i+2]=sampleBilinear(image.data,image.width,image.height,sx,sy,2);
    out[i+3]=255;
  }
  return new ImageData(out,ANALYSIS_W,ANALYSIS_H);
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
  const angleFull=new Float32Array(width*height);
  const hist=new Float32Array(24);
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
    let angle=Math.atan2(gy,gx);if(angle<0)angle+=Math.PI*2;angleFull[p]=angle;
  }
  const hog=new Float32Array(HOG_X*HOG_Y*HOG_BINS);
  for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
    const cx=Math.min(HOG_X-1,Math.floor(x/width*HOG_X));
    const cy=Math.min(HOG_Y-1,Math.floor(y/height*HOG_Y));
    const bin=Math.min(HOG_BINS-1,Math.floor(angleFull[y*width+x]/(Math.PI*2)*HOG_BINS));
    hog[(cy*HOG_X+cx)*HOG_BINS+bin]+=edgeFull[y*width+x];
  }
  for(let cell=0;cell<HOG_X*HOG_Y;cell++){
    let norm=0;for(let b=0;b<HOG_BINS;b++){const v=hog[cell*HOG_BINS+b];norm+=v*v}norm=Math.sqrt(norm)||1;
    for(let b=0;b<HOG_BINS;b++)hog[cell*HOG_BINS+b]/=norm;
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
  const fineGray=zNormalize(downsample(grayFull,width,height,FINE_W,FINE_H));
  const chroma=new Float32Array(CHROMA_X*CHROMA_Y*2);
  let ci=0;
  for(let cy=0;cy<CHROMA_Y;cy++)for(let cx=0;cx<CHROMA_X;cx++){
    const x0=Math.floor(cx*width/CHROMA_X),x1=Math.floor((cx+1)*width/CHROMA_X);
    const y0=Math.floor(cy*height/CHROMA_Y),y1=Math.floor((cy+1)*height/CHROMA_Y);
    let rr=0,gg=0,bb=0,n=0;
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*width+x)*4;rr+=data[i];gg+=data[i+1];bb+=data[i+2];n++}
    rr/=Math.max(1,n);gg/=Math.max(1,n);bb/=Math.max(1,n);
    const sum=rr+gg+bb+1;
    chroma[ci++]=rr/sum;chroma[ci++]=gg/sum;
  }
  const pixels=width*height;for(let i=0;i<12;i++)hist[i]/=pixels;for(let i=12;i<18;i++)hist[i]/=pixels;for(let i=18;i<24;i++)hist[i]/=pixels;
  return {gray,edges,rgb,hist,hog,fineGray,chroma};
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
  const fine=cosine(a.fineGray,b.fineGray);
  const structure=cosine(a.gray,b.gray);
  const edges=cosine(a.edges,b.edges);
  const hog=cosine(a.hog,b.hog);
  const chroma=l1Similarity(a.chroma,b.chroma,.23);
  const color=l1Similarity(a.rgb,b.rgb,.60);
  const hist=l1Similarity(a.hist,b.hist,.075);
  return fine*.24+edges*.20+hog*.16+structure*.13+chroma*.17+color*.07+hist*.03;
}

async function referenceDescriptor(cardId:string){
  const cached=referenceCache.get(cardId);if(cached)return cached;
  const img=await loadImage(cardImagePath(cardId));
  const rect=centerCrop(img.width,img.height);
  const upright=descriptorFromImageData(renderNormalized(img,rect));
  referenceCache.set(cardId,upright);return upright;
}

function rotateImageData180(image:ImageData){
  const out=new Uint8ClampedArray(image.data.length);
  const pixels=image.width*image.height;
  for(let p=0;p<pixels;p++){
    const src=(pixels-1-p)*4,dst=p*4;
    out[dst]=image.data[src];out[dst+1]=image.data[src+1];out[dst+2]=image.data[src+2];out[dst+3]=image.data[src+3];
  }
  return new ImageData(out,image.width,image.height);
}

type QueryOrientations={original:Descriptor[];rotated:Descriptor[]};

function descriptorOrientations(images:ImageData[]):QueryOrientations{
  const original:Descriptor[]=[];
  const rotated:Descriptor[]=[];
  for(const image of images){
    original.push(descriptorFromImageData(image));
    rotated.push(descriptorFromImageData(rotateImageData180(image)));
  }
  return {original,rotated};
}

function rectQueryImages(img:HTMLImageElement,rect:CropRect){
  // Pocas variantes dentro de UN mismo encuadre. Beta 5 evita que cada carta
  // escoja un recorte diferente, que era una fuente de falsos positivos.
  const variants=[
    {r:0,z:1,dx:0,dy:0},
    {r:-3,z:1.02,dx:0,dy:0},{r:3,z:1.02,dx:0,dy:0},
    {r:0,z:1.025,dx:-.012,dy:0},{r:0,z:1.025,dx:.012,dy:0},
  ];
  return variants.map(v=>renderNormalized(img,rect,v.r,v.z,v.dx,v.dy));
}

type CropHypothesis={rect?:CropRect;corners?:CameraCorners;label:string;method:'AUTO_EDGES'|'CENTER_GUIDE'|'MANUAL_CORNERS';quality:number};
function boundedRect(rect:CropRect,img:HTMLImageElement):CropRect{
  const sx=clamp(rect.sx,0,img.width-1),sy=clamp(rect.sy,0,img.height-1);
  return {sx,sy,sw:clamp(rect.sw,1,img.width-sx),sh:clamp(rect.sh,1,img.height-sy)};
}
function scaleRect(rect:CropRect,factor:number,img:HTMLImageElement):CropRect{
  const cx=rect.sx+rect.sw/2,cy=rect.sy+rect.sh/2,sw=rect.sw*factor,sh=rect.sh*factor;
  return boundedRect({sx:cx-sw/2,sy:cy-sh/2,sw,sh},img);
}
function buildCropHypotheses(img:HTMLImageElement,crop:ReturnType<typeof estimateCardRect>,corners?:CameraCorners):CropHypothesis[]{
  if(corners)return [{corners,label:'4 esquinas',method:'MANUAL_CORNERS',quality:100}];
  const center=centerCrop(img.width,img.height);
  const rows:CropHypothesis[]=[];
  if(crop.method==='AUTO_EDGES'){
    rows.push({rect:crop.rect,label:'bordes detectados',method:'AUTO_EDGES',quality:crop.quality});
    rows.push({rect:scaleRect(crop.rect,.96,img),label:'bordes -4%',method:'AUTO_EDGES',quality:Math.max(0,crop.quality-2)});
    rows.push({rect:scaleRect(crop.rect,1.045,img),label:'bordes +4.5%',method:'AUTO_EDGES',quality:Math.max(0,crop.quality-3)});
  }
  rows.push({rect:center,label:'guía central',method:'CENTER_GUIDE',quality:Math.min(crop.quality,72)});
  rows.push({rect:insetCrop(center,.025),label:'guía central ajustada',method:'CENTER_GUIDE',quality:Math.min(crop.quality,68)});
  const unique:CropHypothesis[]=[];
  for(const row of rows){
    if(row.corners){unique.push(row);continue}
    const r=row.rect!;
    if(!unique.some(x=>x.rect&&Math.abs(x.rect.sx-r.sx)<2&&Math.abs(x.rect.sy-r.sy)<2&&Math.abs(x.rect.sw-r.sw)<2&&Math.abs(x.rect.sh-r.sh)<2))unique.push(row);
  }
  return unique.slice(0,5);
}

function queryForHypothesis(img:HTMLImageElement,h:CropHypothesis):QueryOrientations{
  if(h.corners)return descriptorOrientations([renderManualCorners(img,h.corners)]);
  return descriptorOrientations(rectQueryImages(img,h.rect!));
}

function orientationConfidenceFor(best:number,other:number):CameraOrientationConfidence{
  const gap=Math.abs(best-other);
  if(best>=.72&&gap>=.055)return 'HIGH';
  if(best>=.68&&gap>=.034)return 'MEDIUM';
  if(gap>=.018)return 'LOW';
  return 'AMBIGUOUS';
}

function confidenceFor(best:number,second:number):CameraConfidence{
  const margin=best-second;
  if(best>=.70&&margin>=.024)return 'HIGH';
  if(best>=.64&&margin>=.013)return 'MEDIUM';
  if(best>=.58&&margin>=.006)return 'LOW';
  return 'INCONCLUSIVE';
}

function confidenceScoreFor(best:number,second:number,stability:number){
  const margin=Math.max(0,best-second);
  const absolute=clamp((best-.53)/.27,0,1);
  const separation=clamp(margin/.055,0,1);
  return Math.round(clamp(absolute*.48+separation*.40+stability*.12,0,1)*99);
}

type RawCandidate=Omit<CameraCandidate,'rank'>&{raw:number};
type HypothesisEvaluation={hypothesis:CropHypothesis;sorted:RawCandidate[];best:number;second:number;evidence:number;stability:number};

async function evaluateHypothesis(h:CropHypothesis,queries:QueryOrientations,onCard?:()=>void):Promise<HypothesisEvaluation>{
  const rows:RawCandidate[]=[];
  // Se procesa el mazo completo con el MISMO encuadre. La elección del encuadre
  // ocurre entre rankings completos, no carta por carta.
  for(const card of tarotCards){
    try{
      const ref=await referenceDescriptor(card.id);
      const robust=(scores:number[])=>{
        if(!scores.length)return 0;
        const ordered=[...scores].sort((a,b)=>b-a);
        if(ordered.length===1)return ordered[0];
        const top=ordered[0],second=ordered[1],third=ordered[2]??second;
        return top*.55+second*.30+third*.15;
      };
      const uprightScores=queries.original.map(q=>descriptorSimilarity(q,ref));
      const reversedScores=queries.rotated.map(q=>descriptorSimilarity(q,ref));
      const uprightMatch=robust(uprightScores),reversedMatch=robust(reversedScores);
      const raw=Math.max(uprightMatch,reversedMatch);
      const orientation:Orientation=reversedMatch>uprightMatch?'REVERSED':'UPRIGHT';
      const orientationMargin=Math.round(Math.abs(uprightMatch-reversedMatch)*1000)/10;
      const orientationConfidence=orientationConfidenceFor(Math.max(uprightMatch,reversedMatch),Math.min(uprightMatch,reversedMatch));
      const score=Math.round(clamp((raw-.44)/.48*100,0,99));
      rows.push({cardId:card.id,cardName:card.name,orientation,orientationConfidence,orientationMargin,score,raw});
    }catch{/* validación 78/78 independiente */}
    onCard?.();
  }
  const sorted=rows.sort((a,b)=>b.raw-a.raw),best=sorted[0]?.raw??0,second=sorted[1]?.raw??0;
  const margin=Math.max(0,best-second);
  const top3=sorted.slice(0,3).map(x=>x.raw);
  const stability=top3.length>=2?clamp((best-(top3[2]??second))*8,0,1):0;
  // Evidencia global: coincidencia robusta + separación + estabilidad + preferencia por bordes reales.
  const evidence=best + margin*1.55 + stability*.018 + (h.method==='AUTO_EDGES'?Math.min(.018,h.quality/100*0.018):0);
  return {hypothesis:h,sorted,best,second,evidence,stability};
}

export async function recognizeTarotCard(file:File,onProgress?:(done:number,total:number)=>void,options:CameraRecognitionOptions={}):Promise<CameraRecognitionResult>{
  const photo=await loadImage(file);
  const crop=estimateCardRect(photo);
  if(!options.corners&&crop.status==='MULTIPLE_SUSPECTED')throw new Error('MULTIPLE_CARDS_SUSPECTED');
  const hypotheses=buildCropHypotheses(photo,crop,options.corners);
  let done=0;const total=tarotCards.length*hypotheses.length;
  const evaluations:HypothesisEvaluation[]=[];
  for(const hypothesis of hypotheses){
    const q=queryForHypothesis(photo,hypothesis);
    evaluations.push(await evaluateHypothesis(hypothesis,q,()=>{done++;onProgress?.(done,total)}));
  }
  evaluations.sort((a,b)=>b.evidence-a.evidence);
  const chosen=evaluations[0];
  const sorted=chosen?.sorted??[];
  const all:CameraCandidate[]=sorted.map((x,index)=>({
    cardId:x.cardId,cardName:x.cardName,orientation:x.orientation,
    orientationConfidence:x.orientationConfidence,orientationMargin:x.orientationMargin,
    score:x.score,rank:index+1
  }));
  const best=chosen?.best??0,second=chosen?.second??0;
  const confidence=confidenceFor(best,second);
  const framingStatus:CameraFramingStatus=options.corners?'GOOD':crop.status;
  const framingMessage=options.corners?'Encuadre corregido manualmente con cuatro esquinas.':crop.message;
  const framingWarning=framingStatus!=='GOOD';
  return {
    candidates:all.slice(0,12),all,confidence,
    margin:Math.round(Math.max(0,best-second)*1000)/10,
    cropMethod:options.corners?'MANUAL_CORNERS':chosen?.hypothesis.method??crop.method,
    cropQuality:options.corners?100:Math.max(crop.quality,chosen?.hypothesis.quality??0),
    framingWarning,framingStatus,framingMessage,cropHypothesesTested:hypotheses.length,
    confidenceScore:confidenceScoreFor(best,second,chosen?.stability??0),
    recognitionStability:Math.round((chosen?.stability??0)*100),
  };
}

export function recordCameraFeedback(result:CameraRecognitionResult,actualCardId:string,actualOrientation?:Orientation){
  const actual=result.all.find(x=>x.cardId===actualCardId);
  const row:CameraFeedback={
    id:crypto.randomUUID(),createdAt:new Date().toISOString(),actualCardId,
    predictedCardId:result.all[0]?.cardId,actualRank:actual?.rank??79,topScore:result.all[0]?.score??0,confidence:result.confidence,
    predictedOrientation:actual?.orientation,actualOrientation,
    orientationCorrect:actualOrientation&&actual?actual.orientation===actualOrientation:undefined,
  };
  try{
    let rows:CameraFeedback[]=[];
    try{rows=JSON.parse(localStorage.getItem(FEEDBACK_KEY)||'[]') as CameraFeedback[]}catch{rows=[]}
    rows.push(row);if(rows.length>200)rows=rows.slice(-200);
    localStorage.setItem(FEEDBACK_KEY,JSON.stringify(rows));
  }catch{/* la telemetría local nunca debe bloquear la confirmación de una carta */}
  return row;
}

export function cameraFeedbackSummary(){
  let rows:CameraFeedback[]=[];
  try{rows=JSON.parse(localStorage.getItem(FEEDBACK_KEY)||'[]') as CameraFeedback[]}catch{rows=[]}
  const top1=rows.filter(x=>x.actualRank===1).length;
  const top5=rows.filter(x=>x.actualRank<=5).length;
  const avgRank=rows.length?rows.reduce((s,x)=>s+x.actualRank,0)/rows.length:0;
  const orientationRows=rows.filter(x=>typeof x.orientationCorrect==='boolean');
  const orientationCorrect=orientationRows.filter(x=>x.orientationCorrect).length;
  return {samples:rows.length,top1,top5,avgRank:Math.round(avgRank*10)/10,orientationSamples:orientationRows.length,orientationCorrect,rows};
}

export function confirmedCameraCard(cardId:string,orientation:Orientation){
  const card=tarotCardById.get(cardId);if(!card)throw new Error('CARD_UNKNOWN');
  return {cardId,cardName:card.name,orientation};
}
