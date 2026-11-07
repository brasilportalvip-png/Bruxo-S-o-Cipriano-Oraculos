import { describe, it, expect } from 'vitest';
import {
  buildSaoCiprianoSupremo,
  BARALHO_SAO_CIPRIANO,
  significadoCarta,
  embaralhar,
} from '../src/oracle-engine/profiles/sao-cipriano';
import { executarOracleProfile, normalizarOracleProfileId, validarEntradaOraculo } from '../src/oracle-engine/profiles/index';
import { ORACLE_CATEGORIES } from '../src/data/oracleConfig';
import { ORACLE_DESCRIPTIONS } from '../src/data/oracleDescriptions';
import { ORACLE_DRAW_DATA } from '../src/data/oracleDrawData';
import { VIRTUAL_PROFILES } from '../src/data/virtualProfiles';
import { VOZES_ATENDENTES } from '../src/data/attendantVoices';
import { seoOraculo } from '../src/seo/yoast';
import { canonicalOracleSlug, oracleTypeFromSlug } from '../src/routing/routes';
import { verifyConsultantOracleAuthorization } from '../server';

const BASE = { fullName: 'Marta Ribeiro da Silva', birthDate: '1987-03-14' };

describe('V12 — Oráculo de São Cipriano: o baralho', () => {
  it('tem exatamente 40 cartas únicas (Ás a 7, Valete, Dama e Rei de cada naipe)', () => {
    expect(BARALHO_SAO_CIPRIANO).toHaveLength(40);
    expect(new Set(BARALHO_SAO_CIPRIANO.map((c) => c.id)).size).toBe(40);
    expect(BARALHO_SAO_CIPRIANO.filter((c) => c.figura)).toHaveLength(12);
  });

  it('toda carta tem significado do livro e em português atual nos dois sistemas', () => {
    for (const sistema of ['classico', 'cruzada'] as const) {
      for (const carta of BARALHO_SAO_CIPRIANO) {
        const sig = significadoCarta(sistema, carta);
        expect(sig.original.length, `${sistema} ${carta.id}`).toBeGreaterThan(2);
        expect(sig.atual.length, `${sistema} ${carta.id}`).toBeGreaterThan(2);
      }
    }
  });

  it('preserva os dizeres do livro', () => {
    expect(significadoCarta('classico', { naipe: 'ouros', valor: 'as' }).original).toBe('Uma prenda');
    expect(significadoCarta('classico', { naipe: 'ouros', valor: '2' }).original).toBe('Brevemente');
    expect(significadoCarta('cruzada', { naipe: 'copas', valor: '2' }).original).toBe('Reconciliação');
    expect(significadoCarta('cruzada', { naipe: 'espadas', valor: '5' }).original).toBe('Enredo');
    // "apartamento" no português antigo é separação
    expect(significadoCarta('cruzada', { naipe: 'ouros', valor: '4' }).atual.toLowerCase()).toContain('separação');
  });

  it('o embaralhamento é uma permutação completa e muda com a semente', () => {
    const a = embaralhar(123);
    const b = embaralhar(456);
    expect(new Set(a.map((c) => c.id)).size).toBe(40);
    expect(a.map((c) => c.id).join()).not.toBe(b.map((c) => c.id).join());
  });
});

