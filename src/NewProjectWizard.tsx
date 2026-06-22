// Wizard para crear proyectos nuevos. 4 pasos: identidad → tipo de contenido →
// reels base → resumen. En base a las respuestas configura el layout del proyecto.
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Check, Film, Volume2, Video, Layers, Sparkles, Folder, Type, Lightbulb } from 'lucide-react';
import { saveProject, type Project } from './lib/projects';
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

// Ayuda contextual por paso (panel hint a la derecha del wizard).
const HINTS: { title: string; lines: string[] }[] = [
  { title: 'Nombre y rubro', lines: ['Un nombre claro para encontrarlo después en el selector.', 'El rubro ayuda a que la estrategia y los guiones peguen mejor con tu negocio.'] },
  { title: 'Qué vas a crear', lines: ['El formato define las herramientas que aparecen.', 'Reels 9:16 → redes · Video 16:9 → YouTube/web · Audio → solo voz · Combinado → todo el estudio.'] },
  { title: 'Arrancás en blanco', lines: ['El proyecto empieza vacío.', 'Cargás los reels en el editor, o los generás desde el brief del negocio + las capturas.'] },
  { title: 'Listo para crear', lines: ['Revisá el resumen y creá.', 'Después armás todo desde el estudio: animaciones, audio, videos, transiciones y texto.'] },
];

export default function NewProjectWizard({ open, onClose, onCreated }: Props) {
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [step, setStep]   = useState(0);
  const [dir, setDir]     = useState<'next' | 'prev'>('next');

  // Datos del formulario
  const [name, setName]               = useState('');
  const [type, setType]               = useState('');
  const [contentType, setContentType] = useState<ContentType | null>(null);

  useEffect(() => {
    if (open) {
      setRendered(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      // Reset al abrir
      setStep(0); setDir('next');
      setName(''); setType(''); setContentType(null);
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
    const proj = saveProject({
      name: name.trim(),
      type: type.trim(),
      reels: [],   // arranca en blanco — los reels se cargan en el editor o se generan del brief
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

          {/* ── Body + hint lateral ── */}
          <div className="npw-body-row">
            <div className="npw-body">
              <div className={dir === 'next' ? 'npw-slide-right' : 'npw-slide-left'} key={step}>
                {step === 0 && <StepIdentity name={name} setName={setName} type={type} setType={setType} />}
                {step === 1 && <StepContent selected={contentType} onSelect={setContentType} />}
                {step === 2 && <StepReels needsReels={needsReels} contentType={contentType} />}
                {step === 3 && <StepSummary name={name} type={type} contentType={contentType!} />}
              </div>
            </div>
            <aside className="npw-hint">
              <div className="npw-hint-ic"><Lightbulb size={16} /></div>
              <h4 className="npw-hint-title">{HINTS[step]?.title}</h4>
              {HINTS[step]?.lines.map((l, i) => <p key={i} className="npw-hint-line">{l}</p>)}
            </aside>
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
          placeholder="Ej. Spot verano 2025, Campaña escuelas, Lanzamiento app…"
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

/* ─── Step 2: Cómo arranca el proyecto ───────────────────────────────────── */
function StepReels({ needsReels, contentType }: {
  needsReels: boolean;
  contentType: ContentType | null;
}) {
  if (!needsReels) {
    const msgs: Record<string, { title: string; desc: string; Icon: typeof Film }> = {
      audio:    { title: 'Estudio de audio listo', desc: 'El proyecto arranca con el estudio de narración y voz — podés grabar, ajustar marcadores y generar audio con varias voces.', Icon: Volume2 },
      video:    { title: 'Biblioteca de videos', desc: 'El proyecto incluye la biblioteca de clips, herramientas de montaje y exportación. Podés subir videos e imágenes y armar secuencias.', Icon: Video },
    };
    const m = msgs[contentType ?? 'audio'];
    return (
      <div>
        <StepHeader icon={m ? <m.Icon size={18} /> : <Layers size={18} />} title={m?.title ?? 'Configuración'} desc={m?.desc ?? ''} />
        <div className="npw-info-box">Todo listo — pasá al resumen para crear el proyecto.</div>
      </div>
    );
  }

  return (
    <div>
      <StepHeader icon={<Sparkles size={18} />} title="Empezás en blanco" desc="El proyecto arranca sin reels. Cargás tu guion en el editor, o generás el kit a partir del brief del negocio + las capturas." />
      <div className="npw-info-box">
        Pasá al resumen para crear el proyecto. Después sumás reels, animaciones, música y voz desde el estudio.
      </div>
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
  reels:     ['Editor', 'Audio', 'Prompts', 'Videos'],
  video:     ['Editor', 'Videos', 'Prompts'],
  audio:     ['Audio'],
  combinado: ['Editor', 'Audio', 'Videos', 'Prompts'],
};

function StepSummary({ name, type, contentType }: { name: string; type: string; contentType: ContentType }) {
  const sections = SECTIONS_FOR[contentType] ?? [];
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
              <p className="npw-summary-key">Reels</p>
              <p className="npw-summary-val">Proyecto en blanco — los cargás en el editor</p>
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
