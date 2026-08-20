import { z } from 'zod';
import { db } from './schema';

const backupEnvelopeSchema=z.object({
  format:z.literal('ORACULO_TAROT_BACKUP'),
  version:z.literal(1),
  createdAt:z.string(),
  appVersion:z.string(),
  dbSchema:z.number(),
  checksum:z.string(),
  payload:z.record(z.string(),z.array(z.unknown())),
});

async function sha256(text:string){
  const bytes=new TextEncoder().encode(text);
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

export async function createBackupBlob(){
  const payload={
    people:await db.people.toArray(),
    readings:await db.readings.toArray(),
    readingRevisions:await db.readingRevisions.toArray(),
    readingCards:await db.readingCards.toArray(),
    interpretations:await db.interpretations.toArray(),
    favorites:await db.favorites.toArray(),
    cardNotes:await db.cardNotes.toArray(),
    evaluations:await db.evaluations.toArray(),
    readingEvents:await db.readingEvents.toArray(),
    settings:await db.settings.toArray(),
    learningProgress:await db.learningProgress.toArray(),
    flashcardReviews:await db.flashcardReviews.toArray(),
  };
  const payloadText=JSON.stringify(payload);
  const envelope={format:'ORACULO_TAROT_BACKUP' as const,version:1 as const,createdAt:new Date().toISOString(),appVersion:'1.0.0-beta.6.3',dbSchema:3,checksum:await sha256(payloadText),payload};
  return new Blob([JSON.stringify(envelope,null,2)],{type:'application/json'});
}

export function downloadBackup(blob:Blob){
  const date=new Date().toISOString().slice(0,10);
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=`OraculoTarot_Backup_${date}.otbackup`; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export async function restoreBackupFile(file:File){
  const raw=await file.text();
  const parsed=backupEnvelopeSchema.parse(JSON.parse(raw));
  const expected=await sha256(JSON.stringify(parsed.payload));
  if(expected!==parsed.checksum) throw new Error('BACKUP_CHECKSUM_INVALID');
  const p=parsed.payload as Record<string,unknown[]>;
  await db.transaction('rw',[db.people,db.readings,db.readingRevisions,db.readingCards,db.interpretations,db.favorites,db.cardNotes,db.evaluations,db.readingEvents,db.settings,db.learningProgress,db.flashcardReviews],async()=>{
    await Promise.all([
      db.people.clear(),db.readings.clear(),db.readingRevisions.clear(),db.readingCards.clear(),db.interpretations.clear(),
      db.favorites.clear(),db.cardNotes.clear(),db.evaluations.clear(),db.readingEvents.clear(),db.settings.clear(),db.learningProgress.clear(),db.flashcardReviews.clear(),
    ]);
    if(p.people?.length) await db.people.bulkAdd(p.people as never[]);
    if(p.readings?.length) await db.readings.bulkAdd(p.readings as never[]);
    if(p.readingRevisions?.length) await db.readingRevisions.bulkAdd(p.readingRevisions as never[]);
    if(p.readingCards?.length) await db.readingCards.bulkAdd(p.readingCards as never[]);
    if(p.interpretations?.length) await db.interpretations.bulkAdd(p.interpretations as never[]);
    if(p.favorites?.length) await db.favorites.bulkAdd(p.favorites as never[]);
    if(p.cardNotes?.length) await db.cardNotes.bulkAdd(p.cardNotes as never[]);
    if(p.evaluations?.length) await db.evaluations.bulkAdd(p.evaluations as never[]);
    if(p.readingEvents?.length) await db.readingEvents.bulkAdd(p.readingEvents as never[]);
    if(p.settings?.length) await db.settings.bulkAdd(p.settings as never[]);
    if(p.learningProgress?.length) await db.learningProgress.bulkAdd(p.learningProgress as never[]);
    if(p.flashcardReviews?.length) await db.flashcardReviews.bulkAdd(p.flashcardReviews as never[]);
  });
  return parsed;
}
