export const confidenceLabel:Record<string,string>={
  LOW:'Baja',MEDIUM:'Media',MEDIUM_HIGH:'Media-alta',HIGH:'Alta',
};

export const motifLabel:Record<string,string>={
  DEEP_FEELING:'Emoción profunda',
  HIGH_DESIRE:'Deseo intenso',
  DESIRE_WITH_ACTION:'Deseo con impulso de acción',
  DESIRE_BLOCKED:'Deseo con dificultad para manifestarse',
  FEELING_RESTRAINED:'Sentimientos contenidos',
  EMOTIONAL_RECIPROCITY:'Reciprocidad emocional',
  PRACTICAL_RECIPROCITY:'Reciprocidad práctica',
  RECIPROCITY_FULL:'Reciprocidad emocional y práctica',
  COMMUNICATION_OPENING:'Apertura a la comunicación',
  COMMUNICATION_BLOCKED:'Comunicación bloqueada o demorada',
  LONG_TERM_BUILD:'Construcción a largo plazo',
  COMMITMENT_PATTERN:'Patrón de compromiso',
  MATERIALIZATION:'Posibilidad de materialización',
  HIDDEN_INFORMATION:'Información reservada o poco visible',
  HIGH_UNCERTAINTY:'Incertidumbre elevada',
  CLOSURE_TRANSFORMATION:'Cierre y transformación',
  RECOVERY_INTEGRATION:'Recuperación e integración',
  AUTONOMOUS_STABILITY:'Estabilidad con autonomía',
  CYCLE_RESTART:'Cierre de ciclo y nuevo comienzo',
  UNCERTAINTY_TO_CLARITY:'De la incertidumbre a la claridad',
  COMMUNICATION_TO_PAUSE:'Del movimiento a la pausa',
  PAST_REACTIVATION:'Reevaluación del pasado',
  PAST_REACTIVATION_WITH_MOVEMENT:'Pasado que vuelve a moverse',
  SUSPENSION_TO_TRANSFORMATION_TO_INTEGRATION:'Suspensión, transformación e integración',
};

export const tensionLabel:Record<string,string>={
  EMOTION_VS_OPENNESS:'Sentir más de lo que se expresa',
  DESIRE_VS_MANIFESTATION:'Deseo mayor que la capacidad de actuar',
  COMMUNICATION_VS_PAUSE:'Necesidad de comunicar frente a pausa o demora',
  FEELING_VS_PRACTICAL_COMMITMENT:'Sentimiento mayor que el compromiso práctico',
  STABILITY_VS_CHANGE:'Necesidad de estabilidad frente a cambio',
  EMOTIONAL_VS_PRACTICAL_RECIPROCITY:'Reciprocidad emocional mayor que la práctica',
};

