import { useEffect, useRef, useState } from 'react';

export function CameraView({back,startManual}:{back:()=>void;startManual:()=>void}){
  const inputRef=useRef<HTMLInputElement>(null);
  const [preview,setPreview]=useState('');
  const [name,setName]=useState('');

  useEffect(()=>()=>{if(preview) URL.revokeObjectURL(preview)},[preview]);

  function choose(file?:File){
    if(!file) return;
    if(preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setName(file.name||'Foto de la tirada');
  }

  return <section className="page camera-page">
    <button className="text-button" onClick={back}>← Tarot</button>
    <span className="eyebrow">CÁMARA · BASE 0.1</span>
    <h1>Fotografiar una tirada física</h1>
    <p className="lead">Esta pantalla ya permite tomar o elegir una foto de las cartas. El reconocimiento automático de cartas se incorporará después de estabilizar la lectura manual y virtual.</p>

    <div className="camera-guide">
      <b>Para una futura identificación fiable</b>
      <span>Coloca las cartas completas, sin superponerlas.</span>
      <span>Usa buena luz y evita reflejos.</span>
      <span>Toma la foto lo más perpendicular posible.</span>
    </div>

    <button className="primary-cta" onClick={()=>inputRef.current?.click()}>📷 Abrir cámara / elegir foto</button>
    <input ref={inputRef} hidden type="file" accept="image/*" capture="environment" onChange={e=>choose(e.target.files?.[0])}/>

    {preview&&<div className="camera-preview"><img src={preview} alt="Vista previa de la tirada"/><div><b>{name}</b><span>La imagen permanece local en esta versión.</span></div></div>}

    <div className="notice-card info"><b>Reconocimiento automático: en preparación</b><span>No se enviará esta foto a un servicio externo ni se fingirá una detección. La siguiente fase será localizar cada carta, identificar su orientación y pedir confirmación antes de interpretar.</span></div>

    <button className="secondary-cta" onClick={startManual}>Continuar con entrada manual</button>
  </section>;
}
