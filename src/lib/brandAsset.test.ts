import { describe, it, expect } from 'vitest';
import { isDataUrl, brandLogoDownloadHref, isAllowedBrandUrl } from './brandAsset';

describe('isDataUrl', () => {
  it('reconoce dataURLs', () => {
    expect(isDataUrl('data:image/png;base64,AAAA')).toBe(true);
    expect(isDataUrl('DATA:image/svg+xml,<svg/>')).toBe(true);
  });
  it('URLs http no son dataURL', () => {
    expect(isDataUrl('https://x.com/logo.svg')).toBe(false);
    expect(isDataUrl('')).toBe(false);
  });
});

describe('brandLogoDownloadHref', () => {
  it('dataURL → se baja directo (sin proxy)', () => {
    const d = 'data:image/png;base64,AAAA';
    expect(brandLogoDownloadHref(d, '')).toBe(d);
  });
  it('URL externa → pasa por el proxy del server, encodeada', () => {
    const href = brandLogoDownloadHref('https://look-guides.netlify.app/apps/munify/logo.svg', '');
    expect(href).toBe('/api/brand-asset?url=https%3A%2F%2Flook-guides.netlify.app%2Fapps%2Fmunify%2Flogo.svg');
  });
  it('respeta el apiBase (override en prod)', () => {
    expect(brandLogoDownloadHref('https://x.com/l.png', 'https://api.example.com'))
      .toBe('https://api.example.com/api/brand-asset?url=https%3A%2F%2Fx.com%2Fl.png');
  });
  it('vacío → vacío', () => {
    expect(brandLogoDownloadHref('', '')).toBe('');
  });
});

describe('isAllowedBrandUrl — permite hosts públicos http/https', () => {
  it('acepta el logo externo real de Munify', () => {
    expect(isAllowedBrandUrl('https://look-guides.netlify.app/apps/munify/logo.svg').ok).toBe(true);
  });
  it('acepta http y https públicos', () => {
    expect(isAllowedBrandUrl('http://cdn.example.com/logo.png').ok).toBe(true);
    expect(isAllowedBrandUrl('https://res.cloudinary.com/x/logo.svg').ok).toBe(true);
  });
});

describe('isAllowedBrandUrl — rechaza SSRF', () => {
  const rechaza = (url: string) => {
    const r = isAllowedBrandUrl(url);
    expect(r.ok, `debería rechazar ${url}`).toBe(false);
    expect(r.reason).toBeTruthy();
  };

  it('esquemas no http(s)', () => {
    rechaza('file:///etc/passwd');
    rechaza('ftp://host/x');
    rechaza('gopher://host/x');
    rechaza('data:text/html,<script>');
  });

  it('loopback y localhost', () => {
    rechaza('http://localhost/x');
    rechaza('http://localhost:5301/api/health');
    rechaza('http://127.0.0.1/x');
    rechaza('http://127.9.9.9/x');
    rechaza('http://[::1]/x');
    rechaza('http://algo.localhost/x');
  });

  it('IP privadas y link-local (incl. metadata cloud 169.254.169.254)', () => {
    rechaza('http://10.0.0.5/x');
    rechaza('http://192.168.1.1/x');
    rechaza('http://172.16.0.1/x');
    rechaza('http://172.31.255.255/x');
    rechaza('http://169.254.169.254/latest/meta-data/');
    rechaza('http://100.64.0.1/x');
    rechaza('http://0.0.0.0/x');
  });

  it('hosts internos por sufijo', () => {
    rechaza('http://db.internal/x');
    rechaza('http://printer.local/x');
    rechaza('http://svc.corp/x');
  });

  it('IP ofuscada como entero/hex', () => {
    rechaza('http://2130706433/x');     // = 127.0.0.1
    rechaza('http://0x7f000001/x');
  });

  it('IPv6 ULA y link-local', () => {
    rechaza('http://[fc00::1]/x');
    rechaza('http://[fe80::1]/x');
  });

  it('basura no rompe', () => {
    rechaza('not a url');
    rechaza('');
  });

  it('172.15 y 172.32 son públicas (el rango privado es 172.16–172.31)', () => {
    expect(isAllowedBrandUrl('http://172.15.0.1/x').ok).toBe(true);
    expect(isAllowedBrandUrl('http://172.32.0.1/x').ok).toBe(true);
  });
});