export const mechanismLabel:Record<string,string>={
  INITIATES:'inicia',DISCOVERS:'descubre',MOVES:'mueve',DIRECTS:'dirige',EMBODIES:'encarna',ATTRACTS:'atrae',
  MODIFIES:'modifica',DEFINES:'define',SUSPENDS:'suspende',TRANSFORMS:'transforma',CLOSES:'cierra',INTEGRATES:'integra',
  BINDS:'intensifica o ata',INTENSIFIES:'intensifica',BREAKS:'rompe',REVEALS:'revela',RECOVERS:'recupera',OPENS:'abre',
  OBSCURES:'vuelve menos visible',CLARIFIES:'aclara',MANIFESTS:'hace visible',AWAKENS:'despierta',DECIDES:'define una decisión',
  CULMINATES:'culmina',PAUSES:'pausa',DEFENDS:'defiende',ACCELERATES:'acelera',BUILDS:'construye',PRESERVES:'conserva',
  EVALUATES:'evalúa',RELEASES:'suelta',WITHDRAWS:'se retira',BALANCES:'equilibra',CONFRONTS:'confronta',OBSERVES:'observa',
  ABRE_EMOCION:'abre la emoción',ACELERA:'acelera',ACLARA:'aclara',ACLARA_MANIFIESTA:'aclara y hace visible',AJUSTA:'ajusta',
  APRENDE:'aprende',AVANZA:'avanza',CARECE:'muestra carencia',CARGA:'carga',CIERRA:'cierra',CIERRA_TRANSFORMA:'cierra y transforma',
  COMPARTE:'comparte',COMPITE:'compite',CONFRONTA:'confronta',CONSOLIDA:'consolida',CONSTRUYE:'construye',CUIDA:'cuida',
  CULMINA_INTEGRA:'culmina e integra',DEFIENDE:'defiende',DEFINE:'define',DESCUBRE:'descubre',DESPIERTA_REEVALUA:'despierta y reevalúa',
  DIRIGE:'dirige',DISFRUTA:'disfruta',DISFRUTA_AUTONOMIA:'disfruta con autonomía',ENCARNA:'encarna',ENCIENDE:'enciende',
  ESTRUCTURA:'estructura',EVALUA:'evalúa',EXPANDE:'expande',FORMALIZA:'formaliza',HIERE:'hiere',IMAGINA:'imagina',INICIA:'inicia',
  INTEGRA:'integra',INTENSIFICA_ATA:'intensifica y ata',INTERCAMBIA:'intercambia',INTERIORIZA:'interioriza',LAMENTA:'lamenta',
  MANIFIESTA:'manifiesta',MATERIALIZA:'materializa',MODIFICA:'modifica',MUEVE:'mueve',NUTRE:'nutre',OBSERVA:'observa',
  OCULTA_ESTRATEGIZA:'oculta y actúa con estrategia',OSCURECE:'oscurece',PAUSA:'pausa',PLANIFICA:'planifica',PLENIFICA:'lleva a plenitud',
  PREOCUPA:'preocupa',RECONOCE:'reconoce',RECUERDA:'recuerda',RECUPERA_ABRE:'recupera y abre',REGULA:'regula',RESISTE:'resiste',
  RESTRINGE:'restringe',RETIENE:'retiene',ROMPE_REVELA:'rompe y revela',SE_ALEJA:'se aleja',SE_DESCONECTA:'se desconecta',
  SE_RETIRA:'se retira',SOSTIENE:'sostiene',SUSPENDE:'suspende',SUSPENDE_DECISION:'suspende la decisión',TRABAJA:'trabaja',
  TRANSITA:'transita',VINCULA:'vincula',VINCULA_ELIGE:'vincula y obliga a elegir',
};

export function humanCode(code:string, dictionary:Record<string,string>){
  return dictionary[code] ?? code.toLocaleLowerCase('es').replaceAll('_',' ').replace(/^./,c=>c.toUpperCase());
}

export const claimLabel:Record<string,string>={
  HIGH_EMOTION:'Emoción importante',
  HIGH_DESIRE:'Deseo intenso',
  DESIRE_CAN_MOVE:'El deseo puede traducirse en movimiento',
  DESIRE_MANIFESTATION_LIMITED:'Manifestación del deseo limitada',
  EMOTION_RESTRAINED:'Emoción contenida',
  COMMUNICATION_FAVORED:'Comunicación favorecida',
  PRACTICAL_STABILITY:'Estabilidad práctica',
  FACTUAL_CERTAINTY_LIMITED:'Certeza factual limitada',
  CURRENT_FORM_CLOSING:'Cierre de la forma actual',
  PAST_REEVALUATED:'Pasado en reevaluación',
  IMMEDIATE_ACTION:'Acción inmediata',
};

export const categoryLabel:Record<string,string>={
  GENERAL:'General',RELATIONSHIP:'Relaciones',COMMUNICATION:'Comunicación',EVOLUTION:'Evolución',HIDDEN:'Lo oculto',WORK:'Trabajo',DESIRE:'Deseo',ADVICE:'Consejo',
};

export const suitLabel:Record<string,string>={major:'Arcanos Mayores',wands:'Bastos',cups:'Copas',swords:'Espadas',pentacles:'Oros'};

export const expressionModeLabel:Record<string,string>={
  INTEGRATED:'Integrada',BLOCKED:'Bloqueada',INTERNALIZED:'Interiorizada',EXCESSIVE:'Excesiva',DISTORTED:'Distorsionada',
};
