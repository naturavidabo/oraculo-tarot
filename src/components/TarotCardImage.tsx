import { useState } from 'react';
import type { Orientation, TarotCard } from '../types/tarot';
import { cardImagePath } from '../data/cardImages';

export function TarotCardImage({
  card,
  orientation='UPRIGHT',
  className='',
  eager=false,
}:{card:TarotCard;orientation?:Orientation;className?:string;eager?:boolean}) {
  const [failed,setFailed]=useState(false);
  const src=cardImagePath(card.id);
  if(!src||failed) return <div className={`tarot-image-fallback ${className}`} aria-label={card.name}><span>{card.number??'✦'}</span><small>{card.name}</small></div>;
  return <img
    className={`tarot-card-image ${orientation==='REVERSED'?'reversed':''} ${className}`}
    src={src}
    alt={`${card.name}${orientation==='REVERSED'?' invertida':''}`}
    loading={eager?'eager':'lazy'}
    decoding="async"
    onError={()=>setFailed(true)}
  />;
}

export function TarotCardBack({className=''}:{className?:string}) {
  return <div className={`tarot-card-back ${className}`}><img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" /></div>;
}
