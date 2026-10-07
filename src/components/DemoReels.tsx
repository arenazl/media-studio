import { useEffect, useState } from 'react';
import '../styles/reelMotion.css';

function DemoSceneTitle({ title, subtitle, accentColor = '#fbbf24' }: { title: string; subtitle: string; accentColor?: string }) {
  return (
    <div className="rm-title-overlay">
      <div className="rm-title-backdrop" />
      <div className="rm-title-content">
        <h2 className="rm-title-heading">{title}</h2>
        <p className="rm-title-sub" style={{ color: accentColor }}>{subtitle}</p>
      </div>
    </div>
  );
}

function LogoHeader() {
  return (
    <div className="rm-logo-header">
      <div className="rm-logo-box">
        <svg className="rm-logo-svg" viewBox="0 0 100 100">
          <path d="M 22 18 Q 50 10 78 18 Q 80 24 50 26 Q 20 24 22 18 Z M 30 18 Q 50 15 70 18 Q 68 22 50 23 Q 32 22 30 18 Z" fillRule="evenodd" />
          <path d="M 22 32 Q 50 25 78 32 Q 78 38 50 40 Q 22 38 22 32 Z M 30 32 Q 50 29 70 32 Q 68 36 50 37 Q 35 36 30 32 Z" fillRule="evenodd" />
          <path d="M 25 46 Q 50 40 75 46 Q 75 51 50 53 Q 25 51 25 46 Z M 33 46 Q 50 43 67 46 Q 65 49 50 50 Q 35 49 33 46 Z" fillRule="evenodd" />
          <path d="M 30 60 Q 50 54 70 60 Q 70 64 50 66 Q 30 64 30 60 Z M 37 60 Q 50 57 63 60 Q 61 63 50 63 Q 39 63 37 60 Z" fillRule="evenodd" />
          <path d="M 36 73 Q 50 68 64 73 Q 64 77 50 78 Q 36 77 36 73 Z" fillRule="evenodd" />
          <path d="M 44 84 Q 50 81 56 84 Q 54 88 50 89 Q 46 88 44 84 Z" fillRule="evenodd" />
        </svg>
      </div>
      <div className="rm-logo-text">
        sin vueltas <span>¡YA!</span>
      </div>
    </div>
  );
}

function AmbientBlobs() {
  return (
    <div className="rm-blobs">
      <div className="rm-blob-1" />
      <div className="rm-blob-2" />
      <div className="rm-blob-3" />
    </div>
  );
}

