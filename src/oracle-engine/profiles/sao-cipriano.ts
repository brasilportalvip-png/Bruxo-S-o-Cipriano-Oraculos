/**
 * ORÁCULO DE SÃO CIPRIANO
 *
 * Cartomancia do "Grande Livro de S. Cypriano ou Thesouro do Feiticeiro"
 * (Livraria Económica, Lisboa, c. 1890-1895). Baralho português/espanhol de 40 cartas.
 *
 * Dois sistemas do livro, nunca misturados:
 *  - "classico":  "Modo de deitar as cartas tal e qual as deitava S. Cipriano"
 *  - "cruzada":   "Cartomancia cruzada: maneira de deitar as cartas, até hoje ignorada e usada por S. Cipriano"
 *
 * Cada significado guarda o texto do livro ("original"), a leitura em português atual
 * ("atual") e o grau de confiabilidade ("status"). As disposições das cartas usadas aqui
 * são adaptações para o site e estão marcadas como tal. Ver docs/oraculo-sao-cipriano.json.
 */

export type NaipeCipriano = 'ouros' | 'copas' | 'espadas' | 'paus';
export type ValorCipriano = 'as' | '2' | '3' | '4' | '5' | '6' | '7' | 'valete' | 'dama' | 'rei';
export type SistemaCipriano = 'classico' | 'cruzada';
export type StatusFonte = 'fonte' | 'fonte_conferir' | 'divergente' | 'adaptacao' | 'pendente';

export type TemaSaoCipriano =
  | 'amor'
  | 'prosperidade'
  | 'trabalho'
  | 'saude'
  | 'familia'
  | 'protecao'
  | 'geral';

export interface SaoCiprianoInput {
  fullName: string;
  birthDate: string;
  question?: string;
  sistema?: SistemaCipriano;
}

export interface SignificadoCipriano {
  original: string;
  atual: string;
  status: StatusFonte;
  nota?: string;
}

export interface CartaCipriano {
  id: string; // ex.: "as_ouros", "dama_espadas"
  naipe: NaipeCipriano;
  valor: ValorCipriano;
  nome: string; // ex.: "Ás de Ouros"
  figura: boolean;
}

export interface PosicaoSaoCipriano {
  numero: number;
  posicao: string;
  titulo: string;
  carta: CartaCipriano;
  significado: SignificadoCipriano;
}

export interface CombinacaoSaoCipriano {
  cartas: string[];
  original: string;
  orientacaoSite: string;
  sensivel: boolean;
}

export interface SaoCiprianoResultado {
  oracle: 'sao-cipriano';
  entrada: { fullName: string; birthDate: string; question: string };
  tema: TemaSaoCipriano;
  sistema: SistemaCipriano;
  metodo: {
    nome: string;
    quantidadeCartas: number;
    descricao: string;
    fonte: string;
    statusDisposicao: StatusFonte;
  };
  leitura: PosicaoSaoCipriano[];
  fraseAoEstiloDoLivro: string;
  combinacoes: CombinacaoSaoCipriano[];
  sintese: {
    figurasPresentes: string[];
    naipeDominante: NaipeCipriano | null;
    contemCombinacaoSensivel: boolean;
  };
  resumoParaOraculo: string;
}

/* ════════════════════════════════════════════════════════════════════
 * BARALHO
 * ════════════════════════════════════════════════════════════════════ */

export const NAIPES_CIPRIANO: NaipeCipriano[] = ['ouros', 'copas', 'espadas', 'paus'];
export const VALORES_CIPRIANO: ValorCipriano[] = ['as', '2', '3', '4', '5', '6', '7', 'valete', 'dama', 'rei'];

const NOME_VALOR: Record<ValorCipriano, string> = {
  as: 'Ás', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7',
  valete: 'Valete', dama: 'Dama', rei: 'Rei',
};
const NOME_NAIPE: Record<NaipeCipriano, string> = {
  ouros: 'Ouros', copas: 'Copas', espadas: 'Espadas', paus: 'Paus',
};

