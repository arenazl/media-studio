// Wizard para crear proyectos nuevos. 4 pasos: identidad → tipo de contenido →
// reels base → resumen. En base a las respuestas configura el layout del proyecto.
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Check, Film, Volume2, Video, Layers, Sparkles, Folder, Type } from 'lucide-react';
import { saveProject, munifyBaseReels, type Project } from './lib/projects';
import './NewProjectWizard.css';

export type ContentType = 'reels' | 'video' | 'audio' | 'combinado';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (project: Project) => void;
}

const CONTENT_OPTIONS: { id: ContentType; label: string; desc: string; Icon: typeof Film }[] = [
  { id: 'reels',    label: 'Reels para redes', desc: 'Piezas cortas 9:16 — Instagram, TikTok, YouTube Shorts', Icon: Film },
  { id: 'video',    label: 'Video / Spot',      desc: 'Videos horizontales, demos, presentaciones 16:9',        Icon: Video },
  { id: 'audio',    label: 'Audio / Narración', desc: 'Solo narración, podcast, locución sin imágenes',          Icon: Volume2 },
  { id: 'combinado',label: 'Combinado',         desc: 'Reels + video + audio — todo el estudio disponible',     Icon: Layers },
];

const STEPS = 4;

export default function NewProjectWizard({ open, onClose, onCreated }: Props) {
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [step, setStep]   = useState(0);
  const [dir, setDir]     = useState<'next' | 'prev'>('next');

  // Datos del formulario
  const [name, setName]               = useState('');
  const [type, setType]               = useState('');
  const [contentType, setContentType] = useState<ContentType | null>(null);
  const [withBase, setWithBase]       = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      // Reset al abrir
      setStep(0); setDir('next');
      setName(''); setType(''); setContentType(null); setWithBase(false);
    } else {
      setVisible(false);
      const t = setTimeout(() => setRendered(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  const go = (n: number) => {
    setDir(n > step ? 'next' : 'prev');
    setStep(n);
  };

  // canProceed por paso
  const canProceed = [
    name.trim().length > 0,   // 0: identidad
    contentType !== null,      // 1: contenido
    true,                      // 2: reels (siempre puede pasar)
    true,                      // 3: resumen
  ][step] ?? true;

  const handleCreate = () => {
    const reels = withBase ? munifyBaseReels() : [];
    const proj = saveProject({
      name: name.trim(),
      type: type.trim(),
      preloaded: withBase,
      reels,
      contentType: contentType ?? 'combinado',
    });
    onCreated(proj);
    onClose();
  };

  if (!rendered) return null;

  const needsReels = contentType === 'reels' || contentType === 'combinado';

  return createPortal(
    <>
      <div className={`npw-backdrop${visible ? ' npw-visible' : ''}`} onClick={onClose} />
      <div className={`npw-container${visible ? ' npw-visible' : ''}`}>
        <div className={`npw-modal${visible ? ' npw-visible' : ''}`} onClick={(e) => e.stopPropagation()}>

          {/* ── Header ── */}
          <div className="npw-head">
            <div className="npw-accent-bar" />
            <div className="npw-head-inner">
              <div className="npw-head-title">
                <Folder size={15} />
                <span>Nuevo proyecto</span>
                <span className="npw-step-count">Paso {step + 1} de {STEPS}</span>
              </div>

              {/* Stepper */}
              <div className="npw-stepper">
                {Array.from({ length: STEPS }, (_, i) => (
                  <div key={i} className="npw-stepper-item">
                    <button
                      className={`npw-step-dot${i < step ? ' done' : ''}${i === step ? ' current' : ''}`}
                      onClick={() => i < step && go(i)}
                      disabled={i >= step}
                    >
                      {i < step ? <Check size={11} /> : i + 1}
                    </button>
                    {i < STEPS - 1 && <div className={`npw-step-line${i < step ? ' filled' : ''}`} />}
                  </div>
                ))}
              </div>

              <button className="npw-close" onClick={onClose} title="Cerrar"><X size={15} /></button>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="npw-body">
            <div className={dir === 'next' ? 'npw-slide-right' : 'npw-slide-left'} key={step}>
              {step === 0 && <StepIdentity name={name} setName={setName} type={type} setType={setType} />}
              {step === 1 && <StepContent selected={contentType} onSelect={setContentType} />}
              {step === 2 && <StepReels needsReels={needsReels} contentType={contentType} withBase={withBase} setWithBase={setWithBase} />}
              {step === 3 && <StepSummary name={name} type={type} contentType={contentType!} withBase={withBase} />}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="npw-foot">
            <button className="npw-btn-ghost" onClick={() => step === 0 ? onClose() : go(step - 1)}>
              <ChevronLeft size={15} />
              {step === 0 ? 'Cancelar' : 'Anterior'}
            </button>

            <div className="npw-dots">
              {Array.from({ length: STEPS }, (_, i) => (
                <div key={i} className={`npw-dot${i === step ? ' active' : ''}${i < step ? ' done' : ''}`} />
              ))}
            </div>

            <button className="npw-btn-primary" onClick={step === STEPS - 1 ? handleCreate : () => go(step + 1)} disabled={!canProceed}>
              {step === STEPS - 1
                ? <><Check size={15} /> Crear proyecto</>
                : <>Siguiente <ChevronRight size={15} /></>
              }
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ─── Step 0: Identidad ─────────────────────────────────────────────────── */
function StepIdentity({ name, setName, type, setType }: { name: string; setName: (v: string) => void; type: string; setType: (v: string) => void }) {
  return (
    <div>
      <StepHeader icon={<Folder size={18} />} title="Identidad del proyecto" desc="Dale un nombre y contexto. Después lo podés editar." />
      <div className="npw-field">
        <label className="npw-label">Nombre del proyecto</label>
        <input
          className="npw-input"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Munify, Spot verano 2025, Campaña escuelas…"
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) { /* handled by footer */ } }}
        />
      </div>
      <div className="npw-field">
        <label className="npw-label">Tipo / Rubro <span className="npw-optional">(opcional)</span></label>
        <input
          className="npw-input"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Ej. Municipal SaaS, Producto e-commerce, ONG…"
        />
      </div>
    </div>
  );
}

/* ─── Step 1: Tipo de contenido ─────────────────────────────────────────── */
function StepContent({ selected, onSelect }: { selected: ContentType | null; onSelect: (v: ContentType) => void }) {
  return (
    <div>
      <StepHeader icon={<Type size={18} />} title="¿Qué tipo de contenido vas a crear?" desc="Esto configura el layout y las herramientas que aparecen en el proyecto." />
      <div className="npw-options">
        {CONTENT_OPTIONS.map(({ id, label, desc, Icon }) => (
          <button
            key={id}
            className={`npw-option${selected === id ? ' selected' : ''}`}
            onClick={() => onSelect(id)}
          >
            <div className="npw-option-icon"><Icon size={20} /></div>
            <div className="npw-option-label">{label}</div>
            <div className="npw-option-desc">{desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Step 2: Reels base ─────────────────────────────────────────────────── */
function StepReels({ needsReels, contentType, withBase, setWithBase }: {
  needsReels: boolean;
  contentType: ContentType | null;
  withBase: boolean;
  setWithBase: (v: boolean) => void;
}) {
  const baseCount = munifyBaseReels().length;

  if (!needsReels) {
    // Para audio-only o video: mensaje de configuración correspondiente
    const msgs: Record<string, { title: string; desc: string; Icon: typeof Film }> = {
      audio:    { title: 'Estudio de audio listo', desc: 'El proyecto arranca con el estudio de narración y voz — podés grabar, ajustar marcadores y generar audio con varias voces.', Icon: Volume2 },
      video:    { title: 'Biblioteca de videos', desc: 'El proyecto incluye la biblioteca de clips, herramientas de montaje y exportación. Podés subir videos e imágenes y armar secuencias.', Icon: Video },
    };
    const m = msgs[contentType ?? 'audio'];
    return (
      <div>
        <StepHeader icon={m ? <m.Icon size={18} /> : <Layers size={18} />} title={m?.title ?? 'Configuración'} desc={m?.desc ?? ''} />
        <div className="npw-info-box">
          Todo listo — pasá al resumen para crear el proyecto.
        </div>
      </div>
    );
  }

  return (
    <div>
      <StepHeader icon={<Sparkles size={18} />} title="¿Arrancás con reels base?" desc="Los reels base de Munify son guiones y slides prearmados — los podés editar o reemplazar." />

      <label className={`npw-check-card${withBase ? ' checked' : ''}`}>
        <input
          type="checkbox"
          className="npw-check-box"
          checked={withBase}
          onChange={(e) => setWithBase(e.target.checked)}
        />
        <div>
          <p className="npw-check-title">Cargar los {baseCount} reels base de Munify</p>
          <p className="npw-check-desc">
            Tour general, Para el vecino, Para el intendente, Tesorería, Atención con IA.
            Cada uno trae su guión de narración y el boceto en video.
          </p>
        </div>
      </label>

      <label className={`npw-check-card${!withBase ? ' checked' : ''}`}>
        <input
          type="checkbox"
          className="npw-check-box"
          checked={!withBase}
          onChange={(e) => setWithBase(!e.target.checked)}
        />
        <div>
          <p className="npw-check-title">Empezar de cero</p>
          <p className="npw-check-desc">
            Proyecto en blanco — agregás reels y assets cuando quieras desde el estudio.
          </p>
        </div>
      </label>
    </div>
  );
}

/* ─── Step 3: Resumen ────────────────────────────────────────────────────── */
const CONTENT_LABELS: Record<ContentType, string> = {
  reels:     'Reels para redes (9:16)',
  video:     'Video / Spot (16:9)',
  audio:     'Audio / Narración',
  combinado: 'Combinado — todo el estudio',
};

const SECTIONS_FOR: Record<ContentType, string[]> = {
  reels:     ['Audio', 'Reel', 'Montaje', 'Export'],
  video:     ['Videos', 'Montaje', 'Export'],
  audio:     ['Audio'],
  combinado: ['Audio', 'Reel', 'Videos', 'Montaje', 'Export'],
};

function StepSummary({ name, type, contentType, withBase }: { name: string; type: string; contentType: ContentType; withBase: boolean }) {
  const sections = SECTIONS_FOR[contentType] ?? [];
  const reelCount = munifyBaseReels().length;
  return (
    <div>
      <StepHeader icon={<Check size={18} />} title="Todo listo — revisá y creá" desc="Así va a quedar configurado el proyecto." />
      <div className="npw-summary">
        <div className="npw-summary-row">
          <Folder size={16} className="npw-summary-icon" />
          <div>
            <p className="npw-summary-key">Nombre</p>
            <p className="npw-summary-val">{name}</p>
          </div>
        </div>
        {type && (
          <div className="npw-summary-row">
            <Type size={16} className="npw-summary-icon" />
            <div>
              <p className="npw-summary-key">Tipo</p>
              <p className="npw-summary-val">{type}</p>
            </div>
          </div>
        )}
        <div className="npw-summary-row">
          <Layers size={16} className="npw-summary-icon" />
          <div>
            <p className="npw-summary-key">Contenido</p>
            <p className="npw-summary-val">{CONTENT_LABELS[contentType]}</p>
          </div>
        </div>
        <div className="npw-summary-row">
          <Film size={16} className="npw-summary-icon" />
          <div>
            <p className="npw-summary-key">Secciones activas</p>
            <p className="npw-summary-val">{sections.join(' · ')}</p>
          </div>
        </div>
        {(contentType === 'reels' || contentType === 'combinado') && (
          <div className="npw-summary-row">
            <Sparkles size={16} className="npw-summary-icon" />
            <div>
              <p className="npw-summary-key">Reels base</p>
              <p className="npw-summary-val">{withBase ? `${reelCount} reels de Munify precargados` : 'Proyecto en blanco'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function StepHeader({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="npw-step-title">
      <div className="npw-step-icon">{icon}</div>
      <div>
        <h3 className="npw-step-name">{title}</h3>
        <p className="npw-step-desc">{desc}</p>
      </div>
    </div>
  );
}
