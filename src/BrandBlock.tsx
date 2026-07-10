// Bloque "Marca" — deja los assets de branding DENTRO de la app para mandárselos a Flow, sin ir a
// buscar el archivo a una carpeta. Muestra el logo (con descarga: dataURL directo o proxy anti-CORS),
// el color de acento (chip copiable) y la marca fonética (copiable). Reutilizable: variante 'pack'
// (destacada, arriba del MASTER) y 'panel' (compacta, dentro del copiloto).
// Si el proyecto no cargó branding, NO renderiza nada (sin placeholders vacíos).
import { useState } from 'react';
import { Download, Copy, Check, Palette, AudioLines } from 'lucide-react';
import type { BrandKit } from './lib/brandKit';
import { brandLogoDownloadHref, isDataUrl } from './lib/brandAsset';
import { API_BASE } from './config';
import './BrandBlock.css';

interface BrandBlockProps {
  brandKit: BrandKit | undefined;
  variant?: 'pack' | 'panel';
}

export default function BrandBlock({ brandKit, variant = 'panel' }: BrandBlockProps) {
  const [copied, setCopied] = useState('');
  const logo = brandKit?.logoUrl?.trim();
  const color = brandKit?.color?.trim();
  const phonetic = brandKit?.phonetic?.trim();
  if (!logo && !color && !phonetic) return null;   // sin branding → no aparece

  const flash = (id: string) => { setCopied(id); setTimeout(() => setCopied(''), 1600); };
  const copy = async (id: string, text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* noop */ }
    flash(id);
  };
  const logoName = logo && isDataUrl(logo) ? 'logo' : (logo?.split('/').pop()?.split('?')[0] || 'logo');

  return (
    <section className={`brand-block brand-block--${variant}`} aria-label="Marca del proyecto">
      <div className="brand-block-h"><Palette size={13} /> Marca {brandKit?.name ? `· ${brandKit.name}` : ''}</div>

      {logo && (
        <div className="brand-logo">
          <div className="brand-logo-prev"><img src={logo} alt={brandKit?.name || 'logo'} loading="lazy" /></div>
          <a
            className="brand-logo-dl"
            href={brandLogoDownloadHref(logo, API_BASE)}
            download={logoName}
            target={isDataUrl(logo) ? undefined : '_blank'}
            rel="noreferrer"
          >
            <Download size={13} /> Descargar logo
          </a>
        </div>
      )}

      <div className="brand-chips">
        {color && (
          <button className="brand-chip" onClick={() => copy('color', color)} title="Copiar el color">
            <span className="brand-swatch" style={{ ['--brand-swatch' as string]: color }} />
            <span className="brand-chip-txt">{color}</span>
            {copied === 'color' ? <Check size={12} /> : <Copy size={12} />}
          </button>
        )}
        {phonetic && (
          <button className="brand-chip" onClick={() => copy('phon', phonetic)} title="Copiar la marca fonética">
            <AudioLines size={12} />
            <span className="brand-chip-txt">{phonetic}</span>
            {copied === 'phon' ? <Check size={12} /> : <Copy size={12} />}
          </button>
        )}
      </div>
    </section>
  );
}
