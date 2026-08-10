import rawCards from './cards.content.json';
import type { TarotCard } from '../types/tarot';

export const tarotCards = rawCards as TarotCard[];

if (tarotCards.length !== 78) {
  throw new Error(`Tarot deck must contain 78 cards, found ${tarotCards.length}`);
}

export const tarotCardById = new Map(tarotCards.map(card => [card.id, card]));
