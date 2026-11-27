import dados from '../../data/bairrosFaltas.json';

/**
 * O que o mapa de faltas e o mini mapa da Home compartilham.
 * Fonte: base pública "Medical Appointment No Shows" (Kaggle, consultas de Vitória-ES, 2016).
 */
export interface Bairro {
  nome: string;
  consultas: number;
  faltas: number;
  lat: number | null;
  lng: number | null;
}

/** Bairros com menos consultas ficam de fora: a taxa deles oscila por acaso. */
export const MIN_CONSULTAS = 100;

// Cinco faixas de taxa de falta (uma só cor, de claro a escuro). A média da base é ~20%.
export const FAIXAS = [
  { ate: 17, cor: '#FBE3C2', rotulo: 'até 17%' },
  { ate: 19, cor: '#F6BE80', rotulo: '17–19%' },
  { ate: 21, cor: '#EB8F4A', rotulo: '19–21%' },
  { ate: 23, cor: '#CC5A2B', rotulo: '21–23%' },
  { ate: Infinity, cor: '#8F2A1B', rotulo: '23% ou mais' },
];
export const corDaTaxa = (taxa: number) => FAIXAS.find((f) => taxa < f.ate)!.cor;

export const taxaDeFalta = (b: Bairro) => (b.faltas / b.consultas) * 100;

const PREPOSICOES = new Set(['DA', 'DE', 'DO', 'DAS', 'DOS']);
export function nomeBonito(nome: string): string {
  return nome
    .toLowerCase()
    .split(' ')
    .map((p, i) => (PREPOSICOES.has(p.toUpperCase()) && i > 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ')
    .replace('´', "'");
}

export const pct = (v: number, casas = 1) => v.toFixed(casas).replace('.', ',');

export const TODOS_BAIRROS = dados as Bairro[];

/** Bairros com coordenada e com MIN_CONSULTAS+ consultas: os que viram círculo no mapa. */
export const BAIRROS_MAPEADOS = TODOS_BAIRROS.filter(
  (b) => b.lat != null && b.lng != null && b.consultas >= MIN_CONSULTAS,
);

/** Diâmetro do círculo: cresce com a raiz do nº de consultas (área proporcional). */
export function diametroDoCirculo(consultas: number, maiorN: number, escala = 1): number {
  return (16 + 30 * Math.sqrt(consultas / Math.max(1, maiorN))) * escala;
}

// ---------------------------------------------------------------------------
// Concentração de pacientes da clínica por bairro (camada "Pacientes da clínica").

/** Cinco tons de verde-água, do claro (poucos pacientes) ao escuro (muitos). */
export const ESCALA_CONCENTRACAO = ['#D5EFEC', '#9FD9D3', '#5BBDB5', '#1F9A93', '#006A66'];

/** Índice do tom: cada tom cobre 1/5 do intervalo (0, maximo]. */
function indiceDaConcentracao(total: number, maximo: number): number {
  if (maximo <= 0 || total <= 0) return 0;
  const n = ESCALA_CONCENTRACAO.length;
  return Math.min(n - 1, Math.max(0, Math.ceil((total / maximo) * n) - 1));
}

/** Tom da escala verde-água pela proporção total/maximo. */
export const corDaConcentracao = (total: number, maximo: number) =>
  ESCALA_CONCENTRACAO[indiceDaConcentracao(total, maximo)];

/**
 * Legenda da escala: um item por tom, com o intervalo de nº de pacientes que ele cobre
 * (mesma regra de corDaConcentracao). Tom sem nenhum valor inteiro possível fica com "–".
 */
export function faixasDaConcentracao(maximo: number): { cor: string; rotulo: string }[] {
  const n = ESCALA_CONCENTRACAO.length;
  return ESCALA_CONCENTRACAO.map((cor, i) => {
    const de = Math.floor((i * maximo) / n) + 1;
    const ate = Math.floor(((i + 1) * maximo) / n);
    const rotulo = de > ate ? '–' : de === ate ? `${de}` : `${de}–${ate}`;
    return { cor, rotulo };
  });
}
