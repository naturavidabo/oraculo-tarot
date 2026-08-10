import { interpretTarot } from './tarotEngine';

export type SelfTestResult={ok:boolean;checks:Array<{label:string;ok:boolean;detail:string}>};

export function runEngineSelfTest():SelfTestResult{
  const checks:SelfTestResult['checks']=[];
  const add=(label:string,ok:boolean,detail:string)=>checks.push({label,ok,detail});
  try{
    const result=interpretTarot({
      schemaVersion:'1.0',
      requestId:crypto.randomUUID(),
      question:{text:'¿Qué muestra esta situación?',language:'es',category:'GENERAL',type:'GENERAL',temporalScope:'PRESENT_NEAR_FUTURE'},
      spread:{id:'SPREAD_FTA_03',version:'1.0'},
      cards:[
        {positionId:'FEELINGS',cardId:'RWS_P_07',orientation:'UPRIGHT'},
        {positionId:'THOUGHTS',cardId:'RWS_S_01',orientation:'UPRIGHT'},
        {positionId:'ACTION',cardId:'RWS_S_10',orientation:'UPRIGHT'},
      ],
      options:{depth:'NORMAL',style:'NORMAL',drawMethod:'VIRTUAL',reversalsEnabled:true},
      versions:{content:'1.0.0',engine:'0.4.0'},
    });
    add('Motor devuelve 3 posiciones',result.sections.length===3,`${result.sections.length} posiciones`);
    add('Respuesta narrativa no vacía',result.directAnswer.trim().length>20,result.directAnswer.slice(0,90));
    add('Cartas de prueba correctas',result.sections.map(x=>x.cardId).join('|')==='RWS_P_07|RWS_S_01|RWS_S_10',result.sections.map(x=>x.cardName).join(' · '));
    add('Explicabilidad disponible',result.why.length>0,`${result.why.length} evidencias`);
  }catch(error){
    add('Ejecución del motor',false,error instanceof Error?error.message:String(error));
  }
  return {ok:checks.every(x=>x.ok),checks};
}
