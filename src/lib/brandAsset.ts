// Descarga de assets de marca (logo) DENTRO de la app — sin ir a buscar el archivo a una carpeta.
// Dos caminos:
//   · dataURL  → el <a download> lo baja directo (sin red).
//   · URL externa → proxy del server (GET /api/brand-asset?url=…): descarga la URL y la sirve como
//     attachment, así el download NO falla por CORS (caso Munify: host sin CORS — hallazgo del rework).
//
// SEGURIDAD: el proxy descarga una URL ARBITRARIA → superficie de SSRF. `isAllowedBrandUrl` es la
// garantía PURA (esquema http/https + bloqueo de hosts internos/loopback/IP privadas). El server la
// ESPEJA en server/index.mjs (no puede importar TS) y además re-chequea la IP resuelta por DNS
// (defensa en profundidad). Mismo patrón de "garantía duplicada con referencia cruzada" que
// comercial.escenasAPrompts ↔ functions.mjs. Si tocás las reglas acá, tocá también el server.

export interface BrandUrlCheck { ok: boolean; reason?: string }

export function isDataUrl(u: string): boolean {
  return /^data:/i.test((u || '').trim());
}

// El href de descarga del logo: dataURL directo, o el proxy del server para URLs externas.
export function brandLogoDownloadHref(logoUrl: string, apiBase: string): string {
  const u = (logoUrl || '').trim();
  if (!u) return '';
  if (isDataUrl(u)) return u;
  return `${apiBase}/api/brand-asset?url=${encodeURIComponent(u)}`;
}

const INTERNAL_SUFFIX = ['.localhost', '.local', '.internal', '.lan', '.home', '.corp'];

// ¿La IP v4 (dotted-quad) cae en un rango privado/loopback/reservado? null si no es una IPv4.
function ipv4Blocked(host: string): boolean | null {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const o = m.slice(1).map(Number);
  if (o.some((n) => n > 255)) return true;                 // malformada → bloquear
  const [a, b] = o;
  if (a === 0 || a === 10 || a === 127) return true;       // "this", 10/8, loopback 127/8
  if (a === 169 && b === 254) return true;                 // link-local 169.254/16 (incluye 169.254.169.254 = metadata cloud)
  if (a === 172 && b >= 16 && b <= 31) return true;        // 172.16/12
  if (a === 192 && b === 168) return true;                 // 192.168/16
  if (a === 100 && b >= 64 && b <= 127) return true;       // CGNAT 100.64/10
  if (a >= 224) return true;                               // multicast/reservado + 255.255.255.255
  return false;
}

// ¿El literal IPv6 es loopback / ULA (fc00::/7) / link-local (fe80::/10) / no-especificado?
function ipv6Blocked(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, '').toLowerCase();
  if (!h.includes(':')) return false;
  if (h === '::1' || h === '::') return true;              // loopback / unspecified
  const head = h.split(':')[0];
  if (head.startsWith('fc') || head.startsWith('fd')) return true;   // ULA fc00::/7
  if (/^fe[89ab]/.test(head)) return true;                // link-local fe80::/10
  const mapped = h.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);   // ::ffff:127.0.0.1
  if (mapped && ipv4Blocked(mapped[1])) return true;
  return true;   // cualquier otro literal IPv6 en un proxy de logo: bloquear por precaución (los logos son FQDN/IPv4 públicas)
}

// Garantía anti-SSRF: sólo http/https a hosts PÚBLICOS. Bloquea loopback, IP privadas, link-local,
// hosts internos (localhost/*.local/*.internal) y hostnames numéricos (IP ofuscada como entero/hex).
export function isAllowedBrandUrl(raw: string): BrandUrlCheck {
  let u: URL;
  try { u = new URL((raw || '').trim()); } catch { return { ok: false, reason: 'URL inválida' }; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return { ok: false, reason: `esquema no permitido: ${u.protocol}` };
  const host = u.hostname.toLowerCase();
  if (!host) return { ok: false, reason: 'sin host' };
  if (host === 'localhost' || INTERNAL_SUFFIX.some((s) => host.endsWith(s))) return { ok: false, reason: 'host interno' };
  if (/^\d+$/.test(host) || /^0x[0-9a-f]+$/i.test(host)) return { ok: false, reason: 'host numérico (posible IP ofuscada)' };
  const v4 = ipv4Blocked(host);
  if (v4 === true) return { ok: false, reason: 'IP privada/loopback' };
  if (host.includes(':') && ipv6Blocked(host)) return { ok: false, reason: 'IPv6 interna/no permitida' };
  return { ok: true };
}
