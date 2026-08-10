export type ArcanaType = 'major' | 'minor';
export type Suit = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';
export type Orientation = 'UPRIGHT' | 'REVERSED';
export type ExpressionMode = 'INTEGRATED' | 'BLOCKED' | 'INTERNALIZED' | 'EXCESSIVE' | 'DISTORTED';

export type TarotDimension =
  | 'emotion' | 'attraction' | 'sexuality' | 'desire' | 'commitment' | 'communication'
  | 'conflict' | 'uncertainty' | 'materiality' | 'authority' | 'introspection' | 'transformation'
  | 'initiative' | 'secrecy' | 'actionImpulse' | 'manifestation' | 'bondAvailability'
  | 'practicalCommitment' | 'stability' | 'openness' | 'movement' | 'visibility' | 'pace'
  | 'reciprocity' | 'practicalReciprocity' | 'attachment' | 'retention' | 'healing' | 'integration'
  | 'rupture' | 'fear' | 'clarity' | 'strategy' | 'hostility' | 'mentalIntensity'
  | 'fantasy' | 'grounding' | 'satisfactionIndividual' | 'satisfactionShared' | 'family'
  | 'work' | 'cooperation' | 'adaptability' | 'patience' | 'independence' | 'care'
  | 'resilience' | 'burden' | 'longTermStability' | 'control';

export type TarotContext =
  | 'general' | 'mental' | 'psicologico' | 'emocional' | 'amor' | 'sentimientos' | 'pensamientos'
  | 'deseo' | 'sexualidad' | 'intenciones' | 'accion' | 'comunicacion' | 'relacion' | 'familia'
  | 'social' | 'trabajo' | 'dinero' | 'creatividad' | 'espiritual' | 'obstaculo' | 'consejo'
  | 'resultado' | 'si_no' | 'tiempo' | 'persona' | 'oculto';

export type TarotCard = {
  id: string;
  number: number | null;
  name: string;
  originalName: string;
  arcana: ArcanaType;
  suit: Suit;
  rank: 'major' | 'ace' | 'number' | 'page' | 'knight' | 'queen' | 'king';
  essence: string;
  quick: string;
  keywords: string[];
  light: string[];
  shadow: string[];
  tags: string[];
  vectors: Partial<Record<TarotDimension, number>>;
  mechanism: string;
  reversal: {
    summary: string;
    modes: ExpressionMode[];
    adjustments?: Partial<Record<TarotDimension, number>>;
  };
  teacherNote: string;
  contentVersion: string;
};

export type ReadingPosition = {
  id: string;
  label: string;
  context: TarotContext;
  weight: number;
};

export type ReadingCardInput = {
  positionId: string;
  cardId: string;
  orientation: Orientation;
};
