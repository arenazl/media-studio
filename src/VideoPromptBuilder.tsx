// Generador de prompts para Flow / Veo. NO genera video (eso lo hacés en Flow
// con tu PRO). Arma el prompt óptimo en inglés con el lenguaje de cámara y de
// "calidad real/imperfecta" que funciona, y lo copiás.
import { useMemo, useState } from 'react';
import { Copy, Check, Video } from 'lucide-react';
import { BRAND, FONT_SANS } from './lib/brand';

const CAMERAS = [
  { key: 'tripod', label: 'Plano fijo (trípode)', frag: 'static locked-off shot on a tripod, stabilized, no camera shake' },
  { key: 'dolly', label: 'Dolly-out lento', frag: 'slow continuous dolly-out, smooth and stabilized, no shake' },
  { key: 'gimbal', label: 'Gimbal (seguimiento)', frag: 'smooth gimbal tracking shot, slow and stabilized' },
  { key: 'drone', label: 'Drone', frag: 'smooth cinematic aerial drone shot, slow descent' },
  { key: 'handheld', label: 'Handheld (celular)', frag: 'handheld smartphone shot, casual and naturally shaky like a real phone video' },
];

const LOOKS = [
  { key: 'ugc', label: 'Real / imperfecto (UGC)', frag: 'shot on a smartphone, vertical, candid everyday moment, natural available light, slightly imperfect with a faint touch of grain and mild compression, a bit less crisp like an everyday phone video, authentic and unpolished UGC look — not cinematic, not studio, not too polished' },
  { key: 'cine', label: 'Cinematográfico', frag: 'cinematic look, professional color grading, shallow depth of field, beautiful natural light, crisp and polished' },
];

const PRESETS: { label: string; subject: string; scene: string; cam: string; look: string }[] = [
  { label: 'Pueblo (establecedor)', subject: '', scene: 'a small Argentine town with low brick houses, a central plaza with palm trees, a church and quiet streets, at golden hour with long warm shadows', cam: 'drone', look: 'cine' },
  { label: 'Vecino filma el bache', subject: 'a young Argentine person', scene: 'films a pothole on their residential neighborhood street with their phone, then turns the phone to themselves', cam: 'handheld', look: 'ugc' },
  { label: 'Cuadrilla resolviendo', subject: 'municipal workers in orange high-visibility vests', scene: 'repair a streetlight in an Argentine neighborhood, mid-morning, a small utility truck nearby', cam: 'gimbal', look: 'ugc' },
  { label: 'Oficina / gestión', subject: 'municipal employees', scene: 'work at desks on computers showing dashboards and maps in a modern town hall office, warm ambient light, plants', cam: 'dolly', look: 'cine' },
  { label: 'Atención por WhatsApp', subject: 'a smiling middle-aged Argentine man', scene: 'looks at his smartphone at a kitchen table with a mate gourd nearby, soft morning light through a window', cam: 'tripod', look: 'ugc' },
  { label: 'Cierre al atardecer', subject: '', scene: 'an Argentine town at dusk, streetlights turning on, a calm plaza with a few people walking, warm blue-hour sky', cam: 'drone', look: 'cine' },
];

