// Generador de prompts para Flow / Veo. NO genera video (eso lo hacés en Flow
// con tu PRO). Tiene dos modos: TEMPLATES (prompts completos listos) y BUILDER
// (arma el prompt campo a campo). Duración default: 3-4 seconds.
import { useMemo, useState } from 'react';
import { Copy, Check, Video, ChevronDown, ChevronUp } from 'lucide-react';
import { BRAND } from './lib/brand';
import './VideoPromptBuilder.css';

// ─── TEMPLATES COMPLETOS (copiar directo en Flow) ──────────────────────────
const FULL_TEMPLATES: { label: string; tags: string[]; prompt: string }[] = [
  {
    label: 'Empleada con tablet en mostrador',
    tags: ['digitalización', 'oficina'],
    prompt: `Professional cinematic vertical video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium shot at a steady medium distance. An ordinary real-looking Argentine municipal employee, not a model, helping a neighbor at a service counter inside a public office, using a tablet (iPad) to assist him instead of paper forms — she shows the tablet screen and he taps and signs on it, fully digital, no paper anywhere, friendly and calm, natural indoor daylight, tablet screen content not clearly legible. Camera steady. No spoken dialogue, no talking, ambient office sound only. Vertical 9:16, 3-4 seconds. Use the attached logo image, shown as a small clean overlay in a top corner of the frame; no other on-screen text.`,
  },
  {
    label: 'Bache en la calle',
    tags: ['reclamo', 'vía pública'],
    prompt: `Professional cinematic vertical 9:16 video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium shot at a steady medium distance. An ordinary real-looking Argentine man, not a model, stands next to a large pothole on a residential neighborhood street, looking at it with mild frustration as a car carefully swerves around it, daytime natural light. No spoken dialogue, ambient street sound only. 3-4 seconds. Use the attached logo as a small clean overlay in a top corner; no other on-screen text.`,
  },
  {
    label: 'Luz de alumbrado rota (noche)',
    tags: ['reclamo', 'vía pública'],
    prompt: `Professional cinematic vertical 9:16 video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium shot at a steady medium distance. A broken street light flickering and going dark over a quiet Argentine neighborhood street at night, an ordinary real-looking resident looking up at it, moody darkness with faint ambient light. No spoken dialogue, ambient night sound only. 3-4 seconds. Use the attached logo as a small clean overlay in a top corner; no other on-screen text.`,
  },
  {
    label: 'Cola larga para trámites',
    tags: ['trámite', 'oficina'],
    prompt: `Professional cinematic vertical 9:16 video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium shot at a steady medium distance. A long line of ordinary everyday Argentine people, not models, waiting bored in the hallway of a municipal office, fluorescent light, a slow tired atmosphere. No spoken dialogue, ambient indoor sound only. 3-4 seconds. Use the attached logo as a small clean overlay in a top corner; no other on-screen text.`,
  },
  {
    label: 'Basura acumulada',
    tags: ['reclamo', 'vía pública'],
    prompt: `Professional cinematic vertical 9:16 video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium shot at a steady medium distance. An overflowing public trash container on an Argentine street corner with bags piled around it, an ordinary real-looking passerby walking by with a look of disgust, daytime natural light. No spoken dialogue, ambient street sound only. 3-4 seconds. Use the attached logo as a small clean overlay in a top corner; no other on-screen text.`,
  },
  {
    label: 'Vereda rota / peligrosa',
    tags: ['reclamo', 'vía pública'],
    prompt: `Professional cinematic vertical 9:16 video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium shot at a steady medium distance. A broken, uneven and cracked sidewalk on a neighborhood street, an ordinary real-looking elderly person walking carefully over it, soft natural daylight. No spoken dialogue, ambient street sound only. 3-4 seconds. Use the attached logo as a small clean overlay in a top corner; no other on-screen text.`,
  },
  {
    label: 'Pérdida de agua / caño roto',
    tags: ['reclamo', 'vía pública'],
    prompt: `Professional cinematic vertical 9:16 video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium shot at a steady medium distance. Water gushing from a broken pipe in the middle of an Argentine street forming a large puddle, a couple of ordinary real-looking neighbors looking at it with concern, daytime natural light. No spoken dialogue, ambient street sound only. 3-4 seconds. Use the attached logo as a small clean overlay in a top corner; no other on-screen text.`,
  },
  {
    label: 'Semáforo que no funciona',
    tags: ['reclamo', 'vía pública'],
    prompt: `Professional cinematic vertical 9:16 video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium shot at a steady medium distance. A dead, non-working traffic light at a busy Argentine street corner with slightly confused traffic, daytime natural light, ordinary cars and people. No spoken dialogue, ambient street sound only. 3-4 seconds. Use the attached logo as a small clean overlay in a top corner; no other on-screen text.`,
  },
  {
    label: 'Plaza / espacio público descuidado',
    tags: ['reclamo', 'espacio público'],
    prompt: `Professional cinematic vertical 9:16 video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium shot at a steady medium distance. A neglected neighborhood square with rusty broken playground equipment and overgrown grass, an ordinary real-looking mother with a small child looking disappointed, soft natural daylight. No spoken dialogue, ambient sound only. 3-4 seconds. Use the attached logo as a small clean overlay in a top corner; no other on-screen text.`,
  },
  {
    label: 'Vecino saca foto del bache',
    tags: ['reclamo', 'app'],
    prompt: `Professional cinematic vertical 9:16 video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium over-the-shoulder shot at a steady medium distance. An ordinary real-looking Argentine resident photographs a pothole with their smartphone on a residential street, phone screen not clearly legible, daytime natural light. No spoken dialogue, ambient street sound only. 3-4 seconds. Use the attached logo as a small clean overlay in a top corner; no other on-screen text.`,
  },
  {
    label: 'Vecino agobiado por papeles',
    tags: ['burocracia', 'oficina'],
    prompt: `Professional cinematic vertical 9:16 video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic. Medium shot at a steady medium distance. An ordinary tired Argentine resident, not a model, at a municipal counter holding a thick stack of paper forms, looking overwhelmed by bureaucracy, indoor fluorescent light. No spoken dialogue, ambient indoor sound only. 3-4 seconds. Use the attached logo as a small clean overlay in a top corner; no other on-screen text.`,
  },
];

