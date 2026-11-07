import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { VIRTUAL_PROFILES } from '../src/data/virtualProfiles';
import { INITIAL_CONSULTANTS } from '../src/data/mockData';
import { SITE, MARCA, SEO_PAGINAS } from '../src/seo/yoast';
import { SITE_ORIGIN } from '../src/routing/routes';

// Nomes usados no site-base (Oraculos.ts). Nenhum pode reaparecer no Bruxo São Cipriano Oráculos.
const NOMES_ANTIGOS = [
  'Aura Celeste', 'Guilherme Solis', 'Soraya Lenormand', 'Mestre Valerio', 'Mãe Serena de Oya', 'Iara das Águas',
  'Gabriel Áurea', 'Yanis Místico', 'Kaelen das Runas', 'Livia Estelar', 'Mãe Nadja', 'Samuel Sagrado',
  'Naiara dos Anjos', 'Alexandre Cósmico', 'Mestra Jurema da Terra', 'Mestre Zahir do Oriente', 'Anya Lunar',
  'Guardiã Morgana da Lua', 'Guardião Rowan da Mata', 'Mestre Dante das Sete Chaves', 'Helena da Luz',
  'Mestre Gabriel Astros', 'Clarice Mendonça', 'Sábio Liam Nordic', 'Mística Vânia',
];

const equipe = [
  ...VIRTUAL_PROFILES.map((p) => ({ id: p.id, nome: p.name, avatar: p.avatar })),
  ...INITIAL_CONSULTANTS.filter((c) => !c.isAI).map((c) => ({ id: c.id, nome: c.name, avatar: c.avatar })),
];

describe('V13 — Identidade do Bruxo São Cipriano Oráculos', () => {
  it('a marca e o endereço do site são os do Bruxo', () => {
    expect(MARCA).toBe('Bruxo São Cipriano Oráculos');
    expect(SITE).toBe(SITE_ORIGIN);
    expect(SITE).not.toContain('oraculos-ts');
    expect(SEO_PAGINAS.inicio.palavraChave).toBe('bruxo são cipriano');
  });

  it('ERRO FATAL se houver nome repetido na equipe', () => {
    const nomes = equipe.map((e) => e.nome.trim().toLowerCase());
    const repetidos = nomes.filter((n, i) => nomes.indexOf(n) !== i);
    expect(repetidos, `nomes repetidos: ${repetidos.join(', ')}`).toEqual([]);
  });

  it('ERRO FATAL se houver imagem repetida na equipe', () => {
    const imagens = equipe.map((e) => e.avatar);
    const repetidas = imagens.filter((a, i) => imagens.indexOf(a) !== i);
    expect(repetidas, `imagens repetidas: ${repetidas.join(', ')}`).toEqual([]);
  });

  it('nenhum nome do site-base continua na equipe', () => {
    for (const e of equipe) expect(NOMES_ANTIGOS, e.id).not.toContain(e.nome);
  });

  it('ERRO FATAL se a mesma foto aparecer duas vezes, mesmo com outro nome de arquivo', () => {
    const vistos = new Map<string, string>();
    const repetidas: string[] = [];
    for (const e of equipe) {
      const arquivo = path.resolve(process.cwd(), 'public', e.avatar.replace(/^\//, ''));
      const hash = crypto.createHash('sha256').update(fs.readFileSync(arquivo)).digest('hex');
      if (vistos.has(hash)) repetidas.push(`${vistos.get(hash)} = ${e.id}`);
      else vistos.set(hash, e.id);
    }
    expect(repetidas, `fotos iguais: ${repetidas.join(', ')}`).toEqual([]);
  });

  it('toda imagem da equipe existe no site', () => {
    for (const e of equipe) {
      const arquivo = path.resolve(process.cwd(), 'public', e.avatar.replace(/^\//, ''));
      expect(fs.existsSync(arquivo), `${e.id} ${e.avatar}`).toBe(true);
    }
  });

  it('logo, fundo e imagem de compartilhamento novos estão no site', () => {
    for (const f of [
      'brand/logo-bruxo-sao-cipriano.png',
      'brand/logo-bruxo-sao-cipriano-720.webp',
      'brand/fundo-bruxo-sao-cipriano.webp',
      'brand/fundo-bruxo-sao-cipriano-mobile.webp',
      'brand/og-bruxo-sao-cipriano.jpg',
    ]) {
      expect(fs.existsSync(path.resolve(process.cwd(), 'public', f)), f).toBe(true);
    }
    expect(fs.existsSync(path.resolve(process.cwd(), 'public/brand/logo-oraculos.png'))).toBe(false);
  });

  it('nenhuma página do site cita o nome ou o endereço antigo', () => {
    const pastas = ['src', 'public', 'server'];
    const proibidos = [/ORACULOS\.TS/, /oraculos-ts\.vercel\.app/, /portalvipbrasil\.com\.br/];
    const achados: string[] = [];
    const varrer = (dir: string) => {
      for (const nome of fs.readdirSync(dir)) {
        const p = path.join(dir, nome);
        if (fs.statSync(p).isDirectory()) { varrer(p); continue; }
        if (!/\.(tsx?|js|cjs|html|txt|xml|json|webmanifest|svg|css)$/.test(nome)) continue;
        const texto = fs.readFileSync(p, 'utf8');
        for (const r of proibidos) if (r.test(texto)) achados.push(`${path.relative(process.cwd(), p)} ${r}`);
      }
    };
    for (const pasta of pastas) varrer(path.resolve(process.cwd(), pasta));
    expect(achados).toEqual([]);
  });
});
