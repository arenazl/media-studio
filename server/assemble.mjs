// ENSAMBLADO del reel final (mp4) — port de shorts-nature/mkreels.py (filtros ffmpeg ya
// battle-tested), generalizado para inputs dinámicos (paths que llegan del proyecto/uploads).
// Dos familias:
//   A (presentadora): clip del modelo (corte en su pausa) -> boceto/video en el medio con voz en
//     off + música -> cierre del modelo (sonrisa o frase). Logo overlay abajo-izquierda.
//   B (mockups): boceto + 2 b-roll mechados con transiciones, locutor en el medio.
// Devuelve el Buffer del mp4. La llamada a ffmpeg la hace runFfmpeg (lo pasa index.mjs).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SC = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1';
const AF = 'aformat=sample_rates=44100:channel_layouts=stereo';
const ms = (s) => Math.round(s * 1000);

// ── Familia A: modelo -> boceto -> modelo (con voz en off + música + logo) ──
// plan.presenter = { file, cut, smile:[s,e], phrase:[s,e] } · plan.mid/music/voice/logo = { file }
// plan.closer = 'phrase' | 'smile'. midlen = duración del tramo del medio (s).
export function buildFamilyA(plan) {
  const p = plan.presenter || {};
  const cut = Number(p.cut) || 4.0;
  const usePhrase = plan.closer === 'phrase' && Array.isArray(p.phrase);
  const [cs, ce] = usePhrase ? p.phrase : (p.smile || [cut + 2, cut + 4]);
  const clen = ce - cs;
  const midlen = Number(plan.midlen) || 11.0;
  const off2 = cut + midlen - 0.5;
  const total = cut + midlen + clen - 1.0;
  const inputs = [p.file, plan.mid?.file, plan.music?.file, plan.voice?.file, plan.logo?.file].filter(Boolean);
  if (inputs.length < 4) throw new Error('familia A: faltan inputs (presenter, mid, music, voice requeridos)');
  const hasLogo = !!plan.logo?.file;

  const fc = [
    `[0:v]trim=0:${(cut + 0.5).toFixed(2)},setpts=PTS-STARTPTS,${SC}[v0]`,
    `[1:v]trim=1.5:${(1.5 + midlen).toFixed(2)},setpts=PTS-STARTPTS,${SC}[v1]`,
    `[0:v]trim=${cs}:${ce},setpts=PTS-STARTPTS,${SC}[v2]`,
    `[v0][v1]xfade=transition=fade:duration=0.5:offset=${cut.toFixed(2)}[xa]`,
    `[xa][v2]xfade=transition=fade:duration=0.5:offset=${off2.toFixed(2)}[xb]`,
  ];
  let vlabel = '[xb]';
  if (hasLogo) {
    fc.push('[4:v]scale=86:-1[logo]', '[xb][logo]overlay=46:1784[vx]');
    vlabel = '[vx]';
  }
  fc.push(
    `[0:a]atrim=0:${(cut + 0.2).toFixed(2)},asetpts=PTS-STARTPTS,volume=1.9,afade=t=out:st=${(cut - 0.1).toFixed(2)}:d=0.3,${AF}[ao]`,
    `[3:a]adelay=${ms(cut + 0.3)}:all=1,volume=1.5,afade=t=in:st=${(cut + 0.3).toFixed(2)}:d=0.2,${AF}[aloc]`,
    `[2:a]volume=0.22,afade=t=in:st=0:d=0.4,${AF}[am]`,
  );
  let amix = '[ao][aloc]', n = 2;
  if (usePhrase) {
    fc.push(`[0:a]atrim=${cs}:${ce},asetpts=PTS-STARTPTS,volume=1.7,adelay=${ms(off2 + 0.1)}:all=1,${AF}[acl]`);
    amix += '[acl]'; n += 1;
  }
  amix += '[am]'; n += 1;
  fc.push(`${amix}amix=inputs=${n}:duration=longest:normalize=0[a]`);
  return { inputs, filter: fc.join(';'), vmap: vlabel, amap: '[a]', total };
}

// ── Familia B: boceto + b-roll mechados con transiciones, locutor en el medio ──
// plan.mid = { file } (boceto) · plan.broll = [ {file}, {file} ] · plan.music/voice/logo = { file }
export function buildFamilyB(plan) {
  const broll = plan.broll || [];
  const inputs = [plan.mid?.file, broll[0]?.file, broll[1]?.file, plan.music?.file, plan.voice?.file, plan.logo?.file].filter(Boolean);
  if (inputs.length < 5) throw new Error('familia B: faltan inputs (mid, 2 b-roll, music, voice requeridos)');
  const hasLogo = !!plan.logo?.file;
  const fc = [
    `[0:v]trim=1:6,setpts=PTS-STARTPTS,${SC}[v0]`,
    `[1:v]trim=0:4,setpts=PTS-STARTPTS,${SC}[v1]`,
    `[0:v]trim=6:11,setpts=PTS-STARTPTS,${SC}[v2]`,
    `[2:v]trim=0:4,setpts=PTS-STARTPTS,${SC}[v3]`,
    `[0:v]trim=11:14,setpts=PTS-STARTPTS,${SC}[v4]`,
    '[v0][v1]xfade=transition=fade:duration=0.5:offset=4.5[xa]',
    '[xa][v2]xfade=transition=fade:duration=0.5:offset=8[xb]',
    '[xb][v3]xfade=transition=fade:duration=0.5:offset=12.5[xc]',
    '[xc][v4]xfade=transition=fade:duration=0.5:offset=16[xd]',
  ];
  let vlabel = '[xd]';
  if (hasLogo) {
    fc.push('[5:v]scale=86:-1[logo]', '[xd][logo]overlay=46:1784[vx]');
    vlabel = '[vx]';
  }
  fc.push(
    `[4:a]adelay=3000:all=1,volume=1.5,afade=t=in:st=3:d=0.2,${AF}[aloc]`,
    `[3:a]volume=0.24,afade=t=in:st=0:d=0.4,${AF}[am]`,
    '[aloc][am]amix=inputs=2:duration=longest:normalize=0[a]',
  );
  return { inputs, filter: fc.join(';'), vmap: vlabel, amap: '[a]', total: 18.0 };
}

export function buildAssembly(plan) {
  if (!plan || typeof plan !== 'object') throw new Error('plan inválido');
  if (plan.family === 'A') return buildFamilyA(plan);
  if (plan.family === 'B') return buildFamilyB(plan);
  throw new Error(`familia desconocida: ${plan.family} (usá "A" o "B")`);
}

// arma los args de ffmpeg desde el build, render a un mp4 temporal, devuelve el Buffer.
// runFfmpeg lo inyecta index.mjs (mismo que usa /api/render).
export async function assemble(plan, runFfmpeg) {
  const b = buildAssembly(plan);
  for (const f of b.inputs) if (!fs.existsSync(f)) throw new Error(`input no existe: ${f}`);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mstudio-asm-'));
  const out = path.join(dir, 'out.mp4');
  try {
    const args = ['-y'];
    for (const f of b.inputs) args.push('-i', f);
    args.push('-filter_complex', b.filter, '-map', b.vmap, '-map', b.amap,
      '-t', b.total.toFixed(2), '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out);
    await runFfmpeg(args);
    return fs.readFileSync(out);
  } finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* noop */ } }
}
