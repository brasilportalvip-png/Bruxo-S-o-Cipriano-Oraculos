import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');

/** Só o texto entre aspas (o que o cliente pode ver), sem comentários nem logs internos. */
const textosVisiveis = (codigo: string) =>
  (codigo.match(/(['`])(?:(?!\1)[^\\\n]|\\.)*\1/g) || [])
    .filter((texto) => !/console\.|details:|primaryModel|fallbackModel/.test(texto));

const PROIBIDO = /\b(IA|IAs)\b|intelig[eê]ncia artificial|atendentes? virtua(l|is)|ferramentas virtuais|simb[oó]lic|Gemini\b(?! API)|Copiloto/;

describe('O cliente nunca vê "IA", "virtual" ou "simbólico"', () => {
  it('mensagens que o servidor manda ao cliente', () => {
    const server = read('server.ts');
    const mensagens = [...server.matchAll(/message:\s*\n?\s*(['`][^\n]*['`])/g), ...server.matchAll(/reply = (['`][^\n]*['`])/g)].map((m) => m[1]);
    const vazadas = mensagens.filter((m) => PROIBIDO.test(m));
    expect(vazadas).toEqual([]);
  });

  it('termos, sala de consulta e textos do site', () => {
    for (const arquivo of ['src/data/legalDocs.ts', 'src/components/ConsultationRoom.tsx']) {
      const vazados = textosVisiveis(read(arquivo)).filter((texto) => PROIBIDO.test(texto));
      expect(vazados).toEqual([]);
    }
  });
});

describe('Nome Bruxo São Cipriano Oráculos em letra legível', () => {
  it('a letra gótica difícil de ler saiu; entra Cinzel Decorative', () => {
    expect(read('index.html')).not.toContain('UnifrakturMaguntia');
    expect(read('index.html')).toContain('Cinzel+Decorative');
    const css = read('src/index.css');
    expect(css).not.toContain('UnifrakturMaguntia');
    expect(css).toContain("'Cinzel Decorative'");
  });
});
