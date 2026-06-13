import { useState } from 'react';
import { Mic, Video, AudioLines } from 'lucide-react';
import { BRAND, FONT_DISPLAY, FONT_SANS } from './lib/brand';
import VoiceStudio from './VoiceStudio';
import VideoPromptBuilder from './VideoPromptBuilder';

export default function App() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const embed = params.get('embed') === '1';
  const initial = params.get('tool') === 'video' ? 'video' : 'voz';
  const [tab, setTab] = useState<'voz' | 'video'>(initial);
  const tabs = [
    { id: 'voz' as const, label: 'Voz', Icon: Mic },
    { id: 'video' as const, label: 'Video (prompts)', Icon: Video },
  ];

  // Modo embed: se inyecta en otra app (ej. Munify /reels) por iframe. Sin
  // header ni tabs — solo la herramienta.
  if (embed) {
    return (
      <div style={{ minHeight: '100vh', background: BRAND.ink, fontFamily: FONT_SANS, color: '#fff', padding: 18 }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>{tab === 'voz' ? <VoiceStudio /> : <VideoPromptBuilder />}</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: BRAND.ink, fontFamily: FONT_SANS, color: '#fff', padding: '28px 24px 60px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 14, maxWidth: 1180, margin: '0 auto 24px', flexWrap: 'wrap' }}>
        <AudioLines size={30} color={BRAND.gold} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontStyle: 'italic', fontWeight: 500, fontSize: 28, margin: 0, letterSpacing: '-0.02em' }}>Media Studio</h1>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Voz (TTS) + prompts de video para Flow · servicio reusable</p>
        </div>
        <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 5 }}>
          {tabs.map((t) => {
            const on = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontSize: 13.5, fontWeight: 700, color: on ? BRAND.ink : '#fff', background: on ? BRAND.gold : 'transparent', border: 'none', borderRadius: 9, padding: '9px 16px' }}>
                <t.Icon size={15} /> {t.label}
              </button>
            );
          })}
        </div>
      </header>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        {tab === 'voz' ? <VoiceStudio /> : <VideoPromptBuilder />}
      </div>
    </div>
  );
}
