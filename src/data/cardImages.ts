import imageManifest from './card-images.json';

export type CardImageRow = {
  cardId: string;
  sourceFile: string;
  assetFile: string;
};

const rows = imageManifest as CardImageRow[];
export const cardImageById = new Map(rows.map(row => [row.cardId, row]));

const RAW_BASE='https://raw.githubusercontent.com/seven102161/elaine-tarot-cards/main/cards';

function externalCode(cardId:string){
  const major=cardId.match(/^RWS_M_(\d{2})$/);
  if(major) return `ar${major[1]}`;
  const minor=cardId.match(/^RWS_([WCSP])_(\d{2})$/);
  if(!minor) return '';
  const suit:Record<string,string>={W:'wa',C:'cu',S:'sw',P:'pe'};
  const rank=Number(minor[2]);
  const suffix=rank===1?'ac':rank>=2&&rank<=10?String(rank).padStart(2,'0'):rank===11?'pa':rank===12?'kn':rank===13?'qu':rank===14?'ki':'';
  return suffix?`${suit[minor[1]]}${suffix}`:'';
}

export function cardImagePath(cardId:string) {
  const row=cardImageById.get(cardId);
  return row ? `${import.meta.env.BASE_URL}cards/${row.assetFile}` : '';
}

export function cardImageRemotePath(cardId:string){
  const code=externalCode(cardId);
  return code ? `${RAW_BASE}/${code}.jpg` : '';
}

export function cardImageCommonsPath(cardId:string){
  const row=cardImageById.get(cardId);
  if(!row) return '';
  const filename=encodeURIComponent(row.sourceFile).replaceAll('%20','_');
  return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${filename}?width=420`;
}

export function cardImageCandidates(cardId:string){
  // Orden deliberado: fuente GitHub raw no-LFS -> Wikimedia Commons -> copia local si existe.
  // La versión 0.9 no depende de que Actions descargue imágenes en public/cards.
  return [cardImageRemotePath(cardId),cardImageCommonsPath(cardId),cardImagePath(cardId)].filter(Boolean);
}

export function cardImageSourcePage(cardId:string) {
  const row=cardImageById.get(cardId);
  if(!row) return '';
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(row.sourceFile).replaceAll('%20','_')}`;
}

export function cardExternalCode(cardId:string){ return externalCode(cardId); }
