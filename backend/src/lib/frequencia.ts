import { Categoria } from '../generated/prisma/enums';
import { prisma } from '../prisma';

export type PeriodoFrequencia = 'semana' | 'mes';

export function calcularPeriodo(periodo: PeriodoFrequencia): { inicio: Date; fim: Date } {
  const fim = new Date();
  fim.setUTCHours(23, 59, 59, 999);

  const inicio = new Date(fim);
  inicio.setUTCHours(0, 0, 0, 0);
  const dias = periodo === 'semana' ? 7 : 30;
  inicio.setUTCDate(inicio.getUTCDate() - (dias - 1));

  return { inicio, fim };
}

export type FrequenciaAtleta = {
  totalTreinos: number;
  totalPresente: number;
  percentual: number | null;
};

export async function calcularFrequenciaAtleta(
  atletaId: string,
  categoria: Categoria,
  periodo: PeriodoFrequencia,
): Promise<FrequenciaAtleta> {
  const { inicio, fim } = calcularPeriodo(periodo);

  const treinos = await prisma.treino.findMany({
    where: { categorias: { has: categoria }, data: { gte: inicio, lte: fim } },
    select: { id: true },
  });

  if (treinos.length === 0) {
    return { totalTreinos: 0, totalPresente: 0, percentual: null };
  }

  const totalPresente = await prisma.presenca.count({
    where: { atletaId, presente: true, treinoId: { in: treinos.map((t) => t.id) } },
  });

  return {
    totalTreinos: treinos.length,
    totalPresente,
    percentual: Math.round((totalPresente / treinos.length) * 1000) / 10,
  };
}

export type FrequenciaGrupoAtleta = {
  atletaId: string;
  nome: string;
  presencasPorTreino: Record<string, boolean>;
  totalPresente: number;
  totalTreinos: number;
  percentual: number | null;
};

export type FrequenciaGrupo = {
  periodo: { inicio: Date; fim: Date };
  treinos: { id: string; data: Date; objetivoSemana: string }[];
  atletas: FrequenciaGrupoAtleta[];
};

export async function calcularFrequenciaGrupo(
  categoria: Categoria,
  periodo: PeriodoFrequencia,
): Promise<FrequenciaGrupo> {
  const { inicio, fim } = calcularPeriodo(periodo);

  const [treinos, atletas] = await Promise.all([
    prisma.treino.findMany({
      where: { categorias: { has: categoria }, data: { gte: inicio, lte: fim } },
      orderBy: { data: 'asc' },
      select: { id: true, data: true, objetivoSemana: true },
    }),
    prisma.atleta.findMany({
      where: { categoria },
      include: { usuario: { select: { nome: true } } },
      orderBy: { usuario: { nome: 'asc' } },
    }),
  ]);

  const treinoIds = treinos.map((t) => t.id);
  const presencas =
    treinoIds.length > 0
      ? await prisma.presenca.findMany({
          where: { treinoId: { in: treinoIds }, presente: true },
          select: { atletaId: true, treinoId: true },
        })
      : [];

  const presentesPorAtleta = new Map<string, Set<string>>();
  for (const p of presencas) {
    if (!presentesPorAtleta.has(p.atletaId)) {
      presentesPorAtleta.set(p.atletaId, new Set());
    }
    presentesPorAtleta.get(p.atletaId)!.add(p.treinoId);
  }

  const atletasResultado: FrequenciaGrupoAtleta[] = atletas.map((a) => {
    const presentesSet = presentesPorAtleta.get(a.id) ?? new Set<string>();
    const presencasPorTreino: Record<string, boolean> = {};
    for (const t of treinos) {
      presencasPorTreino[t.id] = presentesSet.has(t.id);
    }

    return {
      atletaId: a.id,
      nome: a.usuario.nome,
      presencasPorTreino,
      totalPresente: presentesSet.size,
      totalTreinos: treinos.length,
      percentual: treinos.length > 0 ? Math.round((presentesSet.size / treinos.length) * 1000) / 10 : null,
    };
  });

  return { periodo: { inicio, fim }, treinos, atletas: atletasResultado };
}
