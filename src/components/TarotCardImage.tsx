import { useEffect, useMemo, useState } from 'react';
import type { Orientation, TarotCard } from '../types/tarot';
import { cardImageCandidates } from '../data/cardImages';

export function TarotCardImage({
  card,
  orientation='UPRIGHT',
  className='',
  eager=false,
}:{card:TarotCard;orientation?:Orientation;className?:string;eager?:boolean}) {
  const candidates=useMemo(()=>cardImageCandidates(card.id),[card.id]);
  const [sourceIndex,setSourceIndex]=useState(0);
  useEffect(()=>setSourceIndex(0),[card.id]);
  const src=candidates[sourceIndex];
  if(!src) return <div className={`tarot-image-fallback ${className}`} aria-label={card.name}><span>{card.number??'✦'}</span><small>{card.name}</small></div>;
  return <img
    className={`tarot-card-image ${orientation==='REVERSED'?'reversed':''} ${className}`}
    src={src}
    alt={`${card.name}${orientation==='REVERSED'?' invertida':''}`}
    loading={eager?'eager':'lazy'}
    decoding="async"
    referrerPolicy="no-referrer"
    onError={()=>setSourceIndex(index=>index+1)}
  />;
}

export function TarotCardBack({className=''}:{className?:string}) {
  return <div className={`tarot-card-back ${className}`}><img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" /></div>;
}
