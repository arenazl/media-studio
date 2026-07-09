// Consumidor del Knowledge Share Protocol (KSP). Media Studio es el 2º consumidor:
// lee el KB de una app (GET /api/knowledge-base, vía nuestro backend por el X-KB-Key) y
// lo convierte en lo que ya consume el pipeline: un brief + la marca + las pantallas.
// Contrato completo: D:\Code\base-compartida\3-PROTOCOLO-COMPLETO.md (v1.1).
import type { BrandKit } from './brandKit';

// Pantalla como METADATA (contrato 1.2): la app la DESCRIBE (no manda HTML ni URL). Media Studio
// la recrea como motion graphics. La `route` es informativa; `url` puede venir (legacy 1.1) pero no se usa.
export interface KBScreen {
  label: string;
  kind?: string;            // list | dashboard | form | wizard | timeline | detail | map | feed
  headline?: string;
  framework?: string;       // stack de UI (ej. "Tailwind CSS") — pista de cómo dibujarla
  nav?: string[];           // labels REALES de la pantalla (header/tabs/botones)
  components?: string[];    // qué controles/componentes tiene
  layout?: string;          // cómo está distribuida
  style?: string;           // notas de estilo (además de brand)
  data?: unknown;           // datos demo (forma libre según kind)
  flow?: string;            // qué hace el usuario ahí
  route?: string;
  url?: string;             // legacy 1.1 (ya no se usa)
}
export interface KBBrand {
  logo?: { primary?: string; light?: string; dark?: string; isotype?: string; svg?: string };
  colors?: { primary?: string; accent?: string; secondary?: string; ink?: string; surface?: string };
  fonts?: { display?: string; text?: string };
  style?: { radius?: string; density?: string; vibe?: string };
  icons?: string | string[];
  phonetic?: string;
  tone?: string;
  avoid?: string[];
}
export interface KBOffering { id?: string; name: string; description: string; key_features?: string[]; status?: string }
export interface KnowledgeBase {
  contract_version: string;
  last_updated?: string;
  business: { name: string; tagline?: string; description: string; value_story?: string; industry?: string; target_audience?: string; website?: string };
  key_messages?: string[];          // 1.2: mensajes centrales que van en CADA reel (enfoque global)
  offerings: KBOffering[];
  pricing?: { model?: string; summary?: string; promotions?: string[] };
  differentiators?: string[];
  objections?: { objection: string; response: string }[];
  faq?: { question: string; answer: string }[];
  do_not_say?: string[];
  screens?: KBScreen[];
  brand?: KBBrand;
  // capabilities/entities/tools (1.2) son de SalesBot — Media Studio los ignora.
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
  if (b.value_story) { L.push(''); L.push('### La propuesta completa (el hilo — cada reel cuenta ESTO, no un módulo)'); L.push(b.value_story); }
  if (b.industry) L.push(`- Rubro: ${b.industry}`);
  if (b.target_audience) L.push(`- Público: ${b.target_audience}`);
  if (kb.key_messages?.length) {
    L.push('');
    L.push('## Mensajes clave (van en CADA reel)');
    for (const m of kb.key_messages) L.push(`- ${m}`);
  }
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
