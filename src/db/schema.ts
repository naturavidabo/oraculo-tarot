import Dexie, { type EntityTable } from 'dexie';
import type { Orientation } from '../types/tarot';
import type { InterpretationResult } from '../engine/contracts';

export type PersonRow = {
  id: string;
  displayName: string;
  normalizedName: string;
  birthDate?: string;
  birthTime?: string;
  birthTimePrecision?: 'EXACT' | 'APPROXIMATE' | 'UNKNOWN';
  birthPlaceName?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type ReadingRow = {
  id: string;
  question: string;
  questionNormalized: string;
  personId?: string;
  category: string;
  questionType: string;
  temporalScope?: string;
  spreadId: string;
  spreadVersion: string;
  drawMethod: 'PHYSICAL' | 'VIRTUAL';
  status: 'DRAFT' | 'READY' | 'INTERPRETED' | 'REVISED' | 'ARCHIVED' | 'EVALUATED';
  currentRevisionId?: string;
  createdAt: string;
  updatedAt: string;
};

export type ReadingRevisionRow = { id:string; readingId:string; revisionNumber:number; reason:string; createdAt:string };
export type ReadingCardRow = {
  id:string; readingId:string; revisionId:string; positionId:string; positionOrder:number; cardId:string;
  orientation:Orientation; isClarifier:0|1; parentPositionId?:string; parentCardEntryId?:string; drawOrder:number; createdAt:string;
};
export type InterpretationRow = {
  id:string; readingId:string; revisionId:string; contentVersion:string; engineVersion:string;
  structuredResult:InterpretationResult; createdAt:string;
};
export type FavoriteRow = { id:string; type:'CARD'|'READING'|'SPREAD'|'LESSON'; targetId:string; createdAt:string };
export type CardNoteRow = { id:string; cardId:string; text:string; createdAt:string; updatedAt:string };
export type EvaluationRow = {
  id:string; readingId:string; revisionId:string; evaluation:'MATCHED'|'PARTIAL'|'NOT_MATCHED'|'INDETERMINATE';
  observedDate?:string; notes?:string; createdAt:string; updatedAt:string;
};
export type ReadingEventRow = { id:string; readingId:string; revisionId?:string; type:string; payload?:unknown; createdAt:string };
export type SettingRow = { id:string; value:unknown; updatedAt:string };

class OraculoTarotDB extends Dexie {
  people!: EntityTable<PersonRow, 'id'>;
  readings!: EntityTable<ReadingRow, 'id'>;
  readingRevisions!: EntityTable<ReadingRevisionRow, 'id'>;
  readingCards!: EntityTable<ReadingCardRow, 'id'>;
  interpretations!: EntityTable<InterpretationRow, 'id'>;
  favorites!: EntityTable<FavoriteRow, 'id'>;
  cardNotes!: EntityTable<CardNoteRow, 'id'>;
  evaluations!: EntityTable<EvaluationRow, 'id'>;
  readingEvents!: EntityTable<ReadingEventRow, 'id'>;
  settings!: EntityTable<SettingRow, 'id'>;

  constructor() {
    super('ArcanaDB');
    this.version(1).stores({
      people: '&id, normalizedName, createdAt',
      readings: '&id, personId, category, status, spreadId, createdAt',
      readingRevisions: '&id, readingId, &[readingId+revisionNumber], createdAt',
      readingCards: '&id, revisionId, cardId, positionId, [revisionId+positionOrder]',
      interpretations: '&id, revisionId, readingId, createdAt',
      favorites: '&id, type, targetId',
      cardNotes: '&id, cardId',
    });
    this.version(2).stores({
      people: '&id, normalizedName, createdAt',
      readings: '&id, personId, category, status, spreadId, createdAt',
      readingRevisions: '&id, readingId, &[readingId+revisionNumber], createdAt',
      readingCards: '&id, revisionId, cardId, positionId, parentPositionId, [revisionId+positionOrder]',
      interpretations: '&id, revisionId, readingId, createdAt',
      favorites: '&id, type, targetId',
      cardNotes: '&id, cardId',
      evaluations: '&id, readingId, revisionId, evaluation, createdAt',
      readingEvents: '&id, readingId, revisionId, type, createdAt',
      settings: '&id, updatedAt',
    });
  }
}

export const db = new OraculoTarotDB();
