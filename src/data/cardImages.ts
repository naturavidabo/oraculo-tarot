import imageManifest from './card-images.json';

export type CardImageRow = {
  cardId: string;
  sourceFile: string;
  assetFile: string;
};

const rows = imageManifest as CardImageRow[];
export const cardImageById = new Map(rows.map(row => [row.cardId, row]));

export function cardImagePath(cardId:string) {
  const row=cardImageById.get(cardId);
  return row ? `${import.meta.env.BASE_URL}cards/${row.assetFile}` : '';
}

export function cardImageSourcePage(cardId:string) {
  const row=cardImageById.get(cardId);
  if(!row) return '';
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(row.sourceFile).replaceAll('%20','_')}`;
}
