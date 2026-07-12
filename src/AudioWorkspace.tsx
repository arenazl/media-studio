// Envoltorio del workspace de Audio (rediseño F3, docs/rediseno/HANDOFF.md §6 + prototipo.dc.html
// ~línea 622): agrega el chrome del prototipo (encabezado + fonética de marca) ALREDEDOR de
// VoiceStudio — el estudio en sí NO se reescribe (se reskinea por CSS, ver VoiceStudio.css). El
// contrato de props (reelConfig/files/onGrabar/onAudio) es EXACTAMENTE el mismo: App.tsx sigue
// siendo el dueño único del proyecto/voz — este componente sólo agrega chrome de lectura.
import { AudioLines, ArrowRightToLine } from 'lucide-react';
import VoiceStudio from './VoiceStudio';
import { brandPhonetic } from './lib/brandKit';
import type { Project, VoiceConfig } from './lib/projects';
import './AudioWorkspace.css';

interface ReelCfg { slidesRef?: string | null; voiceConfig?: VoiceConfig | null }
interface SourceFile { id: string; label: string; text: string; sub?: string }

interface Props {
  project?: Project | null;                              // solo lectura (fonética de marca) — no se pasa a VoiceStudio
  reelConfig?: Record<string, ReelCfg>;
  files?: SourceFile[];
  onGrabar?: (reelId: string, vc: VoiceConfig) => void;
  onAudio?: (reelId: string, blob: Blob) => void;
  onGoEditor?: () => void;                                // "Al multipista" — navega al editor (Fase 9, hoy placeholder)
}

export default function AudioWorkspace({ project, reelConfig, files, onGrabar, onAudio, onGoEditor }: Props) {
  const phonetic = brandPhonetic(project?.brandKit);
  return (
    <div className="aw-root">
      <div className="aw-header">
        <div>
          <h1 className="aw-title">Audio</h1>
          <p className="aw-sub">Generá y ajustá cada toma de voz, música y SFX — después mandalas al multipista.</p>
        </div>
        <div className="aw-header-actions">
          {phonetic && (
            <div className="aw-phonetic" title="Fonética de marca — del KB del proyecto">
              <AudioLines size={13} />
              <span>«{project?.brandKit?.name || project?.name}» → <strong>{phonetic}</strong></span>
            </div>
          )}
          <button className="aw-btn" onClick={onGoEditor} disabled={!onGoEditor} title="Mandar la voz al editor multipista">
            <ArrowRightToLine size={14} /> Al multipista
          </button>
        </div>
      </div>
      <div className="aw-body">
        <VoiceStudio reelConfig={reelConfig} files={files} onGrabar={onGrabar} onAudio={onAudio} />
      </div>
    </div>
  );
}
