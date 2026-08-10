import { useState } from 'react';
import { BottomNav, type Tab } from '../components/BottomNav';
import { HomeView } from '../features/home/HomeView';
import { LibraryView } from '../features/library/LibraryView';
import { TarotView } from '../features/tarot/TarotView';
import { TarotHub, type TarotScreen } from '../features/tarot/TarotHub';
import { HistoryView } from '../features/tarot/HistoryView';
import { LearnView } from '../features/tarot/LearnView';
import { PeopleView } from '../features/people/PeopleView';
import { MoreView } from '../features/more/MoreView';
import { CameraView } from '../features/camera/CameraView';

export function App(){
  const [tab,setTab]=useState<Tab>('home');
  const [tarotScreen,setTarotScreen]=useState<TarotScreen>('hub');
  const openTarot=(screen:TarotScreen='hub')=>{setTarotScreen(screen);setTab('tarot')};
  return <div className="app-shell"><main>
    {tab==='home'&&<HomeView onNewReading={()=>openTarot('reading')} onLibrary={()=>openTarot('library')}/>} 
    {tab==='tarot'&&tarotScreen==='hub'&&<TarotHub go={setTarotScreen}/>} 
    {tab==='tarot'&&tarotScreen==='reading'&&<TarotView/>}
    {tab==='tarot'&&tarotScreen==='camera'&&<CameraView back={()=>setTarotScreen('hub')} startManual={()=>setTarotScreen('reading')}/>}
    {tab==='tarot'&&tarotScreen==='library'&&<div><LibraryView/><button className="floating-back" onClick={()=>setTarotScreen('hub')}>← Tarot</button></div>}
    {tab==='tarot'&&tarotScreen==='history'&&<HistoryView back={()=>setTarotScreen('hub')}/>} 
    {tab==='tarot'&&tarotScreen==='learn'&&<LearnView back={()=>setTarotScreen('hub')}/>} 
    {tab==='astro'&&<section className="page"><span className="eyebrow">ASTROLOGÍA</span><h1>Astro</h1><div className="feature-card static"><b>Reservado para V2</b><span>El núcleo actual permanece dedicado a consolidar ORÁCULO TAROT.</span></div></section>}
    {tab==='people'&&<PeopleView/>}
    {tab==='more'&&<MoreView/>}
  </main><BottomNav active={tab} onChange={next=>{setTab(next);if(next==='tarot')setTarotScreen('hub')}}/></div>;
}