// ─── BUILDER: opciones de cámara / look / duración ────────────────────────
const CAMERAS = [
  { key: 'tripod', label: 'Plano fijo', frag: 'static locked-off shot on a tripod, stabilized, no camera shake' },
  { key: 'dolly', label: 'Dolly-out', frag: 'slow continuous dolly-out, smooth and stabilized, no shake' },
  { key: 'gimbal', label: 'Gimbal', frag: 'smooth gimbal tracking shot, slow and stabilized' },
  { key: 'drone', label: 'Drone', frag: 'smooth cinematic aerial drone shot, slow descent' },
  { key: 'handheld', label: 'Handheld', frag: 'handheld smartphone shot, casual and naturally shaky like a real phone video' },
];

const LOOKS = [
  { key: 'ugc', label: 'Real / UGC', frag: 'shot on a smartphone, vertical, candid everyday moment, natural available light, slightly imperfect with a faint touch of grain and mild compression, a bit less crisp like an everyday phone video, authentic and unpolished UGC look — not cinematic, not studio, not too polished' },
  { key: 'cine', label: 'Cinematográfico', frag: 'Professional cinematic vertical video, clean, sharp and well-lit, smooth steady camera, high production quality, realistic' },
];

const DURATIONS = [
  { key: '2-3s', label: '2-3 seg' },
  { key: '3-4s', label: '3-4 seg' },
  { key: '5-7s', label: '5-7 seg' },
  { key: '8-10s', label: '8-10 seg' },
];

