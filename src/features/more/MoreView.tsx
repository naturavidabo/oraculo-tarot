import { useRef, useState } from 'react';
import { createBackupBlob, downloadBackup, restoreBackupFile } from '../../db/backup';
import { runEngineSelfTest, type SelfTestResult } from '../../engine/selfTest';
import { runImageDiagnostic, type ImageDiagnosticResult } from '../../engine/imageDiagnostics';
import { cameraFeedbackSummary } from '../../engine/cameraRecognition';

export function MoreView(){
  const inputRef=useRef<HTMLInputElement>(null);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [diagnostic,setDiagnostic]=useState<SelfTestResult|null>(null);
  const [imageDiagnostic,setImageDiagnostic]=useState<ImageDiagnosticResult|null>(null);
  const [imageProgress,setImageProgress]=useState('');
  const [cameraStatsVersion,setCameraStatsVersion]=useState(0);
  const cameraStats=cameraFeedbackSummary();
  void cameraStatsVersion;

  async function backup(){
    setBusy(true); setMessage('');
    try{ const blob=await createBackupBlob(); downloadBackup(blob); setMessage('Respaldo creado. Guárdalo en un lugar seguro.'); }
    catch{ setMessage('No se pudo crear el respaldo.'); }
    finally{setBusy(false)}
  }
  async function restore(file?:File){
    if(!file) return;
    const ok=window.confirm('Restaurar reemplazará los datos locales actuales por los del respaldo. ¿Continuar?');
    if(!ok){ if(inputRef.current) inputRef.current.value=''; return; }
    setBusy(true); setMessage('');
    try{ const data=await restoreBackupFile(file); setMessage(`Respaldo restaurado correctamente · ${new Date(data.createdAt).toLocaleString('es-BO')}. Recarga la app para ver todos los datos.`); }
    catch{ setMessage('El archivo no es un respaldo válido de ORÁCULO TAROT o su integridad no coincide.'); }
    finally{setBusy(false); if(inputRef.current) inputRef.current.value='';}
  }
  async function checkImages(){
    setImageDiagnostic(null);setImageProgress('Iniciando comprobación…');
    const result=await runImageDiagnostic((done,total)=>setImageProgress(`Comprobando imágenes ${done}/${total}…`));
    setImageDiagnostic(result);setImageProgress('');
  }

  return <section className="page">
    <span className="eyebrow">MÁS · ORÁCULO TAROT 1.0 BETA 7</span><h1>Herramientas</h1>
    <div className="feature-card static"><b>Respaldo local</b><span>Exporta lecturas, personas, notas, favoritos, evaluaciones y progreso de aprendizaje.</span></div>
    <div className="backup-actions">
      <button className="primary-cta" disabled={busy} onClick={()=>void backup()}>{busy?'Procesando…':'Crear respaldo'}</button>
      <button className="secondary-cta" disabled={busy} onClick={()=>inputRef.current?.click()}>Restaurar respaldo</button>
      <input ref={inputRef} hidden type="file" accept=".otbackup,application/json" onChange={e=>void restore(e.target.files?.[0])}/>
    </div>
    {message&&<div className="notice-card">{message}</div>}

    <div className="section-title"><h2>Diagnóstico visual</h2><span>78 cartas</span></div>
    <p className="muted">Comprueba que la publicación contiene físicamente las 78 imágenes Rider–Waite. Esta prueba revisa únicamente los archivos locales de la PWA; no cuenta servidores externos como válidos.</p>
    <button className="secondary-cta" onClick={()=>void checkImages()} disabled={!!imageProgress}>{imageProgress||'Comprobar las 78 imágenes'}</button>
    {imageDiagnostic&&<div className={`diagnostic-panel ${imageDiagnostic.ok?'ok':'fail'}`}>
      <b>{imageDiagnostic.ok?`✓ ${imageDiagnostic.loaded}/78 imágenes locales operativas`:`✗ ${imageDiagnostic.loaded}/78 imágenes locales operativas`}</b>
      {!imageDiagnostic.ok&&<><span>Cartas que no cargaron:</span>{imageDiagnostic.failed.slice(0,12).map(item=><small key={item.cardId}>{item.name}</small>)}{imageDiagnostic.failed.length>12&&<small>…y {imageDiagnostic.failed.length-12} más.</small>}</>}
    </div>}

    <div className="section-title"><h2>Diagnóstico del motor interpretativo</h2><span>independiente de imágenes</span></div>
    <p className="muted">Ejecuta internamente una tirada conocida: 7 de Oros · As de Espadas · 10 de Espadas. Comprueba cartas, interpretación general, conclusión y explicación.</p>
    <button className="secondary-cta" onClick={()=>setDiagnostic(runEngineSelfTest())}>Ejecutar diagnóstico del motor</button>
    {diagnostic&&<div className={`diagnostic-panel ${diagnostic.ok?'ok':'fail'}`}><b>{diagnostic.ok?'✓ Motor interpretativo operativo':'✗ Motor interpretativo con falla'}</b>{diagnostic.checks.map(item=><div key={item.label}><span>{item.ok?'✓':'✗'} {item.label}</span><small>{item.detail}</small></div>)}</div>}

    <div className="section-title"><h2>Diagnóstico de cámara</h2><span>Beta 7.0.1</span></div>
    <p className="muted">Cada vez que corriges o pruebas una carta, se guarda únicamente el puesto que obtuvo la carta real. Las fotografías no se guardan.</p>
    <div className="status-card camera-stats"><div><strong>{cameraStats.samples}</strong><span>pruebas registradas</span></div><div><strong>{cameraStats.samples?Math.round(cameraStats.top1/cameraStats.samples*100):0}%</strong><span>acierto Top 1</span></div><div><strong>{cameraStats.samples?Math.round(cameraStats.top5/cameraStats.samples*100):0}%</strong><span>carta real en Top 5</span></div></div>
    {!!cameraStats.samples&&<div className="notice-card info">Puesto promedio de la carta real: <b>{cameraStats.avgRank}/78</b>. Esta métrica sirve para comprobar si las siguientes versiones realmente mejoran.</div>}
    {!!cameraStats.orientationSamples&&<div className="status-card camera-orientation-stats"><div><strong>{cameraStats.orientationSamples}</strong><span>pruebas con orientación</span></div><div><strong>{Math.round(cameraStats.orientationCorrect/cameraStats.orientationSamples*100)}%</strong><span>orientación correcta</span></div><div><strong>{cameraStats.orientationCorrect}</strong><span>aciertos derecha/invertida</span></div></div>}
    <button className="secondary-cta" onClick={()=>setCameraStatsVersion(x=>x+1)}>Actualizar estadísticas de cámara</button>

    <div className="section-title"><h2>Funciones Beta 7.0.1</h2><span>motor híbrido individual</span></div>
    <div className="feature-card static"><b>📷 Reconocimiento híbrido V7.0.1</b><span>Combina puntos locales, homografía/RANSAC y un rescate visual independiente para cartas pequeñas o con pocos rasgos locales. La orientación usa primero la geometría de la homografía y el motor anterior permanece como respaldo.</span></div>
    <div className="feature-card static"><b>✦ Aclaratorias</b><span>Añade hasta dos cartas aclaratorias por posición sin borrar la lectura original.</span></div>
    <div className="feature-card static"><b>Catálogo ampliado</b><span>Incluye decisión, trabajo, dinero, relación completa, Cruz Celta y rueda anual.</span></div>

    <div className="section-title"><h2>Privacidad</h2><span>local</span></div>
    <p className="muted">Las lecturas se guardan en IndexedDB del dispositivo. Esta versión no necesita Supabase para conservarlas.</p>
  </section>;
}
