import { prisma } from '../prisma';

// Data exata da competição (não normalizamos hora) + nome com trim exato —
// se o mesmo evento for digitado com grafias diferentes por atletas
// diferentes, cada um cria sua própria Competicao; aceitável pro cadastro
// manual de hoje, e não impede a futura importação por API (que vai casar
// por externoId, não por nome).
export async function encontrarOuCriarCompeticao(nome: string, data: Date, local: string) {
  const existente = await prisma.competicao.findFirst({ where: { nome, data } });
  if (existente) return existente;
  return prisma.competicao.create({ data: { nome, data, local } });
}

export type MelhorTempoPorProva = {
  resultadoId: string;
  estilo: string;
  distancia: number;
  tempoCentesimos: number;
  data: Date;
  competicaoNome: string;
};

// Melhor tempo por prova (estilo + distância) entre todos os resultados de
// competição já cadastrados pelo atleta — igual à lógica de "recorde atual"
// usada nos recordes internos da equipe, mas por atleta em vez de por time.
export async function calcularMelhoresTempos(atletaId: string): Promise<MelhorTempoPorProva[]> {
  const resultados = await prisma.resultadoCompeticao.findMany({
    where: { atletaId },
    include: { competicao: { select: { nome: true, data: true } } },
  });

  const melhores = new Map<string, (typeof resultados)[number]>();
  for (const r of resultados) {
    const chave = `${r.estilo}|${r.distancia}`;
    const atual = melhores.get(chave);
    if (!atual || r.tempoCentesimos < atual.tempoCentesimos) {
      melhores.set(chave, r);
    }
  }

  return Array.from(melhores.values())
    .map((r) => ({
      resultadoId: r.id,
      estilo: r.estilo,
      distancia: r.distancia,
      tempoCentesimos: r.tempoCentesimos,
      data: r.competicao.data,
      competicaoNome: r.competicao.nome,
    }))
    .sort((a, b) => (a.estilo === b.estilo ? a.distancia - b.distancia : a.estilo.localeCompare(b.estilo)));
}
