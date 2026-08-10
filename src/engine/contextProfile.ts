import type { TarotContext, TarotDimension } from '../types/tarot';

export type ContextProfile = Partial<Record<TarotDimension, number>>;

export const contextProfiles: Record<TarotContext, ContextProfile> = {
  general: { manifestation:1, movement:.8, stability:.8, openness:.6, transformation:.6 },
  mental: { mentalIntensity:1, clarity:1, uncertainty:.9, strategy:.7, introspection:.6 },
  psicologico: { introspection:1, fear:.8, control:.8, resilience:.7, uncertainty:.7 },
  emocional: { emotion:1, openness:.9, bondAvailability:.8, reciprocity:.7, healing:.6 },
  amor: { emotion:1, attraction:.8, reciprocity:.9, commitment:.8, bondAvailability:.9, longTermStability:.5 },
  sentimientos: { emotion:1, bondAvailability:.9, reciprocity:.8, openness:.7, attachment:.5, care:.5 },
  pensamientos: { mentalIntensity:1, clarity:.9, uncertainty:.9, strategy:.6, secrecy:.4 },
  deseo: { desire:1, attraction:1, sexuality:.9, actionImpulse:.6, fantasy:.5 },
  sexualidad: { sexuality:1, desire:1, attraction:.9, actionImpulse:.6, control:.4 },
  intenciones: { initiative:1, practicalCommitment:.9, commitment:.8, manifestation:.8, control:.6 },
  accion: { movement:1, actionImpulse:1, initiative:.9, manifestation:1, communication:.7, pace:.7 },
  comunicacion: { communication:1, movement:.8, openness:.7, manifestation:.8, secrecy:-.5 },
  relacion: { emotion:.8, reciprocity:1, bondAvailability:1, commitment:.8, practicalCommitment:.7, stability:.7 },
  familia: { family:1, stability:.9, care:.8, commitment:.7, longTermStability:.9 },
  social: { openness:1, communication:.9, cooperation:.8, visibility:.7 },
  trabajo: { work:1, practicalCommitment:1, materiality:.8, cooperation:.7, authority:.6, manifestation:.8 },
  dinero: { materiality:1, stability:.9, manifestation:.8, practicalCommitment:.7, control:.6 },
  creatividad: { initiative:1, openness:.8, manifestation:.8, fantasy:.6 },
  espiritual: { introspection:1, transformation:.9, healing:.8, integration:.8, clarity:.6 },
  obstaculo: { conflict:1, fear:1, uncertainty:.9, burden:.9, retention:.8, secrecy:.7, movement:-.6, openness:-.5 },
  consejo: { clarity:1, initiative:.7, control:.7, healing:.7, integration:.7, practicalCommitment:.6 },
  resultado: { manifestation:1, stability:.9, movement:.8, longTermStability:.8, transformation:.7, rupture:.7 },
  si_no: { manifestation:1, movement:.8, stability:.7, initiative:.6 },
  tiempo: { pace:1, movement:.8 },
  persona: { control:.6, emotion:.6, authority:.6, independence:.6, care:.5, strategy:.5 },
  oculto: { secrecy:1, visibility:-1, uncertainty:.9, introspection:.6, fantasy:.5 },
};

export const dimensionLabels: Partial<Record<TarotDimension, string>> = {
  emotion:'emoción', attraction:'atracción', sexuality:'sexualidad', desire:'deseo', commitment:'compromiso',
  communication:'comunicación', conflict:'conflicto', uncertainty:'incertidumbre', materiality:'materialidad',
  authority:'autoridad', introspection:'introspección', transformation:'transformación', initiative:'iniciativa',
  secrecy:'reserva', actionImpulse:'impulso de acción', manifestation:'manifestación', bondAvailability:'disponibilidad vincular',
  practicalCommitment:'compromiso práctico', stability:'estabilidad', openness:'apertura', movement:'movimiento',
  visibility:'visibilidad', pace:'ritmo', reciprocity:'reciprocidad emocional', practicalReciprocity:'reciprocidad práctica',
  attachment:'apego', retention:'retención', healing:'sanación', integration:'integración', rupture:'ruptura', fear:'miedo',
  clarity:'claridad', strategy:'estrategia', hostility:'hostilidad', mentalIntensity:'intensidad mental', fantasy:'fantasía',
  grounding:'anclaje en hechos', satisfactionIndividual:'satisfacción individual', satisfactionShared:'satisfacción compartida',
  family:'familia', work:'trabajo', cooperation:'cooperación', adaptability:'adaptabilidad', patience:'paciencia',
  independence:'independencia', care:'cuidado', resilience:'resiliencia', burden:'carga', longTermStability:'estabilidad a largo plazo',
  control:'control',
};

export const bipolarDimensions = new Set<TarotDimension>([
  'stability','openness','movement','visibility','pace','control','bondAvailability','longTermStability'
]);
