import { tarotCards } from '../data/cards';
import type { Orientation } from '../types/tarot';

export type PreparedCard = { cardId:string; orientation:Orientation };

function randomUnit() {
  const array=new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / 4294967296;
}

function randomInt(maxExclusive:number) {
  return Math.floor(randomUnit()*maxExclusive);
}

export function prepareVirtualDeck(reversals=true, reversedRate=.35): PreparedCard[] {
  const deck:PreparedCard[]=tarotCards.map(card=>({
    cardId:card.id,
    orientation:reversals && randomUnit()<reversedRate ? 'REVERSED':'UPRIGHT',
  }));
  for(let i=deck.length-1;i>0;i--){
    const j=randomInt(i+1);
    [deck[i],deck[j]]=[deck[j],deck[i]];
  }
  return deck;
}

export function cutVirtualDeck(deck:PreparedCard[]): PreparedCard[] {
  if(deck.length<4) return [...deck];
  const safeMargin=Math.max(1,Math.floor(deck.length*.18));
  const span=Math.max(1,deck.length-safeMargin*2);
  const index=safeMargin+randomInt(span);
  return [...deck.slice(index),...deck.slice(0,index)];
}
