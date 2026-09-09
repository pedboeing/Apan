import type { EstiloNado } from '../generated/prisma/enums';
import { TamanhoPiscina } from '../generated/prisma/enums';

// As 5 zonas de treinamento da tabela de referência pessoal do atleta. Cada
// zona é uma faixa percentual do melhor tempo do atleta naquela prova — o
// mesmo conceito de "intensidade" já usado em lib/intensidade.ts
// (intensidade = melhorTempo ÷ tempoReal × 100): quanto maior o percentual,
// mais perto do melhor tempo (mais rápido); quanto menor, mais devagar.
// Por isso o tempo de referência de uma zona é sempre
// melhorTempo × 100 ÷ percentual, não melhorTempo × percentual — senão o
// "tempo" da zona ficaria mais rápido que o próprio recorde do atleta.
export type ZonaTreinamentoDef = {
  zona: string;
  descricao: string;
  percentualMin: number;
  percentualMax: number;
};

export const ZONAS_TREINAMENTO: ZonaTreinamentoDef[] = [
  { zona: 'A1', descricao: 'Recuperação / aeróbico leve', percentualMin: 70, percentualMax: 75 },
  { zona: 'A2', descricao: 'Aeróbico moderado', percentualMin: 75, percentualMax: 80 },
  { zona: 'CA3', descricao: 'Capacidade aeróbica', percentualMin: 80, percentualMax: 85 },
  { zona: 'PA3', descricao: 'Potência aeróbica', percentualMin: 85, percentualMax: 90 },
  { zona: 'AN', descricao: 'Anaeróbico', percentualMin: 90, percentualMax: 95 },
];

export type ZonaTreinamentoCalculada = ZonaTreinamentoDef & {
  tempoRapidoCentesimos: number;
  tempoLentoCentesimos: number;
};

export function calcularZonasPorTempo(melhorTempoCentesimos: number): ZonaTreinamentoCalculada[] {
  return ZONAS_TREINAMENTO.map((z) => ({
    ...z,
    tempoRapidoCentesimos: Math.round((melhorTempoCentesimos * 100) / z.percentualMax),
    tempoLentoCentesimos: Math.round((melhorTempoCentesimos * 100) / z.percentualMin),
  }));
}

export type ProvaComZonas = {
  estilo: EstiloNado;
  distancia: number;
  melhorTempoCentesimos: number | null;
  zonas: ZonaTreinamentoCalculada[];
};

export type TabelaReferenciaPorPiscina = {
  m25: ProvaComZonas[];
  m50: ProvaComZonas[];
};

// Monta a tabela de referência de um atleta a partir das provas principais
// que ele escolheu + as melhores marcas que ele cadastrou, uma tabela por
// tamanho de piscina — tempos de 25m e 50m não são comparáveis, então cada
// piscina tem sua própria referência (uma prova sem marca cadastrada NAQUELA
// piscina aparece na lista sem zonas, pra a tela convidar o atleta a
// cadastrar uma).
export function montarTabelaReferencia(
  provasPrincipais: { estilo: EstiloNado; distancia: number }[],
  melhoresMarcas: { estilo: EstiloNado; distancia: number; piscina: TamanhoPiscina; tempoCentesimos: number }[],
): TabelaReferenciaPorPiscina {
  function montarParaPiscina(piscina: TamanhoPiscina): ProvaComZonas[] {
    return provasPrincipais.map((prova) => {
      const marca = melhoresMarcas.find(
        (m) => m.estilo === prova.estilo && m.distancia === prova.distancia && m.piscina === piscina,
      );

      return {
        estilo: prova.estilo,
        distancia: prova.distancia,
        melhorTempoCentesimos: marca?.tempoCentesimos ?? null,
        zonas: marca ? calcularZonasPorTempo(marca.tempoCentesimos) : [],
      };
    });
  }

  return { m25: montarParaPiscina(TamanhoPiscina.M25), m50: montarParaPiscina(TamanhoPiscina.M50) };
}
