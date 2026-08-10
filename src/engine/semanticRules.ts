import { specialCombinationRules, type SpecialCombinationRule } from '../data/specialCombinations';
import type { Orientation } from '../types/tarot';

export type SemanticCardRef = { cardId:string; orientation:Orientation; positionId?:string };
export type SpecialCombinationMatch = {
  id:string; label:string; motif:string; explanation:string; strength:number; cards:string[]; orderSensitive:boolean;
};

export function motifList(d:Record<string,number>) {
  const motifs:string[]=[];
  const desire = Math.max(d.desire ?? 0, d.sexuality ?? 0, d.attraction ?? 0);
  const action = ((d.movement ?? 0)+(d.manifestation ?? 0)+(d.actionImpulse ?? 0))/3;
  if ((d.emotion ?? 0) >= 3.7) motifs.push('DEEP_FEELING');
  if (desire >= 4) motifs.push('HIGH_DESIRE');
  if (desire >= 3.7 && action >= 3.1) motifs.push('DESIRE_WITH_ACTION');
  if (desire >= 3.7 && (action <= 2.1 || (d.fear ?? 0)>=3.5 || (d.retention ?? 0)>=3.5)) motifs.push('DESIRE_BLOCKED');
  if ((d.emotion ?? 0)>=3.5 && ((d.openness ?? 0)<=0 || (d.retention ?? 0)>=3.5 || (d.control ?? 0)>=4)) motifs.push('FEELING_RESTRAINED');
  if ((d.reciprocity ?? 0)>=4) motifs.push('EMOTIONAL_RECIPROCITY');
  if ((d.practicalReciprocity ?? 0)>=4) motifs.push('PRACTICAL_RECIPROCITY');
  if ((d.communication ?? 0)>=3.6 && (d.movement ?? 0)>=2.5) motifs.push('COMMUNICATION_OPENING');
  if ((d.communication ?? 0)>=3 && ((d.movement ?? 0)<=0 || (d.fear ?? 0)>=3.5)) motifs.push('COMMUNICATION_BLOCKED');
  if ((d.practicalCommitment ?? 0)>=4 && (d.longTermStability ?? d.stability ?? 0)>=4) motifs.push('LONG_TERM_BUILD');
  if ((d.manifestation ?? 0)>=4 && (d.initiative ?? 0)>=3) motifs.push('MATERIALIZATION');
  if ((d.secrecy ?? 0)>=4 && (d.visibility ?? 0)<=-2) motifs.push('HIDDEN_INFORMATION');
  if ((d.uncertainty ?? 0)>=4 || ((d.fantasy ?? 0)>=4 && (d.grounding ?? 5)<=2)) motifs.push('HIGH_UNCERTAINTY');
  if ((d.rupture ?? 0)>=4 && (d.transformation ?? 0)>=4) motifs.push('CLOSURE_TRANSFORMATION');
  if ((d.healing ?? 0)>=4 || (d.integration ?? 0)>=4) motifs.push('RECOVERY_INTEGRATION');
  if ((d.independence ?? 0)>=4 && (d.stability ?? 0)>=3) motifs.push('AUTONOMOUS_STABILITY');
  return motifs;
}

export function tensionList(d:Record<string,number>) {
  const tensions:string[]=[];
  const desire=Math.max(d.desire??0,d.sexuality??0,d.attraction??0);
  if ((d.emotion??0)>=3.5 && (d.openness??0)<=0) tensions.push('EMOTION_VS_OPENNESS');
  if (desire>=3.7 && (d.manifestation??0)<=2.2) tensions.push('DESIRE_VS_MANIFESTATION');
  if ((d.communication??0)>=3.2 && (d.movement??0)<=0) tensions.push('COMMUNICATION_VS_PAUSE');
  if ((d.commitment??0)>=3.5 && (d.practicalCommitment??0)<=2) tensions.push('FEELING_VS_PRACTICAL_COMMITMENT');
  if ((d.stability??0)>=3.5 && (d.transformation??0)>=4) tensions.push('STABILITY_VS_CHANGE');
  if ((d.reciprocity??0)>=3.5 && (d.practicalReciprocity??0)<=2) tensions.push('EMOTIONAL_VS_PRACTICAL_RECIPROCITY');
  return tensions;
}

function cardMatches(ruleCard:SpecialCombinationRule['cards'][number], actual:SemanticCardRef) {
  return ruleCard.cardId===actual.cardId && (!ruleCard.orientation || ruleCard.orientation===actual.orientation);
}

function orderedMatch(rule:SpecialCombinationRule, cards:SemanticCardRef[]) {
  if (rule.cards.length>cards.length) return false;
  for (let start=0; start<=cards.length-rule.cards.length; start++) {
    let ok=true;
    for (let i=0;i<rule.cards.length;i++) if(!cardMatches(rule.cards[i],cards[start+i])) {ok=false;break;}
    if(ok) return true;
  }
  return false;
}

function unorderedMatch(rule:SpecialCombinationRule, cards:SemanticCardRef[]) {
  const used=new Set<number>();
  return rule.cards.every(ruleCard=>{
    const idx=cards.findIndex((actual,index)=>!used.has(index)&&cardMatches(ruleCard,actual));
    if(idx<0) return false;
    used.add(idx); return true;
  });
}

export function detectSpecialCombinations(cards:SemanticCardRef[]):SpecialCombinationMatch[] {
  return specialCombinationRules.filter(rule=>rule.orderSensitive?orderedMatch(rule,cards):unorderedMatch(rule,cards)).map(rule=>({
    id:rule.id,label:rule.label,motif:rule.motif,explanation:rule.explanation,strength:rule.strength,
    cards:rule.cards.map(c=>c.cardId),orderSensitive:rule.orderSensitive,
  }));
}

export function detectSequencePatterns(cards:SemanticCardRef[]):string[] {
  const ids=cards.map(c=>c.cardId);
  const patterns:string[]=[];
  const containsOrdered=(pattern:string[])=>{
    let cursor=0;
    for(const id of ids) if(id===pattern[cursor]) cursor++;
    return cursor===pattern.length;
  };
  if(containsOrdered(['RWS_M_12','RWS_M_13','RWS_M_14'])) patterns.push('SUSPENSION_TO_TRANSFORMATION_TO_INTEGRATION');
  if(containsOrdered(['RWS_C_06','RWS_M_20']) && cards.some(c=>['RWS_W_08','RWS_C_12'].includes(c.cardId))) patterns.push('PAST_REACTIVATION_WITH_MOVEMENT');
  if(containsOrdered(['RWS_M_18','RWS_S_01'])) patterns.push('UNCERTAINTY_TO_CLARITY');
  return patterns;
}