export default function VideoPromptBuilder() {
  const [subject, setSubject] = useState('a young Argentine woman in her late 20s with long loose hair, wearing a simple casual light-colored top, relaxed everyday clothes, no jacket and no blazer');
  const [scene, setScene] = useState('stands at the entrance of a town hall with columns and an Argentine flag');
  const [cam, setCam] = useState('handheld');
  const [look, setLook] = useState('ugc');
  const [oneTake, setOneTake] = useState(true);
  const [extra, setExtra] = useState('');
  const [copied, setCopied] = useState(false);

  const prompt = useMemo(() => {
    const camFrag = CAMERAS.find((c) => c.key === cam)?.frag || '';
    const lookFrag = LOOKS.find((l) => l.key === look)?.frag || '';
    const parts: string[] = [];
    parts.push(lookFrag + '.');
    if (oneTake) parts.push('One single continuous take — the background and location stay exactly the same the whole time, no scene change, no cut, no background switch.');
    if (subject.trim()) parts.push(subject.trim() + (scene.trim() ? ' ' + scene.trim() + '.' : '.'));
    else if (scene.trim()) parts.push(scene.trim() + '.');
    if (camFrag) parts.push('The camera: ' + camFrag + '.');
    if (extra.trim()) parts.push(extra.trim());
    parts.push('Photorealistic, vertical 9:16, no on-screen text, no captions, no logos.');
    return parts.join(' ');
  }, [subject, scene, cam, look, oneTake, extra]);

  const copy = () => { navigator.clipboard.writeText(prompt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); };
  const loadPreset = (p: typeof PRESETS[number]) => { setSubject(p.subject); setScene(p.scene); setCam(p.cam); setLook(p.look); };

  const label: React.CSSProperties = { fontSize: 12, fontWeight: 800, color: BRAND.azure, letterSpacing: '0.04em', marginBottom: 6 };
  const ta: React.CSSProperties = { width: '100%', resize: 'vertical', borderRadius: 12, padding: '11px 13px', fontSize: 14, lineHeight: 1.5, fontFamily: FONT_SANS, color: '#fff', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', outline: 'none' };
  const chip = (on: boolean, ac = BRAND.gold): React.CSSProperties => ({ cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#fff', borderRadius: 999, padding: '6px 13px', background: on ? `${ac}26` : 'rgba(255,255,255,0.05)', border: `1.5px solid ${on ? ac : 'rgba(255,255,255,0.12)'}` });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 460px', gap: 28, alignItems: 'start', fontFamily: FONT_SANS, color: '#fff' }}>
      {/* FORM */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: BRAND.gold, letterSpacing: '0.04em' }}>ESCENAS LISTAS:</span>
          {PRESETS.map((p) => (<button key={p.label} onClick={() => loadPreset(p)} style={{ cursor: 'pointer', fontSize: 11.5, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 999, padding: '5px 11px' }}>{p.label}</button>))}
        </div>
        <div><div style={label}>SUJETO (quién/qué)</div><textarea value={subject} onChange={(e) => setSubject(e.target.value)} rows={2} style={ta} /></div>
        <div><div style={label}>ESCENA / ACCIÓN</div><textarea value={scene} onChange={(e) => setScene(e.target.value)} rows={2} style={ta} /></div>
        <div>
          <div style={label}>CÁMARA</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{CAMERAS.map((c) => (<button key={c.key} onClick={() => setCam(c.key)} style={chip(cam === c.key)}>{c.label}</button>))}</div>
        </div>
        <div>
          <div style={label}>LOOK / CALIDAD</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{LOOKS.map((l) => (<button key={l.key} onClick={() => setLook(l.key)} style={chip(look === l.key, BRAND.azure)}>{l.label}</button>))}</div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', fontSize: 13.5 }}>
          <input type="checkbox" checked={oneTake} onChange={(e) => setOneTake(e.target.checked)} style={{ accentColor: BRAND.gold, width: 16, height: 16 }} />
          Una sola toma continua, mismo fondo, sin cortes
        </label>
        <div><div style={label}>EXTRAS (opcional)</div><textarea value={extra} onChange={(e) => setExtra(e.target.value)} rows={2} placeholder="cualquier detalle más a mano…" style={ta} /></div>
      </div>

      {/* OUTPUT */}
      <div style={{ position: 'sticky', top: 18, borderRadius: 16, padding: 18, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BRAND.gold}40` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Video size={17} color={BRAND.gold} />
          <span style={{ fontSize: 12.5, fontWeight: 800, color: BRAND.gold, letterSpacing: '0.04em' }}>PROMPT PARA FLOW</span>
        </div>
        <div style={{ fontSize: 14.5, lineHeight: 1.65, color: 'rgba(255,255,255,0.92)', background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: 14, minHeight: 220, whiteSpace: 'pre-wrap' }}>{prompt}</div>
        <button onClick={copy} style={{ marginTop: 12, width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 13, borderRadius: 12, border: 'none', background: copied ? BRAND.azure : BRAND.gold, color: BRAND.ink, fontWeight: 800, fontSize: 15 }}>
          {copied ? <Check size={17} /> : <Copy size={17} />} {copied ? 'Copiado' : 'Copiar prompt'}
        </button>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 10, lineHeight: 1.5 }}>Pegalo en Flow, generá, y si no clava: reroll (2-4 intentos). Para fijar persona/encuadre usá <b>image-to-video</b> con una imagen de referencia.</div>
      </div>
    </div>
  );
}
