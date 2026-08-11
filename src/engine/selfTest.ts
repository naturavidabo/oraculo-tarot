import { interpretTarot } from './tarotEngine';
export type SelfTestResult={ok:boolean;checks:Array<{label:string;ok:boolean;detail:string}>};
export function runEngineSelfTest():SelfTestResult{
  const checks:SelfTestResult['checks']=[];
  const add=(label:string,ok:boolean,detail:string)=>checks.push({label,ok,detail});
  try{
    const result=interpretTarot({
      schemaVersion:'1.0',requestId:crypto.randomUUID(),
      question:{text:'¿Qué muestra esta situación?',language:'es',category:'GENERAL',type:'GENERAL',temporalScope:'PRESENT_NEAR_FUTURE'},
      spread:{id:'SPREAD_FTA_03',version:'1.0'},
      cards:[
        {positionId:'FEELINGS',cardId:'RWS_P_07',orientation:'UPRIGHT'},
        {positionId:'THOUGHTS',cardId:'RWS_S_01',orientation:'UPRIGHT'},
        {positionId:'ACTION',cardId:'RWS_S_10',orientation:'UPRIGHT'},
      ],
      options:{depth:'NORMAL',style:'NORMAL',drawMethod:'VIRTUAL',reversalsEnabled:true},
      versions:{content:'1.0.0',engine:'0.6.0'},
    });
    add('Motor devuelve 3 posiciones',result.sections.length===3,`${result.sections.length} posiciones`);
    add('Respuesta directa no vacía',result.directAnswer.trim().length>20,result.directAnswer.slice(0,120));
    add('Interpretación global desarrollada',result.globalInterpretation.trim().length>180,`${result.globalInterpretation.length} caracteres`);
    add('Conclusión disponible',result.conclusion.trim().length>90,result.conclusion.slice(0,120));
    add('Cartas de prueba correctas',result.sections.map(x=>x.cardId).join('|')==='RWS_P_07|RWS_S_01|RWS_S_10',result.sections.map(x=>x.cardName).join(' · '));
    add('Explicabilidad disponible',result.why.length>0,`${result.why.length} evidencias`);
    const visibleText=[result.headline,result.directAnswer,result.globalInterpretation,result.connectionSummary,result.conclusion,...result.why.map(x=>`${x.claim} ${x.explanation}`)].join(' ');
    const leaked=/\b(?:LOW|MEDIUM|HIGH|HIGH_EMOTION|DESIRE_BLOCKED|CURRENT_FORM_CLOSING|COMMUNICATION_OPENING)\b/.test(visibleText);
    add('Narrativa visible sin códigos internos en inglés',!leaked,leaked?'Se detectó un código interno':'Presentación en español');
    const clarified=interpretTarot({
      schemaVersion:'1.0',requestId:crypto.randomUUID(),
      question:{text:'¿Qué necesita aclararse?',language:'es',category:'GENERAL',type:'GENERAL',temporalScope:'PRESENT_NEAR_FUTURE'},
      spread:{id:'SPREAD_FTA_03',version:'1.0'},
      cards:[
        {positionId:'FEELINGS',cardId:'RWS_C_13',orientation:'UPRIGHT',role:'PRIMARY'},
        {positionId:'THOUGHTS',cardId:'RWS_S_02',orientation:'UPRIGHT',role:'PRIMARY'},
        {positionId:'ACTION',cardId:'RWS_W_08',orientation:'UPRIGHT',role:'PRIMARY'},
        {positionId:'FEELINGS',parentPositionId:'FEELINGS',cardId:'RWS_P_04',orientation:'UPRIGHT',role:'CLARIFIER'},
      ],
      options:{depth:'NORMAL',style:'NORMAL',drawMethod:'PHYSICAL',reversalsEnabled:true},
      versions:{content:'1.0.0',engine:'0.6.0'},
    });
    add('Aclaratoria integrada sin sustituir la carta principal',clarified.sections.filter(x=>x.role==='PRIMARY').length===3&&clarified.sections.some(x=>x.role==='CLARIFIER'),`${clarified.sections.length} secciones`);
  }catch(error){add('Ejecución del motor',false,error instanceof Error?error.message:String(error));}
  return {ok:checks.every(x=>x.ok),checks};
}