export const BARALHO_SAO_CIPRIANO: CartaCipriano[] = NAIPES_CIPRIANO.flatMap((naipe) =>
  VALORES_CIPRIANO.map((valor) => ({
    id: `${valor}_${naipe}`,
    naipe,
    valor,
    nome: `${NOME_VALOR[valor]} de ${NOME_NAIPE[naipe]}`,
    figura: valor === 'valete' || valor === 'dama' || valor === 'rei',
  })),
);

type TabelaNumerica = Record<NaipeCipriano, Record<'as' | '2' | '3' | '4' | '5' | '6' | '7', SignificadoCipriano>>;
const s = (original: string, atual: string, status: StatusFonte = 'fonte_conferir', nota?: string): SignificadoCipriano =>
  nota ? { original, atual, status, nota } : { original, atual, status };

/* ── Sistema 1: "Modo de deitar as cartas tal e qual as deitava S. Cipriano" ── */

export const SIGNIFICADOS_CLASSICO: TabelaNumerica = {
  ouros: {
    as: s('Uma prenda', 'Um presente', 'fonte'),
    '2': s('Brevemente', 'Em breve', 'fonte'),
    '3': s('Com alegria', 'Com alegria'),
    '4': s('Igreja', 'Igreja (casamento, missa ou cerimônia, conforme a combinação)'),
    '5': s('Novidade', 'Uma novidade'),
    '6': s('Dinheiros pequenos', 'Pouco dinheiro'),
    '7': s('Dinheiros grandes', 'Muito dinheiro'),
  },
  espadas: {
    as: s('Afirma', 'Confirma o que está ao lado'),
    '2': s('Cortando', 'Corte, interrupção'),
    '3': s('Más palavras', 'Palavras ruins, ofensa, fofoca'),
    '4': s('Na cama', 'Na cama (repouso, intimidade ou cansaço, conforme a combinação)'),
    '5': s('Doença', 'Cuidado com a saúde'),
    '6': s('Desvio', 'Desvio, mudança de rumo'),
    '7': s("Paixão d'alma", 'Tristeza profunda, desgosto'),
  },
  copas: {
    as: s('Fandango', 'Festa, baile'),
    '2': s('Uma carta', 'Uma carta, uma mensagem'),
    '3': s('Boas palavras', 'Palavras boas, elogio, boa notícia'),
    '4': s('Pela porta da rua', 'Pela porta da rua: alguém que chega ou sai'),
    '5': s('Lágrimas', 'Choro'),
    '6': s('Por caminhos', 'Por caminhos, viagem'),
    '7': s('Comidas e bebidas', 'Comida e bebida, banquete'),
  },
  paus: {
    as: s('Por noite', 'À noite'),
    '2': s('Caminhos vagarosos', 'Caminho demorado'),
    '3': s('Caminhos breves', 'Caminho rápido'),
    '4': s('Nesta casa', 'Nesta casa'),
    '5': s('Com cinco sentidos', 'Com toda a atenção'),
    '6': s('Zelos', 'Ciúmes'),
    '7': s('Com muito gosto', 'Com muito gosto, com prazer'),
  },
};

const FIGURAS_CLASSICO: Partial<Record<string, SignificadoCipriano>> = {
  dama_espadas: s('Mulher de má língua', 'Mulher fofoqueira ou de má fama'),
  rei_espadas: s('Homem da justiça', 'Homem ligado à justiça (juiz, advogado, autoridade)'),
  valete_espadas: s('Pensamento desse homem', 'O pensamento do Rei de Espadas'),
  dama_ouros: s('Mulher que consulta', 'A consulente (quem pergunta)'),
  rei_ouros: s('Homem de quem se quer saber', 'O homem sobre quem se pergunta'),
  valete_ouros: s('Pensamento desse homem', 'O pensamento do Rei de Ouros'),
};

