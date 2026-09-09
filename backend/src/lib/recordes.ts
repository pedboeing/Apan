import type { Categoria, EstiloNado, RecordeInterno, Sexo, TamanhoPiscina } from '../generated/prisma/client';
import { prisma } from '../prisma';

export type FiltrosRecorde = {
  estilo?: EstiloNado;
  categoria?: Categoria;
  distancia?: number;
  sexo?: Sexo;
  piscina?: TamanhoPiscina;
};

function chave(r: { estilo: EstiloNado; distancia: number; categoria: Categoria; sexo: Sexo; piscina: TamanhoPiscina }): string {
  return `${r.estilo}|${r.distancia}|${r.categoria}|${r.sexo}|${r.piscina}`;
}

// O "recorde atual" de uma prova (estilo + distância) numa categoria, sexo e
// piscina é o de menor tempo entre todas as linhas daquele grupo; em caso de
// empate, o mais antigo (data do feito) vence. Tempos de piscinas ou sexos
// diferentes nunca se misturam num mesmo grupo.
export function agruparRecordesAtuais(registros: RecordeInterno[]): RecordeInterno[] {
  const melhores = new Map<string, RecordeInterno>();

  for (const r of registros) {
    const k = chave(r);
    const atual = melhores.get(k);
    if (
      !atual ||
      r.tempoCentesimos < atual.tempoCentesimos ||
      (r.tempoCentesimos === atual.tempoCentesimos && r.data < atual.data)
    ) {
      melhores.set(k, r);
    }
  }

  return Array.from(melhores.values()).sort((a, b) => {
    if (a.estilo !== b.estilo) return a.estilo.localeCompare(b.estilo);
    if (a.distancia !== b.distancia) return a.distancia - b.distancia;
    if (a.categoria !== b.categoria) return a.categoria.localeCompare(b.categoria);
    if (a.sexo !== b.sexo) return a.sexo.localeCompare(b.sexo);
    return a.piscina.localeCompare(b.piscina);
  });
}

export async function buscarRecordesAtuais(filtros: FiltrosRecorde = {}): Promise<RecordeInterno[]> {
  const registros = await prisma.recordeInterno.findMany({
    where: {
      estilo: filtros.estilo,
      categoria: filtros.categoria,
      distancia: filtros.distancia,
      sexo: filtros.sexo,
      piscina: filtros.piscina,
    },
  });

  return agruparRecordesAtuais(registros);
}
