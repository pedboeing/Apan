import { Categoria, OrigemPresenca } from '../generated/prisma/enums';
import { prisma } from '../prisma';

// Atleta que não anota nem tempo nem PSE de um treino liberado até 48h
// depois de criado passa a contar como "ausente" sozinho, sem precisar que
// ninguém (técnico ou o próprio atleta) faça nada. Esse projeto não tem
// nenhum job/cron rodando em segundo plano, então essa verificação é feita
// "on demand": toda vez que uma tela relevante é aberta, ver
// garantirAusenciasAutomaticasPorCategoria/DoTreino abaixo.
export const JANELA_AUSENCIA_HORAS = 48;

export type StatusAtletaTreino = 'PENDENTE' | 'RESPONDIDO' | 'AUSENTE';

// Única definição do que conta como "respondido" — usada tanto pro atleta
// (meu-treino/meu-histórico) quanto pro técnico (registros do treino), pra
// não correr o risco das duas visões divergirem sobre o mesmo treino.
export function calcularStatusAtleta(
  tempos: unknown[],
  pse: unknown | null,
  presencas: { presente: boolean }[],
): StatusAtletaTreino {
  if (tempos.length > 0 || pse) return 'RESPONDIDO';
  if (presencas.some((p) => !p.presente)) return 'AUSENTE';
  return 'PENDENTE';
}

// Varre os treinos liberados e já "vencidos" (48h) da categoria de UM
// atleta e grava a falta automática que ainda não existe. Idempotente:
// treino que já tem registro (tempo, PSE ou presença) de qualquer origem
// nunca é sobrescrito aqui.
export async function garantirAusenciasAutomaticasPorCategoria(categoria: Categoria, atletaId: string) {
  const limite = new Date(Date.now() - JANELA_AUSENCIA_HORAS * 60 * 60 * 1000);

  const treinos = await prisma.treino.findMany({
    where: { categorias: { has: categoria }, liberado: true, criadoEm: { lte: limite } },
    select: { id: true },
  });
  if (treinos.length === 0) return;
  const treinoIds = treinos.map((t) => t.id);

  const [comTempo, comPse, comPresenca] = await Promise.all([
    prisma.registroTempo.findMany({ where: { atletaId, treinoId: { in: treinoIds } }, select: { treinoId: true } }),
    prisma.registroPSE.findMany({ where: { atletaId, treinoId: { in: treinoIds } }, select: { treinoId: true } }),
    prisma.presenca.findMany({ where: { atletaId, treinoId: { in: treinoIds } }, select: { treinoId: true } }),
  ]);
  const jaTemAlgo = new Set([...comTempo, ...comPse, ...comPresenca].map((r) => r.treinoId));

  const faltantes = treinoIds.filter((id) => !jaTemAlgo.has(id));
  if (faltantes.length === 0) return;

  await prisma.presenca.createMany({
    data: faltantes.map((treinoId) => ({ atletaId, treinoId, presente: false, origem: OrigemPresenca.EXPIRADA })),
    skipDuplicates: true,
  });
}

// Mesma ideia, mas pro lado do técnico: varre TODOS os atletas elegíveis
// (todas as categorias que o treino atinge) de um único treino.
export async function garantirAusenciaAutomaticaDoTreino(treino: {
  id: string;
  categorias: Categoria[];
  liberado: boolean;
  criadoEm: Date;
}) {
  if (!treino.liberado) return;

  const limite = new Date(Date.now() - JANELA_AUSENCIA_HORAS * 60 * 60 * 1000);
  if (treino.criadoEm > limite) return;

  const atletas = await prisma.atleta.findMany({ where: { categoria: { in: treino.categorias } }, select: { id: true } });
  if (atletas.length === 0) return;

  const [comTempo, comPse, comPresenca] = await Promise.all([
    prisma.registroTempo.findMany({ where: { treinoId: treino.id }, select: { atletaId: true } }),
    prisma.registroPSE.findMany({ where: { treinoId: treino.id }, select: { atletaId: true } }),
    prisma.presenca.findMany({ where: { treinoId: treino.id }, select: { atletaId: true } }),
  ]);
  const jaTemAlgo = new Set([...comTempo, ...comPse, ...comPresenca].map((r) => r.atletaId));

  const faltantes = atletas.filter((a) => !jaTemAlgo.has(a.id));
  if (faltantes.length === 0) return;

  await prisma.presenca.createMany({
    data: faltantes.map((a) => ({ atletaId: a.id, treinoId: treino.id, presente: false, origem: OrigemPresenca.EXPIRADA })),
    skipDuplicates: true,
  });
}