/* ── Sistema 2: "Cartomancia cruzada" ── */

export const SIGNIFICADOS_CRUZADA: TabelaNumerica = {
  copas: {
    as: s('Constrangimento', 'Pressão, coação (às vezes violência)', 'fonte'),
    '2': s('Reconciliação', 'Reconciliação', 'fonte'),
    '3': s('Simpatia', 'Simpatia, afeto', 'fonte'),
    '4': s('Banquete', 'Banquete, festa', 'fonte'),
    '5': s('Ciúmes', 'Ciúmes', 'fonte'),
    '6': s('Demora', 'Demora, atraso', 'fonte'),
    '7': s('Surpresa', 'Surpresa', 'fonte'),
  },
  espadas: {
    as: s('Paixão', 'Paixão (amor intenso ou sofrimento)'),
    '2': s('Correspondência', 'Cartas, mensagens', 'fonte'),
    '3': s('Localidade', 'Um lugar, mudança de lugar'),
    '4': s('No lar', 'Em casa, na família'),
    '5': s('Enredo', 'Intriga, fofoca, armação', 'fonte'),
    '6': s('Brevidade', 'Rapidez, em breve', 'fonte'),
    '7': s('Desgostos', 'Desgostos, tristezas'),
  },
  ouros: {
    as: s('Promessas', 'Promessas'),
    '2': s('Matrimónio', 'Casamento'),
    '3': s('Mimo de amor', 'Carinho, presente de amor', 'fonte'),
    '4': s('Apartamento', 'Separação, afastamento', 'fonte',
      "No português antigo 'apartamento' quer dizer separação, não imóvel."),
    '5': s('Sedução', 'Sedução'),
    '6': s('Fortuna', 'Sorte, fortuna'),
    '7': s('Riqueza', 'Riqueza'),
  },
  paus: {
    as: s('Vício', 'Vício', 'divergente',
      "Uma transcrição dá 'vício'; a advertência final de outra chama o Ás de Paus de 'cativeiro'."),
    '2': s('Traição', 'Traição'),
    '3': s('Desordem', 'Confusão, briga'),
    '4': s('Leviandade', 'Leviandade, imprudência'),
    '5': s('Fora de casa', 'Fora de casa'),
    '6': s('Cativeiro', 'Prisão, dependência, estar preso a algo'),
    '7': s('Obstáculo', 'Obstáculo'),
  },
};

const FIGURAS_CRUZADA: Record<'valete' | 'dama' | 'rei', SignificadoCipriano> = {
  valete: s('O pensamento de um senhor a quem se queira marcar', 'O pensamento de um homem da consulta'),
  dama: s('Uma senhora a quem se deseja marcar', 'Uma mulher da consulta'),
  rei: s('O corpo de um senhor (sua pessoa) a quem se deseja marcar', 'Um homem da consulta, em pessoa'),
};

export function significadoCarta(sistema: SistemaCipriano, carta: Pick<CartaCipriano, 'naipe' | 'valor'>): SignificadoCipriano {
  const { naipe, valor } = carta;
  if (valor !== 'valete' && valor !== 'dama' && valor !== 'rei') {
    return (sistema === 'classico' ? SIGNIFICADOS_CLASSICO : SIGNIFICADOS_CRUZADA)[naipe][valor];
  }
  if (sistema === 'classico') {
    const especifica = FIGURAS_CLASSICO[`${valor}_${naipe}`];
    if (especifica) return especifica;
    if (valor === 'valete') {
      return s(`Pensamento do Rei de ${NOME_NAIPE[naipe]}`, `O que pensa a pessoa do Rei de ${NOME_NAIPE[naipe]}`);
    }
    return s('Outra pessoa da consulta', valor === 'dama' ? 'Uma mulher envolvida na consulta' : 'Um homem envolvido na consulta');
  }
  const base = FIGURAS_CRUZADA[valor];
  if (naipe === 'ouros' && valor === 'dama') return { ...base, atual: 'Esta mulher (a consulente)' };
  if (naipe === 'ouros' && valor === 'rei') return { ...base, atual: 'Este homem (de quem se quer saber)' };
  return base;
}