describe('V12 — Oráculo de São Cipriano: a leitura', () => {
  it('pergunta de amor usa a Cartomancia Cruzada com 9 cartas diferentes', () => {
    const r = buildSaoCiprianoSupremo({ ...BASE, question: 'Ele vai voltar para mim?' });
    expect(r.tema).toBe('amor');
    expect(r.sistema).toBe('cruzada');
    expect(r.leitura).toHaveLength(9);
    expect(new Set(r.leitura.map((l) => l.carta.id)).size).toBe(9);
  });

  it('pergunta de trabalho usa a Cruz de São Cipriano com 4 cartas', () => {
    const r = buildSaoCiprianoSupremo({ ...BASE, question: 'Vou conseguir o emprego?' });
    expect(r.sistema).toBe('classico');
    expect(r.leitura).toHaveLength(4);
    expect(r.metodo.statusDisposicao).toBe('adaptacao');
  });

  it('a mesma consulta abre a mesma mesa; outra chave abre outra mesa', () => {
    const q = 'Como fica minha vida financeira?';
    const a = buildSaoCiprianoSupremo({ ...BASE, question: `${q} 202611071300` });
    const b = buildSaoCiprianoSupremo({ ...BASE, question: `${q} 202611071300` });
    const c = buildSaoCiprianoSupremo({ ...BASE, question: `${q} 202611071301` });
    expect(a.leitura.map((l) => l.carta.id)).toEqual(b.leitura.map((l) => l.carta.id));
    expect(a.leitura.map((l) => l.carta.id).join()).not.toBe(c.leitura.map((l) => l.carta.id).join());
  });

  it('o resumo para a IA traz a mesa, a frase do livro e as regras de segurança', () => {
    const r = buildSaoCiprianoSupremo({ ...BASE, question: 'O que as cartas dizem sobre minha família?' });
    expect(r.resumoParaOraculo).toContain('ORÁCULO DE SÃO CIPRIANO');
    expect(r.resumoParaOraculo).toContain('Frase ao estilo do livro');
    expect(r.resumoParaOraculo).toContain('Nunca anuncie morte');
    expect(r.resumoParaOraculo).toContain('Não ensine feitiços');
    expect(r.resumoParaOraculo).not.toMatch(/tarot de marselha|lenormand/i);
  });

  it('combinação de "morte" do livro é marcada como sensível e nunca vira anúncio', () => {
    let achou = false;
    for (let i = 0; i < 5000 && !achou; i++) {
      const r = buildSaoCiprianoSupremo({ ...BASE, question: `trabalho ${i}` });
      const sensivel = r.combinacoes.find((c) => c.sensivel);
      if (sensivel) {
        achou = true;
        expect(r.sintese.contemCombinacaoSensivel).toBe(true);
        expect(sensivel.orientacaoSite).toMatch(/Não anunciar morte/);
      }
    }
    expect(achou).toBe(true);
  });

  it('funciona pelo motor geral do site, com alias e validação', () => {
    expect(normalizarOracleProfileId('São Cipriano')).toBe('sao-cipriano');
    expect(normalizarOracleProfileId('cipriano')).toBe('sao-cipriano');
    const res: any = executarOracleProfile('saocipriano', { ...BASE, question: 'Tem inveja no meu caminho?', drawKey: '2026' });
    expect(res.oracle).toBe('sao-cipriano');
    expect(res.resumoParaOraculo.length).toBeGreaterThan(300);
    expect(validarEntradaOraculo('sao-cipriano', { ...BASE, question: 'x' }).valid).toBe(true);
  });
});

describe('V12 — Oráculo de São Cipriano no site', () => {
  it('aparece no diretório, nas descrições, no sorteio e nas rotas', () => {
    expect(ORACLE_CATEGORIES.saocipriano.name).toBe('Oráculo de São Cipriano');
    expect(Object.keys(ORACLE_CATEGORIES)[0]).toBe('saocipriano');
    expect(ORACLE_DESCRIPTIONS['sao-cipriano'].canonical).toBe('/oraculos/sao-cipriano');
    expect(ORACLE_DRAW_DATA['sao-cipriano'].length).toBeGreaterThanOrEqual(3);
    expect(canonicalOracleSlug('saocipriano')).toBe('sao-cipriano');
    expect(oracleTypeFromSlug('sao-cipriano')).toBe('saocipriano');
  });

  it('SEO dentro das regras do site', () => {
    const o = seoOraculo('sao-cipriano')!;
    expect(o.titulo.length).toBeLessThanOrEqual(60);
    expect(o.descricao.length).toBeGreaterThanOrEqual(120);
    expect(o.descricao.length).toBeLessThanOrEqual(156);
    expect(o.descricao.toLowerCase()).toContain(o.palavraChave);
  });

  it('o Bruxo Cipriano atende o oráculo, tem voz própria e não atende outros oráculos', () => {
    const bruxo = VIRTUAL_PROFILES.find((p) => p.id === 'ai_c21')!;
    expect(bruxo.avatar).toBe('/consultants/bruxo-cipriano.webp');
    expect(VOZES_ATENDENTES.ai_c21).toBeDefined();
    expect(verifyConsultantOracleAuthorization('ai_c21', 'sao-cipriano').authorized).toBe(true);
    expect(verifyConsultantOracleAuthorization('ai_c21', 'tarot').authorized).toBe(false);
  });
});
