import { useEffect, useMemo, useState } from 'react';
import type { Orientation, TarotCard } from '../types/tarot';
import { cardImageCandidates } from '../data/cardImages';

const LOAD_TIMEOUT_MS=6500;

function resolveImage(candidates:string[], onReady:(src:string)=>void, onFail:()=>void){
  let cancelled=false;
  let index=0;
  let timer:number|undefined;
  let probe:HTMLImageElement|undefined;

  const next=()=>{
    if(cancelled) return;
    if(timer) window.clearTimeout(timer);
    const src=candidates[index++];
    if(!src){onFail();return;}
    probe=new Image();
    probe.decoding='async';
    probe.referrerPolicy='no-referrer';
    probe.onload=()=>{if(cancelled)return;if(timer)window.clearTimeout(timer);onReady(src)};
    probe.onerror=()=>{if(cancelled)return;next()};
    timer=window.setTimeout(()=>next(),LOAD_TIMEOUT_MS);
    probe.src=src;
  };
  next();
  return ()=>{cancelled=true;if(timer)window.clearTimeout(timer);if(probe){probe.onload=null;probe.onerror=null;}};
}

export function TarotCardImage({
  card,
  orientation='UPRIGHT',
  className='',
  eager=false,
}:{card:TarotCard;orientation?:Orientation;className?:string;eager?:boolean}) {
  const candidates=useMemo(()=>cardImageCandidates(card.id),[card.id]);
  const [resolvedSrc,setResolvedSrc]=useState('');
  const [failed,setFailed]=useState(false);

  useEffect(()=>{
    setResolvedSrc('');setFailed(false);
    return resolveImage(candidates,setResolvedSrc,()=>setFailed(true));
  },[card.id,candidates]);

  if(failed) return <div className={`tarot-image-fallback ${className}`} aria-label={card.name}>
    <span>{card.number??'✦'}</span><small>{card.name}</small><em>Imagen no disponible</em>
  </div>;

  if(!resolvedSrc) return <div className={`tarot-image-loading ${className}`} aria-label={`Cargando ${card.name}`}>
    <span>✦</span><small>Cargando carta…</small>
  </div>;

  return <img
    className={`tarot-card-image ${orientation==='REVERSED'?'reversed':''} ${className}`}
    src={resolvedSrc}
    alt={`${card.name}${orientation==='REVERSED'?' invertida':''}`}
    loading={eager?'eager':'lazy'}
    decoding="async"
    referrerPolicy="no-referrer"
  />;
}

export function TarotCardBack({className=''}:{className?:string}) {
  return <div className={`tarot-card-back ${className}`}><img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" /></div>;
}
