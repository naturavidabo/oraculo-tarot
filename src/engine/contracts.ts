import { z } from 'zod';

export const orientationSchema = z.enum(['UPRIGHT', 'REVERSED']);

export const readingCardInputSchema = z.object({
  positionId: z.string().min(1),
  cardId: z.string().min(1),
  orientation: orientationSchema,
  role: z.enum(['PRIMARY','CLARIFIER']).default('PRIMARY'),
  parentPositionId: z.string().min(1).optional(),
}).superRefine((value,ctx)=>{
  if(value.role==='CLARIFIER'&&!value.parentPositionId){
    ctx.addIssue({code:'custom',path:['parentPositionId'],message:'CLARIFIER_PARENT_REQUIRED'});
  }
});

export const interpretationRequestSchema = z.object({
  schemaVersion: z.literal('1.0'),
  requestId: z.uuid(),
  question: z.object({
    text: z.string().trim().min(3),
    language: z.literal('es'),
    category: z.string().min(1),
    type: z.string().min(1),
    temporalScope: z.string().min(1),
  }),
  spread: z.object({
    id: z.string().min(1),
    version: z.string().min(1),
  }),
  cards: z.array(readingCardInputSchema).min(1).max(30),
  options: z.object({
    depth: z.enum(['QUICK','NORMAL','DEEP','TEACHER']),
    style: z.enum(['DIRECT','NORMAL','DEEP','TEACHER']),
    drawMethod: z.enum(['PHYSICAL','VIRTUAL']),
    reversalsEnabled: z.boolean().default(true),
  }),
  versions: z.object({
    content: z.string().min(1),
    engine: z.string().min(1),
  }),
}).superRefine((value, ctx) => {
  const ids = value.cards.map(card => card.cardId);
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({ code: 'custom', path: ['cards'], message: 'CARD_DUPLICATE' });
  }
});

export type InterpretationRequest = z.input<typeof interpretationRequestSchema>;

export const interpretationResultSchema = z.object({
  requestId: z.uuid(),
  headline: z.string(),
  directAnswer: z.string(),
  dimensions: z.record(z.string(), z.number()),
  motifs: z.array(z.string()),
  tensions: z.array(z.string()),
  transitions: z.array(z.string()).default([]),
  sequencePatterns: z.array(z.string()).default([]),
  specialCombinations: z.array(z.object({
    id:z.string(), label:z.string(), motif:z.string(), explanation:z.string(), strength:z.number().min(1).max(5),
    cards:z.array(z.string()), orderSensitive:z.boolean(),
  })).default([]),
  confidence: z.enum(['LOW','MEDIUM','MEDIUM_HIGH','HIGH']),
  sections: z.array(z.object({
    positionId: z.string(),
    label: z.string(),
    cardId: z.string(),
    cardName: z.string(),
    orientation: orientationSchema,
    role:z.enum(['PRIMARY','CLARIFIER']).default('PRIMARY'),
    parentPositionId:z.string().optional(),
    text: z.string(),
  })).default([]),
  claims: z.array(z.object({
    id: z.string(),
    concept: z.string(),
    strength: z.enum(['SUPPORTED','PROBABLE_SYMBOLIC','POSSIBLE','INSUFFICIENT','CONTRADICTED']),
    confidence: z.enum(['LOW','MEDIUM','MEDIUM_HIGH','HIGH']),
    evidence: z.array(z.string()),
  })).default([]),
  why: z.array(z.object({ claim: z.string(), explanation: z.string(), cards: z.array(z.string()) })),
  safeguards: z.array(z.string()).default([]),
  versions: z.object({ content: z.string(), engine: z.string() }),
});

export type InterpretationResult = z.infer<typeof interpretationResultSchema>;
