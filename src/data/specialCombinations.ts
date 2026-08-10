import type { Orientation } from '../types/tarot';

export type SpecialCombinationRule = {
  id: string;
  label: string;
  cards: Array<{ cardId:string; orientation?:Orientation }>;
  orderSensitive: boolean;
  strength: 1|2|3|4|5;
  motif: string;
  explanation: string;
};

export const specialCombinationRules:SpecialCombinationRule[] = [
  {
    id:'WORLD_FOOL_SEQUENCE', label:'Cierre y nuevo ciclo', orderSensitive:true, strength:5,
    motif:'CYCLE_RESTART', cards:[{cardId:'RWS_M_21'},{cardId:'RWS_M_00'}],
    explanation:'El Mundo culmina e integra un ciclo y El Loco abre inmediatamente una nueva experiencia.'
  },
  {
    id:'MOON_SUN_SEQUENCE', label:'De incertidumbre a claridad', orderSensitive:true, strength:5,
    motif:'UNCERTAINTY_TO_CLARITY', cards:[{cardId:'RWS_M_18'},{cardId:'RWS_M_19'}],
    explanation:'La Luna reduce visibilidad y aumenta incertidumbre; el Sol posterior favorece claridad y manifestación.'
  },
  {
    id:'SILENCE_TO_COMMUNICATION', label:'Del silencio al movimiento', orderSensitive:true, strength:5,
    motif:'COMMUNICATION_OPENING', cards:[{cardId:'RWS_S_04'},{cardId:'RWS_W_08'}],
    explanation:'Una fase de pausa o silencio es seguida por aceleración, movimiento y comunicación.'
  },
  {
    id:'COMMUNICATION_TO_SILENCE', label:'Del movimiento a la pausa', orderSensitive:true, strength:5,
    motif:'COMMUNICATION_TO_PAUSE', cards:[{cardId:'RWS_W_08'},{cardId:'RWS_S_04'}],
    explanation:'La actividad o comunicación aparece primero y después pierde ritmo o entra en pausa.'
  },
  {
    id:'DEVIL_ACE_WANDS', label:'Deseo intensificado', orderSensitive:false, strength:5,
    motif:'HIGH_DESIRE', cards:[{cardId:'RWS_M_15'},{cardId:'RWS_W_01'}],
    explanation:'El Diablo y el As de Bastos refuerzan conjuntamente deseo, atracción e impulso, sin garantizar acción ni compromiso.'
  },
  {
    id:'QUEEN_CUPS_FOUR_PENTACLES', label:'Emoción retenida', orderSensitive:false, strength:5,
    motif:'FEELING_RESTRAINED', cards:[{cardId:'RWS_C_13'},{cardId:'RWS_P_04'}],
    explanation:'Profundidad emocional y retención aparecen simultáneamente: sentir y expresar no tienen la misma intensidad.'
  },
  {
    id:'TWO_CUPS_HIEROPHANT_TEN_PENTACLES', label:'Vínculo con estructura de largo plazo', orderSensitive:false, strength:5,
    motif:'COMMITMENT_PATTERN', cards:[{cardId:'RWS_C_02'},{cardId:'RWS_M_05'},{cardId:'RWS_P_10'}],
    explanation:'Reciprocidad, formalización y continuidad material/familiar convergen en una estructura de compromiso fuerte.'
  },
  {
    id:'SIX_CUPS_JUDGEMENT', label:'Pasado reevaluado', orderSensitive:false, strength:4,
    motif:'PAST_REACTIVATION', cards:[{cardId:'RWS_C_06'},{cardId:'RWS_M_20'}],
    explanation:'Una referencia importante al pasado se combina con reevaluación o despertar; el regreso efectivo requiere además movimiento.'
  },
  {
    id:'MOON_SEVEN_SWORDS', label:'Reserva e incertidumbre reforzadas', orderSensitive:false, strength:4,
    motif:'HIDDEN_INFORMATION', cards:[{cardId:'RWS_M_18'},{cardId:'RWS_S_07'}],
    explanation:'La incertidumbre y la reserva convergen. Esto no demuestra engaño, infidelidad ni un hecho oculto específico.'
  },
  {
    id:'TWO_CUPS_SIX_PENTACLES', label:'Reciprocidad emocional y práctica', orderSensitive:false, strength:5,
    motif:'RECIPROCITY_FULL', cards:[{cardId:'RWS_C_02'},{cardId:'RWS_P_06'}],
    explanation:'El intercambio afectivo y el intercambio práctico aparecen reforzados de manera simultánea.'
  },
];
