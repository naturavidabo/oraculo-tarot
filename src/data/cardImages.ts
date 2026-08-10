import imageManifest from './card-images.json';

export type CardImageRow = {
  cardId: string;
  sourceFile: string;
  assetFile: string;
};

const rows = imageManifest as CardImageRow[];
export const cardImageById = new Map(rows.map(row => [row.cardId, row]));

function publicCode(cardId:string){
  const major=cardId.match(/^RWS_M_(\d{2})$/);
  if(major) return String(Number(major[1]));
  const minor=cardId.match(/^RWS_([WCSP])_(\d{2})$/);
  if(!minor) return '';
  const prefix:Record<string,string>={W:'w',C:'c',S:'s',P:'p'};
  return `${prefix[minor[1]]}${Number(minor[2])}`;
}

export function cardImagePath(cardId:string) {
  const row=cardImageById.get(cardId);
  return row ? `${import.meta.env.BASE_URL}cards/${row.assetFile}` : '';
}

export function cardImageRemotePath(cardId:string){
  const code=publicCode(cardId);
  return code ? `https://media.githubusercontent.com/media/yunruse/tarot/gh-pages/cards/color/${code}.jpg` : '';
}

export function cardImageCandidates(cardId:string){
  return [cardImageRemotePath(cardId),cardImagePath(cardId)].filter(Boolean);
}

export function cardImageSourcePage(cardId:string) {
  const row=cardImageById.get(cardId);
  if(!row) return '';
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(row.sourceFile).replaceAll('%20','_')}`;
}
