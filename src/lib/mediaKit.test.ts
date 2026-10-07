// WO-K1/K2 — el MEDIA KIT: escaneo + validación + servido seguro de archivos (server/mediaKit.mjs)
// y los conversores kit → proyecto (src/lib/mediaKit.ts).
//
// Fixture: `src/lib/__fixtures__/kits-root` = una raíz FALSA con la misma forma que D:\Code —
// app-demo (kit completo, textos marcados [DEMO], PNGs placeholder generados), app-incompleta (le
// faltan campos), app-json-roto (JSON ilegible) y sin-kit (carpeta sin media-kit/). Nada de esto
// toca D:\Code ni inventa datos reales (regla dura 11).
import { describe, it, expect } from 'vitest';
// @ts-expect-error el módulo del server es .mjs sin tipos; el resolver de vitest lo carga igual.
import { scanMediaKits, readMediaKit, resolveKitFile, validarMediaKit } from '../../server/mediaKit.mjs';
import {
  kitFileUrl, mediaKitToBrief, mediaKitToBrandKit, mediaKitToMarcaKit, mediaKitToPantallas,
  mediaKitToProjectInput, mediaKitParaMolde, pantallaDeEscena, isValidMediaKit, type MediaKit,
} from './mediaKit';

// La raíz del fixture como path del SO. Sin `node:path`/`node:url` a propósito: el tsconfig del front
// no tiene @types/node, así que el test se queda en APIs del bundler (import.meta.url) y usa el
// propio módulo del server para leer el kit.
const ROOT = decodeURIComponent(new URL('./__fixtures__/kits-root', import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
const KIT = readMediaKit('app-demo', ROOT) as MediaKit;

interface Resumen { id: string; app: string; pantallas: number; momentos: number; valido: boolean; faltantes: string[]; carpeta: string; error?: string }
const scan = (): Resumen[] => scanMediaKits(ROOT) as Resumen[];

describe('scanMediaKits — descubrimiento en el primer nivel de la raíz', () => {
  it('encuentra los kits y cuenta pantallas/momentos', () => {
    const kits = scan();
    const demo = kits.find((k) => k.id === 'app-demo');
    expect(demo).toBeTruthy();
    expect(demo!.pantallas).toBe(2);
    expect(demo!.momentos).toBe(1);
    expect(demo!.valido).toBe(true);
    expect(demo!.carpeta).toBe('app-demo');
  });
  it('ignora las carpetas SIN media-kit/', () => {
    expect(scan().some((k) => k.id === 'sin-kit')).toBe(false);
  });
  it('un kit incompleto se lista igual, marcado inválido y con qué le falta', () => {
    const k = scan().find((x) => x.id === 'app-incompleta');
    expect(k?.valido).toBe(false);
    expect(k?.faltantes).toContain('marca');
    expect(k?.faltantes).toContain('pantallas');
  });
  it('un JSON roto NO tumba el escaneo (entra inválido, con su error)', () => {
    const kits = scan();
    const roto = kits.find((k) => k.id === 'app-json-roto');
    expect(roto?.valido).toBe(false);
    expect(kits.length).toBeGreaterThanOrEqual(3);
  });
  it('una raíz inexistente devuelve lista vacía, no explota', () => {
    expect(scanMediaKits(`${ROOT}/no-existe`)).toEqual([]);
  });
});

describe('validarMediaKit — campos mínimos del contrato', () => {
  it('el kit DEMO valida', () => {
    expect(validarMediaKit(KIT)).toEqual({ valido: true, faltantes: [] });
  });
  it('sin pantallas ni marca lista lo que falta', () => {
    const r = validarMediaKit({ id: 'x', app: 'X' }) as { valido: boolean; faltantes: string[] };
    expect(r.valido).toBe(false);
    expect(r.faltantes).toEqual(['marca', 'pantallas']);
  });
});

describe('readMediaKit', () => {
  it('devuelve el JSON completo del kit', () => {
    const kit = readMediaKit('app-demo', ROOT) as MediaKit;
    expect(kit.id).toBe('app-demo');
    expect(kit.pantallas?.[0].archivo).toBe('screens/01-demo-home.png');
  });
  it('un id que no existe devuelve null (no revienta ni adivina carpeta)', () => {
    expect(readMediaKit('no-existe', ROOT)).toBeNull();
  });
  it('el id sale SIEMPRE resuelto, aunque el kit no traiga el campo (caso del 1er kit real)', () => {
    // app-json-roto no sirve para esto; usamos el kit incompleto, que tampoco declara pantallas.
    const kit = readMediaKit('app-incompleta', ROOT) as MediaKit;
    expect(kit.id).toBe('app-incompleta');
  });
});

describe('resolveKitFile — anti path traversal (superficie de seguridad del endpoint)', () => {
  it('sirve una captura del kit', () => {
    const r = resolveKitFile('app-demo', 'screens/01-demo-home.png', ROOT) as { ok: boolean; file: string; mime: string };
    expect(r.ok).toBe(true);            // ok === el archivo EXISTE (resolveKitFile lo chequea)
    expect(r.mime).toBe('image/png');
    expect(r.file.replace(/\\/g, '/')).toContain('app-demo/media-kit/screens/01-demo-home.png');
  });
  it('sirve el logo svg', () => {
    expect((resolveKitFile('app-demo', 'logo.svg', ROOT) as { ok: boolean }).ok).toBe(true);
  });
  it.each([
    ['../../../secreto.png', 400],
    ['screens/../../../otra-app/media-kit/logo.svg', 400],
    ['..\\..\\windows\\win.png', 400],
    ['/etc/passwd.png', 400],
    ['C:/Windows/system.png', 400],
    ['', 400],
  ])('rechaza %s con %i', (rel, code) => {
    const r = resolveKitFile('app-demo', rel, ROOT) as { ok: boolean; code: number };
    expect(r.ok).toBe(false);
    expect(r.code).toBe(code);
  });
  it('rechaza extensiones que no son imagen/fuente (el kit no es un file server)', () => {
    const r = resolveKitFile('app-demo', 'media-kit.json', ROOT) as { ok: boolean; code: number; error: string };
    expect(r.ok).toBe(false);
    expect(r.code).toBe(400);
    expect(r.error).toContain('extensión no permitida');
  });
  it('un id inventado no resuelve ninguna carpeta', () => {
    expect((resolveKitFile('../../otra', 'logo.svg', ROOT) as { code: number }).code).toBe(404);
  });
  it('un archivo que no existe da 404', () => {
    expect((resolveKitFile('app-demo', 'screens/99-no-existe.png', ROOT) as { code: number }).code).toBe(404);
  });
});

describe('kitFileUrl', () => {
  it('arma la URL del endpoint respetando la estructura de la ruta', () => {
    expect(kitFileUrl('app-demo', 'screens/01-demo-home.png')).toBe('/api/media-kit/app-demo/file/screens/01-demo-home.png');
  });
  it('encodea cada segmento (espacios, acentos) sin romper las barras', () => {
    expect(kitFileUrl('app demo', 'screens/01 inicio.png')).toBe('/api/media-kit/app%20demo/file/screens/01%20inicio.png');
  });
});

describe('kit → proyecto', () => {
  it('el brief son HECHOS y las sugerencias van aparte, marcadas como opinión', () => {
    const brief = mediaKitToBrief(KIT);
    expect(brief).toContain('# [DEMO] Kit de prueba — brief (desde el media kit de la app)');
    expect(brief).toContain('## Por qué (diferenciales)');
    expect(brief).toContain('## Dolores del cliente');
    expect(brief).toContain('## Sugerencias de la app (OPINIÓN, no hechos — tomar o dejar)');
    // la sugerencia NO puede colarse entre los hechos: va después del encabezado de opinión.
    expect(brief.indexOf('sugerencia de la app')).toBeGreaterThan(brief.indexOf('## Sugerencias de la app'));
    // sin números reales cargados NO se inventa la sección (regla dura 11).
    expect(brief).not.toContain('## Números REALES');
  });
  it('el brandKit conserva su shape de siempre (no cambia para nadie)', () => {
    const bk = mediaKitToBrandKit(KIT)!;
    expect(Object.keys(bk).sort()).toEqual(['color', 'logoPos', 'logoSvg', 'logoUrl', 'name', 'phonetic']);
    expect(bk.name).toBe('[DEMO] Kit de prueba');
    expect(bk.logoUrl).toBe('/api/media-kit/app-demo/file/logo.svg');
    expect(bk.phonetic).toBe('demo kit de prueba');
  });
  it('marcaKit trae la ficha completa con los logos resueltos', () => {
    const mk = mediaKitToMarcaKit(KIT)!;
    expect(mk.estiloUI?.rasgoDistintivo).toContain('[DEMO]');
    expect(mk.tipografias?.titulos).toContain('[DEMO]');
    expect(mk.logoUrl).toBe('/api/media-kit/app-demo/file/logo.svg');
  });
  it('las pantallas llevan relpath + URL + la metadata que anima el mockup', () => {
    const ps = mediaKitToPantallas(KIT);
    expect(ps).toHaveLength(2);
    expect(ps[0].archivo).toBe('screens/01-demo-home.png');
    expect(ps[0].url).toBe('/api/media-kit/app-demo/file/screens/01-demo-home.png');
    expect(ps[0].zonaClave).toContain('[DEMO]');
    expect(ps[0].microAnimacion).toContain('[DEMO]');
    expect(ps[0].datosVisibles).toHaveLength(2);
  });
  it('mediaKitToProjectInput estampa todo lo que guarda el proyecto', () => {
    const inp = mediaKitToProjectInput(KIT);
    expect(inp.mediaKitId).toBe('app-demo');
    expect(inp.name).toBe('[DEMO] Kit de prueba');
    expect(inp.cta?.url).toBe('https://example.com/demo');
    expect(inp.momentos).toHaveLength(1);
    expect(inp.pantallasKit).toHaveLength(2);
    expect(inp.brief).toContain('## CTA');
  });
  it('un kit vacío no rompe: degrada con gracia', () => {
    const flaco: MediaKit = { id: 'x' };
    const inp = mediaKitToProjectInput(flaco);
    expect(inp.name).toBe('x');
    expect(inp.brandKit).toBeUndefined();
    expect(inp.pantallasKit).toEqual([]);
    expect(isValidMediaKit(flaco)).toBe(true);
    expect(isValidMediaKit({})).toBe(false);
  });
});

describe('mediaKitParaMolde — lo que viaja al prompt', () => {
  it('lleva solo lo que el molde usa y omite las URLs', () => {
    const inp = mediaKitToProjectInput(KIT);
    const mk = mediaKitParaMolde(inp.pantallasKit, inp.momentos, inp.cta)!;
    expect(mk.pantallas[0]).toEqual({
      nombre: '[DEMO] Home', archivo: 'screens/01-demo-home.png',
      queDemuestra: '[DEMO] lo que se ve en el home de ejemplo',
      microAnimacion: '[DEMO] el buscador se despliega',
      zonaClave: '[DEMO] tercio superior',
    });
    expect(JSON.stringify(mk)).not.toContain('/api/media-kit/');
  });
  it('sin pantallas ni momentos devuelve undefined (los moldes quedan intactos)', () => {
    expect(mediaKitParaMolde([], [], undefined)).toBeUndefined();
    expect(mediaKitParaMolde(undefined)).toBeUndefined();
  });
});

describe('pantallaDeEscena — qué captura le toca a cada escena', () => {
  const ps = mediaKitToPantallas(KIT);
  it('gana el archivoCaptura explícito', () => {
    expect(pantallaDeEscena(ps, { archivoCaptura: 'screens/02-demo-detalle.png' })?.nombre).toBe('[DEMO] Detalle');
  });
  it('sin archivoCaptura matchea por el label de la pantalla, tolerando mayúsculas/acentos', () => {
    expect(pantallaDeEscena(ps, { screen: '[demo] home' })?.archivo).toBe('screens/01-demo-home.png');
    expect(pantallaDeEscena(ps, { screen: 'DEMO Detalle' })?.archivo).toBe('screens/02-demo-detalle.png');
  });
  it('sin match no inventa una captura', () => {
    expect(pantallaDeEscena(ps, { screen: 'pantalla que no existe' })).toBeUndefined();
    expect(pantallaDeEscena([], { screen: '[DEMO] Home' })).toBeUndefined();
  });
});
