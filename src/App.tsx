import { useState } from 'react';
import { Mic, Film, Video, Layers, Download, AudioLines } from 'lucide-react';
import VoiceStudio from './VoiceStudio';
import VideosTab from './VideosTab';
import StageTab from './StageTab';
import './App.css';

type TabId = 'audio' | 'reel' | 'videos' | 'montaje' | 'export';

const TABS: { id: TabId; label: string; Icon: typeof Mic; color: string }[] = [
  { id: 'audio', label: 'Audio', Icon: Mic, color: 'var(--gold)' },
  { id: 'reel', label: 'Reel', Icon: Film, color: 'var(--amber)' },
  { id: 'videos', label: 'Videos', Icon: Video, color: 'var(--cyan)' },
  { id: 'montaje', label: 'Montaje', Icon: Layers, color: 'var(--violet)' },
  { id: 'export', label: 'Export', Icon: Download, color: 'var(--green)' },
];

export default function App() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const embed = params.get('embed') === '1';

  // Modo embed (ej. Munify por iframe): solo el estudio de audio, sin chrome.
  if (embed) {
    return (
      <div className="ms-embed">
        <div className="ms-embed-inner"><VoiceStudio /></div>
      </div>
    );
  }

  const initial = (params.get('tab') as TabId) || 'audio';
  const [tab, setTab] = useState<TabId>(TABS.some((t) => t.id === initial) ? initial : 'audio');

  return (
    <div className="ms-app">
      <header className="ms-header">
        <AudioLines size={28} className="ms-brand-mark" />
        <div className="ms-brand">
          <h1 className="ms-brand-title">Media Studio</h1>
          <p className="ms-brand-sub">Pipeline local de reels · audio · video · montaje (Claude headless)</p>
        </div>
        <nav className="ms-tabs">
          {TABS.map((t, i) => {
            const on = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={on ? 'ms-tab ms-tab--on' : 'ms-tab'} style={{ ['--accent']: t.color } as React.CSSProperties}>
                <span className="ms-tab-idx">{i + 1}</span><t.Icon size={14} /> {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="ms-content">
        {tab === 'audio' && <VoiceStudio />}
        {tab === 'reel' && (
          <StageTab title="REEL — slides animados (resolución Instagram 1080×1920)" color="var(--amber)"
            description="Pegá el prompt + el MD de contexto del reel. Lo genero como recorrido/mockups (como los que ya hicimos) y lo combino con el audio de la solapa Audio."
            placeholder="Ej: Reel 9:16 para Munify. Tour de la app, 6 escenas, estética dark + naranja. (pegá acá tu MD de contexto / guion)"
            hint={<>Se une con el <b>audio</b> generado en la solapa Audio. El reel queda en la carpeta del proyecto.</>} />
        )}
        {tab === 'videos' && <VideosTab />}
        {tab === 'montaje' && (
          <StageTab title="MONTAJE — intercalar slides + videos" color="var(--violet)"
            description="Decime cómo mechar los slides del reel con los videos de Flow. Armo el corte y te muestro ~10 frames del resultado para que elijas y ajustes."
            placeholder="Ej: arrancá con el slide 1, meté bache.mp4 en el segundo 3, volvé a slides en el 6, cerrá con cuadrilla.mp4…"
            hint={<>Los videos salen de la carpeta local (solapa <b>Videos</b>). Te devuelvo frames para revisar.</>} />
        )}
        {tab === 'export' && (
          <StageTab title="EXPORT — reel final" color="var(--green)"
            description="Unifico todo (slides + audios + videos) en el reel final, vía Claude headless local. Decime el corte definitivo y los niveles."
            placeholder="Ej: unificá todo, música Funk al 70% con ducking, voz Lucía, salida 1080×1920 mp4 a 30fps."
            hint={<>Corre por <b>Claude headless</b> local; el mp4 final queda en la carpeta del proyecto.</>} />
        )}
      </div>
    </div>
  );
}