/* ── Combinações registradas no livro (sistema clássico) ── */

const COMBINACOES_CLASSICO: CombinacaoSaoCipriano[] = [
  {
    cartas: ['4_ouros', '4_espadas'],
    original: 'Igreja + na cama: morte',
    orientacaoSite: 'Não anunciar morte. Falar apenas em atenção à saúde e em cuidar de quem está fragilizado.',
    sensivel: true,
  },
  {
    cartas: ['4_ouros', '5_espadas'],
    original: 'Igreja + doença: morte',
    orientacaoSite: 'Não anunciar morte. Falar apenas em atenção à saúde e sugerir procurar um médico.',
    sensivel: true,
  },
  {
    cartas: ['2_copas', '4_ouros'],
    original: 'Carta + igreja: casamento',
    orientacaoSite: 'Sinal de compromisso ou união, nunca como certeza.',
    sensivel: false,
  },
];

/* ── Disposições (adaptações do site) ── */

const POSICOES: Record<SistemaCipriano, Array<{ posicao: string; titulo: string }>> = {
  classico: [
    { posicao: 'cabeca', titulo: 'Cabeça da cruz' },
    { posicao: 'braco-esquerdo', titulo: 'Braço esquerdo' },
    { posicao: 'braco-direito', titulo: 'Braço direito' },
    { posicao: 'pe', titulo: 'Pé da cruz' },
  ],
  cruzada: [
    { posicao: 'questao', titulo: 'A questão' },
    { posicao: 'raiz', titulo: 'O que ficou para trás' },
    { posicao: 'causa', titulo: 'O que levou à situação' },
    { posicao: 'momento', titulo: 'O momento atual' },
    { posicao: 'caminho', titulo: 'O caminho a seguir' },
    { posicao: 'atitude', titulo: 'O que fazer' },
    { posicao: 'proximo', titulo: 'O que se aproxima' },
    { posicao: 'distante', titulo: 'O que vem mais adiante' },
    { posicao: 'desfecho', titulo: 'Desfecho ou conselho' },
  ],
};

const METODOS: Record<SistemaCipriano, SaoCiprianoResultado['metodo']> = {
  classico: {
    nome: 'Cruz de São Cipriano',
    quantidadeCartas: 4,
    descricao: 'Quatro cartas em cruz, lidas em sequência como uma frase, ao modo do livro.',
    fonte: "Grande Livro de S. Cypriano — 'Modo de deitar as cartas tal e qual as deitava S. Cipriano'",
    statusDisposicao: 'adaptacao',
  },
  cruzada: {
    nome: 'Cartomancia Cruzada de São Cipriano',
    quantidadeCartas: 9,
    descricao: 'Nove casas em cruz, com os significados da Cartomancia Cruzada lidos em frases encadeadas.',
    fonte: "Grande Livro de S. Cypriano — 'Cartomancia cruzada: maneira de deitar as cartas, até hoje ignorada e usada por S. Cipriano'",
    statusDisposicao: 'adaptacao',
  },
};

/* ════════════════════════════════════════════════════════════════════
 * UTILITÁRIOS
 * ════════════════════════════════════════════════════════════════════ */

