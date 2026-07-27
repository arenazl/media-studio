// Sección "Negocio" — muestra y permite EDITAR la metadata traída del KB (brief · marca · pantallas).
// Todas las secciones (Brief, Marca, Pantallas/Capturas) son 100% editables para que el usuario pueda
// ajustar contexto, corregir colores/fuentes, subir capturas propias y personalizar el kit.
import { useState, useRef, type ChangeEvent } from 'react';
import {
  Building2, Palette, FileText, LayoutGrid, ArrowRight, Check,
  Pencil, Plus, Trash2, Upload, X
} from 'lucide-react';
import { saveProject, type Project } from './lib/projects';
import type { PantallaKit, MarcaKit } from './lib/mediaKit';
import './ProjectInfo.css';

function inline(s: string) {
  return s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>);
}

// render markdown liviano del brief (h, listas, quote, bold).
function Brief({ md }: { md: string }) {
  return (
    <div className="pi-brief">
      {md.split('\n').map((ln, i) => {
        const t = ln.trimEnd();
        if (t.startsWith('## ')) return <h3 key={i}>{t.slice(3)}</h3>;
        if (t.startsWith('# ')) return <h2 key={i}>{inline(t.slice(2))}</h2>;
        if (t.startsWith('> ')) return <blockquote key={i}>{inline(t.slice(2))}</blockquote>;
        if (t.startsWith('  - ')) return <div key={i} className="pi-li pi-li--sub">{inline(t.slice(4))}</div>;
        if (t.startsWith('- ')) return <div key={i} className="pi-li">{inline(t.slice(2))}</div>;
        if (!t) return <div key={i} className="pi-gap" />;
        return <p key={i}>{inline(t)}</p>;
      })}
    </div>
  );
}

interface Screen {
  archivo?: string; url?: string; label?: string; nombre?: string;
  kind?: string; headline?: string; nav?: string[]; components?: string[] | string;
  layout?: string; flow?: string; framework?: string; zonaClave?: string; queDemuestra?: string;
}
const asList = (v: string[] | string | undefined): string[] =>
  Array.isArray(v) ? v.filter(Boolean) : v ? [v] : [];