const PRESETS: { label: string; subject: string; scene: string; cam: string; look: string }[] = [
  { label: 'Pueblo (establecedor)', subject: '', scene: 'a small Argentine town with low brick houses, a central plaza with palm trees, a church and quiet streets, at golden hour with long warm shadows', cam: 'drone', look: 'cine' },
  { label: 'Vecino filma el bache', subject: 'a young Argentine person', scene: 'films a pothole on their residential neighborhood street with their phone, then turns the phone to themselves', cam: 'handheld', look: 'ugc' },
  { label: 'Cuadrilla resolviendo', subject: 'municipal workers in orange high-visibility vests', scene: 'repair a streetlight in an Argentine neighborhood, mid-morning, a small utility truck nearby', cam: 'gimbal', look: 'ugc' },
  { label: 'Oficina / gestión', subject: 'municipal employees', scene: 'work at desks on computers showing dashboards and maps in a modern town hall office, warm ambient light, plants', cam: 'dolly', look: 'cine' },
  { label: 'WhatsApp / celular', subject: 'a smiling middle-aged Argentine man', scene: 'looks at his smartphone at a kitchen table with a mate gourd nearby, soft morning light through a window', cam: 'tripod', look: 'ugc' },
  { label: 'Cierre al atardecer', subject: '', scene: 'an Argentine town at dusk, streetlights turning on, a calm plaza with a few people walking, warm blue-hour sky', cam: 'drone', look: 'cine' },
];