function normalizar(texto: string): string {
  return String(texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

function somaTexto(texto: string): number {
  return Array.from(String(texto || '')).reduce((total, c, i) => total + c.charCodeAt(0) * (i + 1), 0);
}

function gerarSemente(input: SaoCiprianoInput): number {
  const nome = normalizar(input.fullName).replace(/[^a-z]/g, '');
  const nascimento = String(input.birthDate || '').replace(/\D/g, '');
  const pergunta = normalizar(input.question || '');
  return (somaTexto(nome) + somaTexto(nascimento) * 3 + somaTexto(pergunta) * 7 + nome.length * 11) >>> 0;
}

/** Gerador pseudoaleatório determinístico (mulberry32). */
function geradorAleatorio(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function embaralhar(semente: number): CartaCipriano[] {
  const cartas = BARALHO_SAO_CIPRIANO.slice();
  const rand = geradorAleatorio(semente);
  for (let i = cartas.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [cartas[i], cartas[j]] = [cartas[j], cartas[i]];
  }
  return cartas;
}

function detectarTema(pergunta: string): TemaSaoCipriano {
  const t = normalizar(pergunta);
  const tem = (termos: string[]) => termos.some((x) => t.includes(x));
  if (tem(['amor', 'relacionamento', 'namor', 'casamento', 'marido', 'esposa', 'ex ', 'voltar', 'volta', 'reconcili', 'paixao', 'ciume', 'traicao', 'amante', 'ele ', 'ela '])) return 'amor';
  if (tem(['dinheiro', 'financ', 'prosperidade', 'divida', 'riqueza', 'negocio', 'venda', 'lucro'])) return 'prosperidade';
  if (tem(['trabalho', 'emprego', 'carreira', 'chefe', 'concurso', 'entrevista', 'empresa'])) return 'trabalho';
  if (tem(['saude', 'doenca', 'cirurgia', 'exame', 'tratamento'])) return 'saude';
  if (tem(['familia', 'mae', 'pai', 'filho', 'filha', 'irma', 'casa'])) return 'familia';
  if (tem(['inveja', 'olho gordo', 'protecao', 'feitico', 'trabalho feito', 'macumba', 'inimigo'])) return 'protecao';
  return 'geral';
}

function escolherSistema(input: SaoCiprianoInput, tema: TemaSaoCipriano): SistemaCipriano {
  if (input.sistema === 'classico' || input.sistema === 'cruzada') return input.sistema;
  const t = normalizar(input.question || '');
  if (t.includes('cruzada')) return 'cruzada';
  if (t.includes('cruz de sao cipriano') || t.includes('classic')) return 'classico';
  // A Cartomancia Cruzada fala de pessoas, ciúmes, intrigas e reconciliações:
  // é o sistema do livro mais adequado a perguntas de amor e de relações.
  return tema === 'amor' || tema === 'familia' || tema === 'protecao' ? 'cruzada' : 'classico';
}

/* ════════════════════════════════════════════════════════════════════
 * CONSTRUTOR DA LEITURA
 * ════════════════════════════════════════════════════════════════════ */

export function buildSaoCiprianoSupremo(input: SaoCiprianoInput): SaoCiprianoResultado {
  const entrada = {
    fullName: String(input.fullName || '').trim(),
    birthDate: String(input.birthDate || '').trim(),
    question: String(input.question || '').trim(),
  };

  const tema = detectarTema(entrada.question);
  const sistema = escolherSistema({ ...input, ...entrada }, tema);
  const metodo = METODOS[sistema];
  const baralho = embaralhar(gerarSemente({ ...entrada, sistema }));

  const leitura: PosicaoSaoCipriano[] = POSICOES[sistema].map((p, i) => ({
    numero: i + 1,
    posicao: p.posicao,
    titulo: p.titulo,
    carta: baralho[i],
    significado: significadoCarta(sistema, baralho[i]),
  }));

  const ids = new Set(leitura.map((l) => l.carta.id));
  const combinacoes = sistema === 'classico'
    ? COMBINACOES_CLASSICO.filter((c) => c.cartas.every((id) => ids.has(id)))
    : [];

  const fraseAoEstiloDoLivro = leitura.map((l) => l.significado.original.toLowerCase()).join(' · ');

  const contagem: Record<NaipeCipriano, number> = { ouros: 0, copas: 0, espadas: 0, paus: 0 };
  leitura.forEach((l) => { contagem[l.carta.naipe]++; });
  const maior = Math.max(...Object.values(contagem));
  const dominantes = NAIPES_CIPRIANO.filter((n) => contagem[n] === maior);
  const naipeDominante = maior >= 2 && dominantes.length === 1 ? dominantes[0] : null;
  const figurasPresentes = leitura.filter((l) => l.carta.figura).map((l) => `${l.carta.nome} (${l.significado.atual})`);
  const contemCombinacaoSensivel = combinacoes.some((c) => c.sensivel);

  const linhasCartas = leitura.map((l) =>
    `${l.numero}. ${l.titulo}: ${l.carta.nome} — livro: "${l.significado.original}" · hoje: ${l.significado.atual}`,
  ).join('\n');

  const linhasCombinacoes = combinacoes.length
    ? combinacoes.map((c) => `• ${c.original} → ${c.orientacaoSite}`).join('\n')
    : 'Nenhuma combinação do livro apareceu nesta mesa.';

  const resumoParaOraculo = `
ORÁCULO DE SÃO CIPRIANO

Método:
${metodo.nome} (${metodo.quantidadeCartas} cartas do baralho de 40)

Fonte:
${metodo.fonte}

Tema detectado:
${tema}

Mesa:
${linhasCartas}

Frase ao estilo do livro:
${fraseAoEstiloDoLivro}

Combinações do livro:
${linhasCombinacoes}

Figuras na mesa:
${figurasPresentes.length ? figurasPresentes.join('; ') : 'nenhuma figura'}

Naipe dominante:
${naipeDominante ? NOME_NAIPE[naipeDominante] : 'sem predominância'}

═══════════════════════
INSTRUÇÕES PARA O CONSULTOR
═══════════════════════

Interprete conforme a identidade, a personalidade, a linguagem e o tom do consultor
selecionado, com a atmosfera da tradição ibérica de São Cipriano, o feiticeiro que se
converteu.

Use SOMENTE os significados acima. Não use significados de Tarot, de Baralho Cigano
ou de outros baralhos. Pode citar entre aspas o dizer antigo de uma carta quando isso
enriquecer a resposta (por exemplo: o Ás de Ouros diz "uma prenda").

Faça como o livro: junte os significados na ordem em que as cartas caíram e forme
frases. Exemplo do próprio livro: Dama de Ouros, 4 de Ouros, 5 de Copas, 5 de Espadas,
6 de Espadas, 2 de Copas, Rei de Ouros, 7 de Copas = "esta mulher se separou por
ciúmes provocados por intriga, mas em breve se reconciliará com este homem e lhe
trará uma surpresa".

Não diga que selecionou, sorteou ou calculou cartas. Não descreva a leitura como
sistema, algoritmo ou relatório técnico.

Comece pela resposta direta à pergunta do consulente — o que a mesa de São Cipriano
diz. Depois costure: o que sustenta essa resposta, as pessoas que aparecem (figuras),
os bloqueios, as possibilidades e uma orientação prática final.

Segurança, obrigatória:
• Nunca anuncie morte, doença grave, gravidez, prisão ou desfecho jurídico como certos.
• Se aparecer combinação sensível do livro, fale apenas em atenção à saúde e em cuidado,
  e sugira procurar um médico quando fizer sentido.
• Não prometa amarração, retorno amoroso, casamento, riqueza ou cura.
• Não afirme pensamentos ou ações de outra pessoa como fatos comprovados.
• Não ensine feitiços para prejudicar, dominar ou amarrar alguém.
• Preserve o livre-arbítrio.

A resposta deve ser profunda, natural, humana, coerente e personalizada.
`.trim();

  return {
    oracle: 'sao-cipriano',
    entrada,
    tema,
    sistema,
    metodo,
    leitura,
    fraseAoEstiloDoLivro,
    combinacoes,
    sintese: { figurasPresentes, naipeDominante, contemCombinacaoSensivel },
    resumoParaOraculo,
  };
}

export default buildSaoCiprianoSupremo;