// ESCENA 1 — HOME FULL BLEED (OCUPA EL 100% DEL ALTO DE PANTALLA 9:16)
function ReelHome() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '160px 48px 100px 48px', boxSizing: 'border-box' }} className="rm-fade-in">
      <DemoSceneTitle title="Buscá y cotizá tu evento en segundos" subtitle="Combos con descuento y garantía de seña protegida." accentColor="#fbbf24" />

      {/* Top Banner de Garantía */}
      <div style={{ width: '100%', background: '#7c3aed', color: '#fff', textAlign: 'center', padding: '16px', borderRadius: '20px 20px 0 0', fontWeight: '800', fontSize: '22px', zIndex: 10 }}>
        🛡️ Garantía de seña protegida con Split Payment
      </div>

      {/* Buscador Principal */}
      <div style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(124,58,237,0.4)', padding: '24px', borderRadius: '0 0 24px 24px', marginBottom: '32px', display: 'flex', gap: '16px', zIndex: 10 }}>
        <div style={{ flex: 1, background: '#1e293b', borderRadius: '18px', padding: '18px 24px', color: '#cbd5e1', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #334155' }}>
          <span style={{ fontSize: '28px' }}>🔍</span>
          <span>Buscá proveedores, servicios, categorías...</span>
        </div>
        <button style={{ background: '#7c3aed', color: '#fff', fontWeight: '900', padding: '18px 32px', borderRadius: '18px', fontSize: '22px', border: 'none' }}>
          Buscar
        </button>
      </div>

      {/* Banner de Combo Destacado FULL HEIGHT */}
      <div style={{ width: '100%', background: 'linear-gradient(180deg, rgba(124,58,237,0.25) 0%, rgba(15,23,42,0.95) 100%)', border: '2px solid rgba(124,58,237,0.5)', borderRadius: '32px', padding: '36px', marginBottom: '32px', zIndex: 10 }} className="rm-fade-in-up">
        <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
          <span className="rm-badge" style={{ fontSize: '18px', padding: '10px 24px' }}>PAQUETES TODO INCLUIDO</span>
          <span className="rm-badge rm-badge-amber" style={{ fontSize: '18px', padding: '10px 24px' }}>COMBO AHORRO</span>
        </div>
        <h2 style={{ fontSize: '48px', fontWeight: '900', color: '#fff', marginBottom: '16px', lineHeight: '1.1' }}>DJ + FOTO + AMBIENTACIÓN</h2>
        <p style={{ color: '#cbd5e1', fontSize: '24px', lineHeight: '1.4', marginBottom: '28px' }}>
          Ahorrá hasta $150.000 contratando el paquete completo para tu evento con proveedores verificados.
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', background: '#fff', color: '#3b0764', fontWeight: '900', padding: '18px 32px', borderRadius: '20px', fontSize: '22px' }}>
          Ver combos con descuento →
        </div>
      </div>

      {/* Rejilla de Recomendaciones ocupando el resto de pantalla */}
      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', zIndex: 10 }}>
        <h3 style={{ color: '#e2e8f0', fontWeight: '800', fontSize: '26px', marginBottom: '20px' }}>✨ Recomendaciones Personalizadas</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {[
            { title: 'Barra Catering Roma', type: 'Bar Móvil 4hs', price: '$6.000 /persona', rating: '⭐ 5.0' },
            { title: 'Estación Café Gourmet', type: 'Café de especialidad', price: '$56.500', rating: '⭐ 5.0' },
            { title: 'Catering Roma Gourmet', type: 'Food Truck', price: '$173.000', rating: '⭐ 5.0' },
            { title: 'Fotografía & Vídeo', type: 'Servicio completo', price: '$85.000', rating: '⭐ 5.0' },
          ].map((item, i) => (
            <div key={i} className="rm-tag-pop" style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '24px', padding: '24px', animationDelay: `${i * 120}ms` }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>{i === 0 ? '🍹' : i === 1 ? '☕' : i === 2 ? '🍔' : '📸'}</div>
              <h4 style={{ fontWeight: '800', color: '#fff', fontSize: '22px', marginBottom: '6px' }}>{item.title}</h4>
              <p style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '14px' }}>{item.type}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #1e293b' }}>
                <span style={{ color: '#fbbf24', fontWeight: '900', fontSize: '20px' }}>{item.price}</span>
                <span style={{ background: '#1e293b', padding: '6px 14px', borderRadius: '10px', color: '#fff', fontWeight: '800', fontSize: '16px' }}>{item.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ESCENA 2 — PROVEEDOR FULL BLEED (100% ALTO)
function ReelProveedorPerfil() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '160px 48px 100px 48px', boxSizing: 'border-box' }} className="rm-fade-in">
      <DemoSceneTitle title="Proveedores 100% Transparentes" subtitle="Perfil detallado, precios claros y opiniones reales." accentColor="#2dd4bf" />

      <div style={{ flex: 1, width: '100%', background: '#0f172a', border: '2px solid rgba(45,212,191,0.4)', borderRadius: '36px', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', zIndex: 10 }} className="rm-fade-in-up">
        <div className="rm-scan-line" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #2dd4bf, #a78bfa, #fbbf24)' }} />

        <div>
          <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
            <div style={{ width: '120px', height: '120px', background: 'rgba(245,158,11,0.2)', border: '2px solid rgba(251,191,36,0.4)', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px' }}>
              🍹
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '42px', fontWeight: '900', color: '#fff' }}>Barra Móvil Roma</h2>
                <span style={{ background: 'rgba(45,212,191,0.2)', color: '#2dd4bf', border: '1.5px solid rgba(45,212,191,0.5)', padding: '10px 24px', borderRadius: '99px', fontSize: '18px', fontWeight: '900' }}>
                  ✓ VERIFICADO
                </span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '24px', marginTop: '8px' }}>Puerto Madero • Coctelería de autor para eventos</p>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '14px' }}>
                <span style={{ color: '#fbbf24', fontWeight: '900', fontSize: '28px' }}>⭐ 5.0</span>
                <span style={{ color: '#64748b', fontSize: '20px', fontWeight: '700' }}>(48 eventos con seña protegida)</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(45,212,191,0.12)', border: '1.5px solid rgba(45,212,191,0.35)', borderRadius: '24px', padding: '28px', marginBottom: '32px' }}>
            <h4 style={{ color: '#2dd4bf', fontWeight: '900', fontSize: '24px', marginBottom: '8px' }}>🛡️ Reserva protegida con Split Payment</h4>
            <p style={{ color: '#cbd5e1', fontSize: '20px', lineHeight: '1.4' }}>Tu dinero queda congelado en custodia hasta que el evento se realice con éxito y des la conformidad.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ color: '#fff', fontWeight: '800', fontSize: '24px', marginBottom: '8px' }}>Paquetes Populares:</h4>
            {[
              { name: 'Combo 4hs Clásico (Fernet, Gin, Cerveza)', price: '$6.000 /persona' },
              { name: 'Combo Premium (Tragos de Autor + Barra Led)', price: '$8.500 /persona' },
              { name: 'Barra de Shots & Coctelería Sin Alcohol', price: '$4.500 /persona' },
            ].map((pack, i) => (
              <div key={i} className="rm-tag-pop" style={{ display: 'flex', justifyContent: 'space-between', padding: '24px', background: '#020617', border: '1px solid #1e293b', borderRadius: '20px', animationDelay: `${i * 150}ms` }}>
                <span style={{ color: '#e2e8f0', fontSize: '22px', fontWeight: '700' }}>{pack.name}</span>
                <span style={{ color: '#fbbf24', fontWeight: '900', fontSize: '22px' }}>{pack.price}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
          <div style={{ background: '#2dd4bf', color: '#042f2e', fontWeight: '900', fontSize: '24px', padding: '20px 40px', borderRadius: '20px', boxShadow: '0 8px 24px rgba(45,212,191,0.4)' }}>
            Solicitar Cotización →
          </div>
        </div>
      </div>
    </div>
  );
}

// ESCENA 3 — WIZARD FULL BLEED (100% ALTO)
function ReelWizard() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '160px 48px 100px 48px', boxSizing: 'border-box' }} className="rm-fade-in">
      <DemoSceneTitle title="Cotizá sin dar vueltas" subtitle="Completá 3 datos y los proveedores te responden al instante." accentColor="#c4b5fd" />

      <div style={{ flex: 1, width: '100%', background: '#0f172a', border: '2px solid rgba(124,58,237,0.5)', borderRadius: '36px', padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 10 }} className="rm-fade-in-up">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px', paddingBottom: '24px', borderBottom: '1px solid #1e293b' }}>
            <div>
              <span style={{ color: '#c4b5fd', fontWeight: '900', fontSize: '18px', letterSpacing: '0.1em' }}>ASISTENTE DE COTIZACIÓN</span>
              <h3 style={{ fontSize: '42px', fontWeight: '900', color: '#fff', marginTop: '8px' }}>¿Qué necesitas para tu evento?</h3>
            </div>
            <span style={{ background: 'rgba(124,58,237,0.3)', color: '#c4b5fd', fontWeight: '900', padding: '10px 24px', borderRadius: '99px', fontSize: '18px' }}>Paso 1 de 3</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '36px' }}>
            {[
              { label: 'Fiesta de 15 / Casamiento', icon: '👑', active: true },
              { label: 'Cumpleaños / Aniversario', icon: '🎂', active: false },
              { label: 'Evento Corporativo', icon: '👔', active: false },
              { label: 'Reunión con Amigos', icon: '🥂', active: false },
            ].map((opt, i) => (
              <div key={i} className="rm-tag-pop" style={{ padding: '36px', borderRadius: '28px', border: opt.active ? '3px solid #7c3aed' : '1px solid #1e293b', background: opt.active ? 'rgba(124,58,237,0.25)' : '#020617', textAlign: 'center', animationDelay: `${i * 120}ms` }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>{opt.icon}</div>
                <div style={{ fontWeight: '900', fontSize: '24px', color: opt.active ? '#fff' : '#94a3b8' }}>{opt.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ width: '100%', height: '16px', background: '#020617', borderRadius: '99px', overflow: 'hidden', border: '1px solid #1e293b', marginBottom: '20px' }}>
            <div className="rm-progress-bar" style={{ height: '100%', background: 'linear-gradient(90deg, #7c3aed, #fbbf24)' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#cbd5e1', fontSize: '20px', fontWeight: '700' }}>
            <span>Respuesta promedio: &lt; 15 minutos</span>
            <span style={{ color: '#fbbf24', fontWeight: '900' }}>100% Gratis sin compromiso</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ESCENA 4 — CTA FULL BLEED (100% ALTO)
function ReelCTA() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', textAlign: 'center' }} className="rm-fade-in">
      <AmbientBlobs />
      <LogoHeader />

      <div style={{ width: '100%', background: 'rgba(15,23,42,0.95)', border: '2px solid rgba(124,58,237,0.5)', borderRadius: '40px', padding: '60px 40px', textAlign: 'center', zIndex: 10, marginTop: '80px' }} className="rm-fade-in-up">
        <span className="rm-badge rm-badge-amber" style={{ fontSize: '20px', padding: '12px 32px', marginBottom: '32px' }}>SUMATE GRATIS</span>

        <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontStyle: 'italic', fontSize: '84px', color: '#fff', marginBottom: '32px', lineHeight: '1.1' }}>
          Entrá a <br />
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontStyle: 'normal', color: '#c4b5fd', fontWeight: '900' }}>sinvueltasya.com.ar</span>
        </h2>

        <p style={{ color: '#cbd5e1', fontSize: '28px', lineHeight: '1.4', marginBottom: '48px', maxWidth: '800px', margin: '0 auto 48px auto' }}>
          Armá tu evento en CABA y GBA con la tranquilidad de contar con proveedores reales y garantía de seña.
        </p>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', background: '#7c3aed', color: '#fff', fontWeight: '900', fontSize: '32px', padding: '24px 48px', borderRadius: '24px', boxShadow: '0 12px 36px rgba(124,58,237,0.5)' }}>
          Cotizar mi Fiesta Ahora →
        </div>
      </div>
    </div>
  );
}

export default function DemoReels() {
  const SCENES = 4;
  const DURATIONS = [7000, 7500, 7000, 6000];
  const [scene, setScene] = useState(0);

  useEffect(() => {
    if (scene >= SCENES - 1) return;
    const t = setTimeout(() => setScene((s) => s + 1), DURATIONS[scene]);
    return () => clearTimeout(t);
  }, [scene]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 99999 }}>
      <div
        className="rm-stage"
        style={{
          transform: 'scale(min(calc(100vw / 1080px), calc(100vh / 1920px)))',
          transformOrigin: 'center center',
        }}
      >
        <AmbientBlobs />
        <LogoHeader />

        {scene === 0 && <ReelHome />}
        {scene === 1 && <ReelProveedorPerfil />}
        {scene === 2 && <ReelWizard />}
        {scene === 3 && <ReelCTA />}

        <div className="rm-dots-bar">
          {Array.from({ length: SCENES }).map((_, i) => (
            <div key={i} className={`rm-dot ${i === scene ? 'active' : 'inactive'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
