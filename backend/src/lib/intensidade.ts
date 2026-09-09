import type { EstiloNado } from '../generated/prisma/enums';
import { TamanhoPiscina } from '../generated/prisma/enums';
import { buscarRecordesAtuais } from './recordes';
import { prisma } from '../prisma';

// Classificação de intensidade usada tanto no cálculo quanto na tabela de
// referência estática mostrada no app — mantenha os dois em sincronia.
export type FaixaIntensidade = 'LEVE' | 'MODERADO' | 'INTENSO';

const LIMITE_LEVE = 85;
const LIMITE_MODERADO = 95;

export function classificarFaixa(intensidade: number): FaixaIntensidade {
  if (intensidade < LIMITE_LEVE) return 'LEVE';
  if (intensidade <= LIMITE_MODERADO) return 'MODERADO';
  return 'INTENSO';
}

export type ItemIntensidade = {
  registroId: string;
  treinoId: string;
  treinoData: Date;
  bloco: string;
  distancia: string;
  tempoCentesimos: number;
  estilo: EstiloNado | null;
  melhorTempoCentesimos: number | null;
  intensidade: number | null;
  faixa: FaixaIntensidade | null;
  recorde: boolean;
};

// Intensidade de um tiro = melhor tempo do atleta naquela distância dividido
// pelo tempo do tiro, em porcentagem. O "melhor tempo" é o menor tempo já
// registrado pelo atleta naquela distância (entre todos os tiros, incluindo
// o próprio). Se o atleta só tem UM tiro registrado naquela distância ainda
// não há base de comparação — fica marcado como "sem referência".
export async function calcularIntensidadesAtleta(atletaId: string): Promise<ItemIntensidade[]> {
  const atleta = await prisma.atleta.findUnique({ where: { id: atletaId }, select: { categoria: true, sexo: true } });

  const registros = await prisma.registroTempo.findMany({
    where: { atletaId },
    include: { treino: { select: { data: true } } },
    orderBy: [{ treino: { data: 'desc' } }, { ordem: 'asc' }],
  });

  // distancia é texto livre (ver comentário no schema) — o agrupamento e a
  // comparação com recorde só funcionam quando o texto bate exatamente com
  // um número (ex: "100"); qualquer outra coisa ("4x50", uma observação)
  // simplesmente não casa com nada e cai no caminho "sem referência" abaixo.
  const grupos = new Map<string, { melhor: number; total: number }>();
  for (const r of registros) {
    const chave = r.distancia.trim();
    const grupo = grupos.get(chave);
    if (!grupo) {
      grupos.set(chave, { melhor: r.tempoCentesimos, total: 1 });
    } else {
      grupo.total += 1;
      if (r.tempoCentesimos < grupo.melhor) {
        grupo.melhor = r.tempoCentesimos;
      }
    }
  }

  // Recorde é comparado por estilo + distância + categoria + sexo do atleta
  // — só sinalizamos "novo recorde" quando já existe um recorde a ser
  // batido. Sem o sexo cadastrado (contas antigas) não dá pra comparar sem
  // arriscar misturar recordes masculino/feminino, então pulamos a
  // comparação. Piscina fica travada em 50m (long course): o treino não
  // registra em qual piscina o tiro foi nadado, e comparar contra a piscina
  // "oficial" é mais seguro do que misturar 25m e 50m.
  const recordesAtuais = atleta?.sexo
    ? await buscarRecordesAtuais({ categoria: atleta.categoria, sexo: atleta.sexo, piscina: TamanhoPiscina.M50 })
    : [];
  const recordesPorChave = new Map(recordesAtuais.map((rec) => [`${rec.estilo}|${rec.distancia}`, rec]));

  return registros.map((r) => {
    const chave = r.distancia.trim();
    const grupo = grupos.get(chave)!;
    const recordeAtual = r.estilo ? recordesPorChave.get(`${r.estilo}|${chave}`) : undefined;
    const recorde = recordeAtual != null && r.tempoCentesimos <= recordeAtual.tempoCentesimos;

    if (grupo.total < 2) {
      return {
        registroId: r.id,
        treinoId: r.treinoId,
        treinoData: r.treino.data,
        bloco: r.bloco,
        distancia: r.distancia,
        tempoCentesimos: r.tempoCentesimos,
        estilo: r.estilo,
        melhorTempoCentesimos: null,
        intensidade: null,
        faixa: null,
        recorde,
      };
    }

    const intensidade = Math.round((grupo.melhor / r.tempoCentesimos) * 1000) / 10;

    return {
      registroId: r.id,
      treinoId: r.treinoId,
      treinoData: r.treino.data,
      bloco: r.bloco,
      distancia: r.distancia,
      tempoCentesimos: r.tempoCentesimos,
      estilo: r.estilo,
      melhorTempoCentesimos: grupo.melhor,
      intensidade,
      faixa: classificarFaixa(intensidade),
      recorde,
    };
  });
}

export type ResumoIntensidade = {
  mediaSemana: number | null;
  quantidadeTirosSemana: number;
  quantidadeComReferenciaSemana: number;
};

function inicioDaSemana(referencia: Date): Date {
  const d = new Date(referencia);
  d.setUTCHours(0, 0, 0, 0);
  const diaSemana = d.getUTCDay();
  const deslocamento = diaSemana === 0 ? 6 : diaSemana - 1;
  d.setUTCDate(d.getUTCDate() - deslocamento);
  return d;
}

export function calcularResumoSemana(itens: ItemIntensidade[]): ResumoIntensidade {
  const inicio = inicioDaSemana(new Date());
  const daSemana = itens.filter((i) => i.treinoData >= inicio);
  const comReferencia = daSemana.filter(
    (i): i is ItemIntensidade & { intensidade: number } => i.intensidade !== null,
  );

  const media =
    comReferencia.length > 0
      ? Math.round((comReferencia.reduce((acc, i) => acc + i.intensidade, 0) / comReferencia.length) * 10) / 10
      : null;

  return {
    mediaSemana: media,
    quantidadeTirosSemana: daSemana.length,
    quantidadeComReferenciaSemana: comReferencia.length,
  };
}
