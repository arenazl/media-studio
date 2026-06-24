// Consumidor del Knowledge Share Protocol (KSP). Media Studio es el 2º consumidor:
// lee el KB de una app (GET /api/knowledge-base, vía nuestro backend por el X-KB-Key) y
// lo convierte en lo que ya consume el pipeline: un brief + la marca + las pantallas.
// Contrato completo: D:\Code\base-compartida\KNOWLEDGE_SHARE_PROTOCOL.md (v1.1).
import type { BrandKit } from './brandKit';

export interface KBScreen { label: string; url: string; route?: string }
export interface KBBrand {
  logo?: { primary?: string; light?: string; dark?: string; isotype?: string };
  colors?: { primary?: string; accent?: string; secondary?: string; ink?: string; surface?: string };
  fonts?: { display?: string; text?: string };
  icons?: string | string[];
  phonetic?: string;
  tone?: string;
  avoid?: string[];
}
export interface KBOffering { id?: string; name: string; description: string; key_features?: string[]; status?: string }
export interface KnowledgeBase {
  contract_version: string;
  last_updated?: string;
  business: { name: string; tagline?: string; description: string; industry?: string; target_audience?: string; website?: string };
  offerings: KBOffering[];
  pricing?: { model?: string; summary?: string; promotions?: string[] };
  differentiators?: string[];
  objections?: { objection: string; response: string }[];
  faq?: { question: string; answer: string }[];
  do_not_say?: string[];
  screens?: KBScreen[];
  brand?: KBBrand;
}

// El KB → el brief markdown (los "hechos") que consume social-marketing-strategist / promo-kit.
// Solo material de la capa NEGOCIO; lo visual va por brandKit + screens.
export function kbToBrief(kb: KnowledgeBase): string {
  const b = kb.business;
  const L: string[] = [];
  L.push(`# ${b.name} — brief (desde el KB de la app)`);
  if (b.tagline) L.push(`> ${b.tagline}`);
  L.push('');
  L.push('## El negocio');
  L.push(b.description);
  if (b.industry) L.push(`- Rubro: ${b.industry}`);
  if (b.target_audience) L.push(`- Público: ${b.target_audience}`);
  L.push('');
  L.push('## Qué ofrece');
  for (const o of kb.offerings || []) {
    L.push(`- **${o.name}**: ${o.description}`);
    for (const f of o.key_features || []) L.push(`  - ${f}`);
  }
  if (kb.differentiators?.length) {
    L.push('');
    L.push('## Por qué (diferenciadores)');
    for (const d of kb.differentiators) L.push(`- ${d}`);
  }
  if (kb.objections?.length) {
    L.push('');
    L.push('## Dolores y objeciones (en palabras del cliente)');
    for (const o of kb.objections) L.push(`- "${o.objection}" → ${o.response}`);
  }
  const offer = kb.pricing?.promotions?.length ? kb.pricing.promotions : [];
  if (offer.length || kb.pricing?.summary) {
    L.push('');
    L.push('## Oferta / CTA');
    if (kb.pricing?.summary) L.push(`- ${kb.pricing.summary}`);
    for (const p of offer) L.push(`- ${p}`);
  }
  if (kb.do_not_say?.length) {
    L.push('');
    L.push('## A evitar (do_not_say)');
    for (const d of kb.do_not_say) L.push(`- ${d}`);
  }
  return L.join('\n');
}

// El bloque brand del KB → el BrandKit del proyecto (overlay de logo + fonética para Veo/TTS).
export function kbToBrandKit(kb: KnowledgeBase): BrandKit | undefined {
  const br = kb.brand;
  if (!br) return undefined;
  return {
    name: kb.business.name,
    color: br.colors?.accent || br.colors?.primary,
    logoUrl: br.logo?.primary || br.logo?.isotype,
    phonetic: br.phonetic,
    logoPos: 'tr',
  };
}

// El KB completo → el "input" para crear el proyecto. Las screens quedan aparte: se
// renderizan (headless) en un paso siguiente para producir los mockups.
export interface KBProjectInput {
  name: string;
  type: string;
  brief: string;
  brandKit?: BrandKit;
  screens: KBScreen[];
}
export function kbToProjectInput(kb: KnowledgeBase): KBProjectInput {
  return {
    name: kb.business?.name || 'Proyecto',
    type: kb.business?.industry || '',
    brief: kbToBrief(kb),
    brandKit: kbToBrandKit(kb),
    screens: kb.screens || [],
  };
}

// Validación mínima de un KB recibido (forward-compatible: ignora lo que no conoce).
export function isValidKB(x: unknown): x is KnowledgeBase {
  const k = x as KnowledgeBase;
  return !!k && typeof k === 'object' && !!k.business?.name && Array.isArray(k.offerings);
}
