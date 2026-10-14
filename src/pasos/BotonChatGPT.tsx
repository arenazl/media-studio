// El botoncito "ChatGPT" de cada pantalla (Lucas, 2026-10-13: "un botoncito chiquito por función, para que ChatGPT
// analice esa pantalla, y después uno completo al final"). Arma el pedido (lib/paraChatGPT), lo copia al portapapeles y
// lo descarga como .md para subirlo. No llama a ningún modelo.
import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'pieza';

export default function BotonChatGPT({ armar, nombre, completo = false }: { armar: () => string; nombre: string; completo?: boolean }) {
  const [listo, setListo] = useState(false);
  const enviar = async () => {
    const texto = armar();
    try { await navigator.clipboard.writeText(texto); } catch { /* sin portapapeles: queda la descarga */ }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([texto], { type: 'text/markdown;charset=utf-8' }));
    a.download = `${slug(nombre)}-para-chatgpt.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    setListo(true);
    setTimeout(() => setListo(false), 3000);
  };
  return (
    <button type="button" className="paso-corrida" onClick={() => void enviar()}
      title={completo ? 'La pieza completa (todos los pasos) para que ChatGPT la analice: se copia y se descarga' : 'Lo de esta pantalla para que ChatGPT lo analice: se copia y se descarga'}>
      {listo ? <Check size={11} /> : <Sparkles size={11} />} {listo ? 'Copiado' : completo ? 'Pieza completa a ChatGPT' : 'ChatGPT'}
    </button>
  );
}