// ─── COMPONENTE ────────────────────────────────────────────────────────────
export default function VideoPromptBuilder() {
  // templates
  const [templatesOpen, setTemplatesOpen] = useState(true);
  const [copiedTpl, setCopiedTpl] = useState<number | null>(null);

  // builder
  const [subject, setSubject] = useState('a young Argentine woman in her late 20s with long loose hair, wearing a simple casual light-colored top, relaxed everyday clothes, no jacket and no blazer');
  const [scene, setScene] = useState('stands at the entrance of a town hall with columns and an Argentine flag');
  const [cam, setCam] = useState('handheld');
  const [look, setLook] = useState('ugc');
  const [duration, setDuration] = useState('3-4s');
  const [oneTake, setOneTake] = useState(true);
  const [extra, setExtra] = useState('');
  const [copiedBuilder, setCopiedBuilder] = useState(false);

  const builtPrompt = useMemo(() => {
    const camFrag = CAMERAS.find((c) => c.key === cam)?.frag || '';
    const lookFrag = LOOKS.find((l) => l.key === look)?.frag || '';
    const durLabel = duration.replace('s', ' seconds');
    const parts: string[] = [];
    parts.push(lookFrag + '.');
    if (oneTake) parts.push('One single continuous take — the background and location stay exactly the same the whole time, no scene change, no cut, no background switch.');
    if (subject.trim()) parts.push(subject.trim() + (scene.trim() ? ' ' + scene.trim() + '.' : '.'));
    else if (scene.trim()) parts.push(scene.trim() + '.');
    if (camFrag) parts.push('The camera: ' + camFrag + '.');
    if (extra.trim()) parts.push(extra.trim());
    parts.push(`Photorealistic, vertical 9:16, ${durLabel}, no on-screen text, no captions, no logos.`);
    return parts.join(' ');
  }, [subject, scene, cam, look, duration, oneTake, extra]);

  const copyTemplate = (i: number) => {
    navigator.clipboard.writeText(FULL_TEMPLATES[i].prompt).then(() => {
      setCopiedTpl(i);
      setTimeout(() => setCopiedTpl(null), 1500);
    });
  };

  const copyBuilder = () => {
    navigator.clipboard.writeText(builtPrompt).then(() => {
      setCopiedBuilder(true);
      setTimeout(() => setCopiedBuilder(false), 1500);
    });
  };

  return (
    <div className="vpb-wrap">

      {/* ── TEMPLATES ────────────────────────────────────────────────── */}
      <div className="vpb-section">
        <button className="vpb-section-toggle" onClick={() => setTemplatesOpen((v) => !v)}>
          <Video size={14} color={BRAND.gold} />
          <span>TEMPLATES LISTOS ({FULL_TEMPLATES.length})</span>
          {templatesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {templatesOpen && (
          <div className="vpb-tpl-grid">
            {FULL_TEMPLATES.map((t, i) => (
              <div key={i} className="vpb-tpl-card">
                <div className="vpb-tpl-header">
                  <span className="vpb-tpl-label">{t.label}</span>
                  <div className="vpb-tpl-tags">
                    {t.tags.map((tag) => <span key={tag} className="vpb-tpl-tag">{tag}</span>)}
                  </div>
                </div>
                <p className="vpb-tpl-preview">{t.prompt.slice(0, 120)}…</p>
                <button
                  onClick={() => copyTemplate(i)}
                  className={copiedTpl === i ? 'vpb-tpl-copy vpb-tpl-copy--done' : 'vpb-tpl-copy'}
                >
                  {copiedTpl === i ? <Check size={13} /> : <Copy size={13} />}
                  {copiedTpl === i ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── BUILDER CUSTOM ───────────────────────────────────────────── */}
      <div className="vpb-section">
        <div className="vpb-section-toggle vpb-section-toggle--static">
          <Video size={14} color={BRAND.azure} />
          <span>BUILDER CUSTOM</span>
        </div>

        <div className="vpb-root">
          {/* form */}
          <div className="vpb-form">
            <div className="vpb-presets">
              <span className="vpb-presets-label">ESCENAS LISTAS:</span>
              {PRESETS.map((p) => (
                <button key={p.label} onClick={() => { setSubject(p.subject); setScene(p.scene); setCam(p.cam); setLook(p.look); }} className="vpb-preset-btn">{p.label}</button>
              ))}
            </div>

            <div><div className="vpb-label">SUJETO (quién/qué)</div><textarea value={subject} onChange={(e) => setSubject(e.target.value)} rows={2} className="vpb-textarea" /></div>
            <div><div className="vpb-label">ESCENA / ACCIÓN</div><textarea value={scene} onChange={(e) => setScene(e.target.value)} rows={2} className="vpb-textarea" /></div>

            <div>
              <div className="vpb-label">CÁMARA</div>
              <div className="vpb-chip-row">{CAMERAS.map((c) => (<button key={c.key} onClick={() => setCam(c.key)} className={cam === c.key ? 'vpb-chip vpb-chip--on' : 'vpb-chip'} style={{ ['--accent']: BRAND.gold } as React.CSSProperties}>{c.label}</button>))}</div>
            </div>

            <div>
              <div className="vpb-label">LOOK</div>
              <div className="vpb-chip-row">{LOOKS.map((l) => (<button key={l.key} onClick={() => setLook(l.key)} className={look === l.key ? 'vpb-chip vpb-chip--on' : 'vpb-chip'} style={{ ['--accent']: BRAND.azure } as React.CSSProperties}>{l.label}</button>))}</div>
            </div>

            <div>
              <div className="vpb-label">DURACIÓN</div>
              <div className="vpb-chip-row">{DURATIONS.map((d) => (<button key={d.key} onClick={() => setDuration(d.key)} className={duration === d.key ? 'vpb-chip vpb-chip--on' : 'vpb-chip'} style={{ ['--accent']: BRAND.gold } as React.CSSProperties}>{d.label}</button>))}</div>
            </div>

            <label className="vpb-checkbox-row">
              <input type="checkbox" checked={oneTake} onChange={(e) => setOneTake(e.target.checked)} className="vpb-checkbox" />
              Una sola toma continua, mismo fondo, sin cortes
            </label>

            <div><div className="vpb-label">EXTRAS (opcional)</div><textarea value={extra} onChange={(e) => setExtra(e.target.value)} rows={2} placeholder="cualquier detalle más a mano…" className="vpb-textarea" /></div>
          </div>

          {/* output */}
          <div className="vpb-output">
            <div className="vpb-output-head">
              <Video size={17} color={BRAND.gold} />
              <span className="vpb-output-title">PROMPT PARA FLOW</span>
            </div>
            <div className="vpb-output-body">{builtPrompt}</div>
            <button onClick={copyBuilder} className={copiedBuilder ? 'vpb-copy-btn vpb-copy-btn--copied' : 'vpb-copy-btn'}>
              {copiedBuilder ? <Check size={17} /> : <Copy size={17} />} {copiedBuilder ? 'Copiado' : 'Copiar prompt'}
            </button>
            <div className="vpb-hint">Pegalo en Flow, generá, y si no clava: reroll (2-4 intentos). Para fijar persona/encuadre usá <b>image-to-video</b> con una imagen de referencia.</div>
          </div>
        </div>
      </div>

    </div>
  );
}