function ScreenCard({
  s, shot, i, onRemove, onUpdate,
}: {
  s: Screen; shot?: string; i: number;
  onRemove?: () => void;
  onUpdate?: (field: 'nombre' | 'zonaClave', val: string) => void;
}) {
  const comps = asList(s.components);
  const nav = asList(s.nav);
  const titleText = s.nombre || s.label || `Pantalla ${i + 1}`;
  const imgSrc = s.url || shot;

  return (
    <div className="pi-screen">
      <div className="pi-screen-head">
        <span className="pi-screen-n">{i + 1}</span>
        <div className="pi-screen-title" style={{ flex: 1 }}>
          <input
            type="text"
            className="pi-input pi-screen-input-title"
            value={titleText}
            onChange={(e) => onUpdate?.('nombre', e.target.value)}
            placeholder={`Pantalla ${i + 1}`}
          />
          {s.kind && <span className="pi-screen-kind">{s.kind}</span>}
        </div>
        {onRemove && (
          <button className="pi-screen-del-btn" onClick={onRemove} title="Eliminar esta captura">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {s.headline && <div className="pi-screen-headline">{s.headline}</div>}
      {imgSrc ? (
        <img className="pi-screen-shot" src={imgSrc} alt={titleText} loading="lazy" />
      ) : (
        <div className="pi-screen-noshot">Sin imagen cargada</div>
      )}

      <div className="pi-screen-row">
        <span className="pi-screen-rowlbl">Zona Clave (Zoom/Paneo)</span>
        <input
          type="text"
          className="pi-input"
          value={s.zonaClave || ''}
          onChange={(e) => onUpdate?.('zonaClave', e.target.value)}
          placeholder="Ej: Tercio superior, Buscador, Formulario..."
        />
      </div>

      {nav.length > 0 && (
        <div className="pi-screen-nav">
          {nav.map((n, k) => <span key={k} className="pi-screen-navpill">{n}</span>)}
        </div>
      )}
      {comps.length > 0 && (
        <div className="pi-screen-row">
          <span className="pi-screen-rowlbl">Componentes</span>
          <ul className="pi-screen-comps">{comps.map((c, k) => <li key={k}>{c}</li>)}</ul>
        </div>
      )}
      {s.layout && <div className="pi-screen-row"><span className="pi-screen-rowlbl">Layout</span><span className="pi-screen-rowval">{s.layout}</span></div>}
      {s.flow && <div className="pi-screen-row"><span className="pi-screen-rowlbl">Flujo</span><span className="pi-screen-rowval">{s.flow}</span></div>}
    </div>
  );
}

type Tab = 'brief' | 'marca' | 'pantallas';
type ChangeFn = (updater: (p: Project) => Project, mode?: 'debounced' | 'flush') => void;

export default function ProjectInfo({
  project, onChange, onApprove, aprobado,
}: {
  project: Project;
  onChange?: ChangeFn;
  onApprove?: () => void;
  aprobado?: boolean;
}) {
  const [tab, setTab] = useState<Tab>('brief');

  // Estado del Brief
  const [briefText, setBriefText] = useState(project.brief || '');
  const [isEditingBrief, setIsEditingBrief] = useState(false);

  // Estado de la Marca
  const [brandName, setBrandName] = useState(project.brandKit?.name || project.marcaKit?.nombreExacto || project.name);
  const [phonetic, setPhonetic] = useState(project.brandKit?.phonetic || project.marcaKit?.fonetica || '');
  const [color, setColor] = useState(project.brandKit?.color || project.marcaKit?.colores?.primario || '#e11d48');
  const [acento, setAcento] = useState(project.marcaKit?.colores?.acento || '#f43f5e');
  const [fontTitulos, setFontTitulos] = useState(project.marcaKit?.tipografias?.titulos || 'Inter');
  const [fontTexto, setFontTexto] = useState(project.marcaKit?.tipografias?.texto || 'Inter');
  const [logoUrl, setLogoUrl] = useState(project.brandKit?.logoUrl || project.marcaKit?.logoUrl || '');
  const [isEditingMarca, setIsEditingMarca] = useState(false);

  // Estado de las Pantallas
  const initialScreens: Screen[] = project.pantallasKit?.length
    ? project.pantallasKit.map((pk) => ({ archivo: pk.archivo, url: pk.url, nombre: pk.nombre, zonaClave: pk.zonaClave, queDemuestra: pk.queDemuestra }))
    : Array.isArray(project.screens) && project.screens.length
      ? (project.screens as Screen[])
      : (project.screenshots || []).map((url, i) => ({ url, nombre: `Captura ${i + 1}`, zonaClave: 'Centro' }));

  const [screensList, setScreensList] = useState<Screen[]>(initialScreens);
  const [shotsList, setShotsList] = useState<string[]>(project.screenshots || []);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const screenInputRef = useRef<HTMLInputElement>(null);

  const nScreens = screensList.length;
  const briefLen = briefText.length;
  const estado = `${briefLen ? `Brief de ${briefLen.toLocaleString('es-AR')} caracteres` : 'Sin brief'} · ${nScreens} ${nScreens === 1 ? 'pantalla' : 'pantallas'}`;

  const TABS: { id: Tab; label: string; icon: typeof FileText; n?: number }[] = [
    { id: 'brief', label: 'Brief', icon: FileText },
    { id: 'marca', label: 'Marca', icon: Palette },
    { id: 'pantallas', label: 'Pantallas', icon: LayoutGrid, n: nScreens },
  ];

  const persist = (updated: Partial<Project>) => {
    const projSaved = saveProject({
      ...project,
      ...updated,
    });
    if (onChange) {
      onChange(() => projSaved, 'flush');
    }
  };

  // --- Guardar Brief ---
  const saveBrief = () => {
    persist({ brief: briefText });
    setIsEditingBrief(false);
  };

  // --- Guardar Marca ---
  const saveMarca = () => {
    const newBrandKit = {
      ...(project.brandKit || {}),
      name: brandName,
      phonetic,
      color,
      logoUrl,
    };
    const newMarcaKit: MarcaKit = {
      ...(project.marcaKit || {}),
      nombreExacto: brandName,
      fonetica: phonetic,
      logoUrl,
      colores: {
        ...(project.marcaKit?.colores || {}),
        primario: color,
        acento,
      },
      tipografias: {
        ...(project.marcaKit?.tipografias || {}),
        titulos: fontTitulos,
        texto: fontTexto,
      },
    };
    persist({ name: brandName, brandKit: newBrandKit, marcaKit: newMarcaKit });
    setIsEditingMarca(false);
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        setLogoUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- Manejo de Pantallas/Capturas ---
  const handleScreenshotsUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target?.result as string;
        if (dataUrl) {
          const newScreen: Screen = {
            archivo: `custom-${Date.now()}-${file.name}`,
            url: dataUrl,
            nombre: file.name.replace(/\.[^/.]+$/, ''),
            queDemuestra: 'Captura subida manualmente por el usuario',
            zonaClave: 'Centro',
          };
          setScreensList((prev) => {
            const next = [...prev, newScreen];
            const nextShots = [...shotsList, dataUrl];
            setShotsList(nextShots);
            const pkList: PantallaKit[] = next.map((s) => ({
              archivo: s.archivo || s.url || '',
              url: s.url || '',
              nombre: s.nombre || s.label || 'Pantalla',
              zonaClave: s.zonaClave || 'Centro',
              queDemuestra: s.queDemuestra,
            }));
            persist({ pantallasKit: pkList, screenshots: nextShots });
            return next;
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeScreen = (idx: number) => {
    const next = screensList.filter((_, i) => i !== idx);
    const nextShots = shotsList.filter((_, i) => i !== idx);
    setScreensList(next);
    setShotsList(nextShots);
    const pkList: PantallaKit[] = next.map((s) => ({
      archivo: s.archivo || s.url || '',
      url: s.url || '',
      nombre: s.nombre || s.label || 'Pantalla',
      zonaClave: s.zonaClave || 'Centro',
      queDemuestra: s.queDemuestra,
    }));
    persist({ pantallasKit: pkList, screenshots: nextShots });
  };

  const updateScreenField = (idx: number, field: 'nombre' | 'zonaClave', val: string) => {
    const next = screensList.map((s, i) => (i === idx ? { ...s, [field]: val } : s));
    setScreensList(next);
    const pkList: PantallaKit[] = next.map((s) => ({
      archivo: s.archivo || s.url || '',
      url: s.url || '',
      nombre: s.nombre || s.label || 'Pantalla',
      zonaClave: s.zonaClave || 'Centro',
      queDemuestra: s.queDemuestra,
    }));
    persist({ pantallasKit: pkList });
  };

  return (
    <div className="paso pi-paso">
      <div className="paso-head">
        <div className="paso-head-txt">
          <h2 className="paso-title"><Building2 size={20} /> Negocio</h2>
          <p className="paso-sub">{project.name} · {project.type || 'proyecto'} — datos traídos del KB / Media Kit (editables).</p>
        </div>
      </div>

      <div className="pi-tabs">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} className={tab === t.id ? 'pi-tab pi-tab--on' : 'pi-tab'} onClick={() => setTab(t.id)}>
              <Icon size={14} /> {t.label}
              {t.n != null && <span className="pi-tab-badge">{t.n}</span>}
            </button>
          );
        })}
      </div>

      <div className="paso-body">
        {/* --- TAB BRIEF --- */}
        {tab === 'brief' && (
          <section className="pi-card pi-main">
            <div className="pi-card-actions">
              {!isEditingBrief ? (
                <button className="pi-btn-edit" onClick={() => setIsEditingBrief(true)}>
                  <Pencil size={13} /> Editar Brief
                </button>
              ) : (
                <div className="pi-btn-group">
                  <button className="pi-btn-save" onClick={saveBrief}>
                    <Check size={13} /> Guardar cambios
                  </button>
                  <button className="pi-btn-cancel" onClick={() => { setBriefText(project.brief || ''); setIsEditingBrief(false); }}>
                    <X size={13} /> Cancelar
                  </button>
                </div>
              )}
            </div>

            {isEditingBrief ? (
              <textarea
                className="pi-textarea"
                rows={16}
                value={briefText}
                onChange={(e) => setBriefText(e.target.value)}
                placeholder="Escribí o editá el brief en markdown..."
              />
            ) : briefText ? (
              <Brief md={briefText} />
            ) : (
              <p className="pi-sub">Este proyecto no tiene brief aún.</p>
            )}
          </section>
        )}

        {/* --- TAB MARCA --- */}
        {tab === 'marca' && (
          <div className="pi-card">
            <div className="pi-card-actions">
              {!isEditingMarca ? (
                <button className="pi-btn-edit" onClick={() => setIsEditingMarca(true)}>
                  <Pencil size={13} /> Editar Marca
                </button>
              ) : (
                <div className="pi-btn-group">
                  <button className="pi-btn-save" onClick={saveMarca}>
                    <Check size={13} /> Guardar Marca
                  </button>
                  <button className="pi-btn-cancel" onClick={() => setIsEditingMarca(false)}>
                    <X size={13} /> Cancelar
                  </button>
                </div>
              )}
            </div>

            {!isEditingMarca ? (
              <div>
                <div className="pi-card-h"><Palette size={14} /> Marca</div>
                <div className="pi-brand">
                  {color && <span className="pi-swatch" style={{ background: color }} />}
                  <div>
                    <div className="pi-brand-name">{brandName}</div>
                    {phonetic && <div className="pi-sub">se lee "{phonetic}"</div>}
                    <div className="pi-sub">Primario: {color} | Acento: {acento}</div>
                    <div className="pi-sub">Tipografías: {fontTitulos} / {fontTexto}</div>
                  </div>
                </div>
                {logoUrl && <img className="pi-logo" src={logoUrl} alt="logo" />}
              </div>
            ) : (
              <div className="pi-form-grid">
                <div className="pi-form-field">
                  <label className="pi-label">Nombre de Marca</label>
                  <input type="text" className="pi-input" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
                </div>
                <div className="pi-form-field">
                  <label className="pi-label">Pronunciación / Fonética</label>
                  <input type="text" className="pi-input" value={phonetic} onChange={(e) => setPhonetic(e.target.value)} />
                </div>
                <div className="pi-form-row-2">
                  <div className="pi-form-field">
                    <label className="pi-label">Color Primario</label>
                    <div className="pi-color-wrap">
                      <input type="color" className="pi-color-picker" value={color} onChange={(e) => setColor(e.target.value)} />
                      <input type="text" className="pi-input" value={color} onChange={(e) => setColor(e.target.value)} />
                    </div>
                  </div>
                  <div className="pi-form-field">
                    <label className="pi-label">Color Acento</label>
                    <div className="pi-color-wrap">
                      <input type="color" className="pi-color-picker" value={acento} onChange={(e) => setAcento(e.target.value)} />
                      <input type="text" className="pi-input" value={acento} onChange={(e) => setAcento(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="pi-form-row-2">
                  <div className="pi-form-field">
                    <label className="pi-label">Fuente Títulos</label>
                    <input type="text" className="pi-input" value={fontTitulos} onChange={(e) => setFontTitulos(e.target.value)} />
                  </div>
                  <div className="pi-form-field">
                    <label className="pi-label">Fuente Texto</label>
                    <input type="text" className="pi-input" value={fontTexto} onChange={(e) => setFontTexto(e.target.value)} />
                  </div>
                </div>
                <div className="pi-form-field">
                  <label className="pi-label">Logo del Video</label>
                  <div className="pi-logo-upload-wrap">
                    <input type="text" className="pi-input" placeholder="URL de imagen del logo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
                    <button className="pi-btn-secondary" onClick={() => logoInputRef.current?.click()}>
                      <Upload size={13} /> Subir archivo
                    </button>
                    <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                  </div>
                  {logoUrl && <img className="pi-logo-preview" src={logoUrl} alt="Preview logo" />}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB PANTALLAS --- */}
        {tab === 'pantallas' && (
          <div className="pi-pantallas-wrap">
            <div className="pi-screens-top-actions">
              <button className="pi-btn-add-screen" onClick={() => screenInputRef.current?.click()}>
                <Plus size={14} /> Subir capturas propias
              </button>
              <input
                ref={screenInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleScreenshotsUpload}
              />
            </div>

            {screensList.length ? (
              <div className="pi-screens">
                {screensList.map((s, i) => (
                  <ScreenCard
                    key={i}
                    s={s}
                    shot={shotsList[i]}
                    i={i}
                    onRemove={() => removeScreen(i)}
                    onUpdate={(field, val) => updateScreenField(i, field, val)}
                  />
                ))}
              </div>
            ) : (
              <div className="pi-card pi-center-empty">
                <p className="pi-sub">Este proyecto no tiene capturas todavía.</p>
                <button className="pi-btn-secondary" onClick={() => screenInputRef.current?.click()}>
                  <Upload size={14} /> Subir tu primera captura
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="paso-foot paso-foot--split">
        <span className="paso-estado">{estado}</span>
        {onApprove && (
          <button className="paso-approve" onClick={onApprove}>
            {aprobado ? <><Check size={15} /> Negocio aprobado</> : <>Negocio revisado, al concepto <ArrowRight size={15} /></>}
          </button>
        )}
      </div>
    </div>
  );
}
