import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';

import { Categoria, FaseCiclo, TipoUsuario } from '../generated/prisma/enums';
import { calcularStatusAtleta, garantirAusenciaAutomaticaDoTreino } from '../lib/ausencia';
import { AppError } from '../lib/errors';
import { authenticate, requireTipo } from '../middleware/auth';
import { prisma } from '../prisma';

export const treinosRouter = Router();

treinosRouter.use(authenticate, requireTipo(TipoUsuario.TECNICO));

// Todo técnico enxerga os treinos de todos (visão do time inteiro), mas só
// quem criou um treino pode editá-lo ou excluí-lo — carrega o registro de
// Tecnico do usuário logado uma vez e deixa disponível pras rotas abaixo,
// tanto pra marcar quem é o dono na criação quanto pra checar dono antes de
// editar/excluir um treino específico.
async function carregarTecnico(req: Request, _res: Response, next: NextFunction) {
  const tecnico = await prisma.tecnico.findUnique({ where: { usuarioId: req.usuario!.id } });
  if (!tecnico) {
    throw new AppError(403, 'Perfil de técnico não encontrado para este usuário');
  }
  req.tecnico = tecnico;
  next();
}

treinosRouter.use(carregarTecnico);

// Junta nome + id do usuário de quem criou o treino na resposta (pra UI
// destacar "criado por Fulano" e decidir se mostra os botões de
// editar/excluir), sem vazar o resto do usuário/registro de Tecnico. O id é
// o do Usuario (não do Tecnico) porque é isso que o app tem à mão em
// useAuth() pra comparar "esse treino é meu?".
const comCriador = { tecnico: { select: { usuario: { select: { id: true, nome: true } } } } } as const;

function comNomeDoCriador<T extends { tecnico: { usuario: { id: string; nome: string } } }>(treino: T) {
  const { tecnico, ...resto } = treino;
  return { ...resto, criadoPorUsuarioId: tecnico.usuario.id, criadoPorNome: tecnico.usuario.nome };
}

// Qualquer técnico pode VER qualquer treino (visão do time inteiro).
async function obterTreino(id: string) {
  const treino = await prisma.treino.findUnique({ where: { id }, include: comCriador });
  if (!treino) {
    throw new AppError(404, 'Treino não encontrado');
  }
  return treino;
}

// Só quem criou o treino pode EDITAR/EXCLUIR ele — exceto um técnico com a
// flag `admin` (ver Tecnico.admin no schema), que pode mexer em qualquer
// treino do time, igual já pode vê-los todos.
async function obterTreinoParaEditar(id: string, tecnico: { id: string; admin: boolean }) {
  const treino = await prisma.treino.findUnique({ where: { id } });
  if (!treino || (treino.tecnicoId !== tecnico.id && !tecnico.admin)) {
    throw new AppError(404, 'Treino não encontrado');
  }
  return treino;
}

const listaDeSeries = z
  .array(z.string())
  .default([])
  .transform((serie) => serie.map((s) => s.trim()).filter((s) => s.length > 0));

const treinoSchema = z
  .object({
    data: z.coerce.date({ error: 'Data é obrigatória' }),
    categorias: z.array(z.enum(Categoria)).min(1, 'Selecione ao menos um grupo'),
    objetivoSemana: z
      .string({ error: 'Objetivo da semana é obrigatório' })
      .trim()
      .min(1, 'Objetivo da semana é obrigatório'),
    faseCiclo: z.enum(FaseCiclo, { error: 'Fase do ciclo é obrigatória' }),
    pseEsperada: z.coerce.number().min(0, 'PSE deve ser entre 0 e 10').max(10, 'PSE deve ser entre 0 e 10').nullish(),

    aquecimento: listaDeSeries,
    aquecimentoCronometrado: z.boolean().default(false),
    seriePreparatoria: listaDeSeries,
    seriePreparatoriaCronometrada: z.boolean().default(false),
    seriePrincipal: listaDeSeries,
    seriePrincipalCronometrada: z.boolean().default(false),
    soltura: listaDeSeries,
    solturaCronometrada: z.boolean().default(false),

    liberado: z.boolean().default(true),
  })
  .refine(
    (dados) =>
      [dados.aquecimento, dados.seriePreparatoria, dados.seriePrincipal, dados.soltura].some((b) => b.length > 0),
    { message: 'Preencha ao menos uma série em algum dos blocos', path: ['aquecimento'] },
  );

treinosRouter.get('/', async (req, res) => {
  const { categoria } = req.query;

  if (categoria !== undefined && !Object.values(Categoria).includes(categoria as Categoria)) {
    throw new AppError(400, 'Categoria inválida');
  }

  const treinos = await prisma.treino.findMany({
    where: categoria ? { categorias: { has: categoria as Categoria } } : undefined,
    include: comCriador,
    orderBy: [{ data: 'desc' }, { criadoEm: 'desc' }],
  });

  res.json({ treinos: treinos.map(comNomeDoCriador) });
});

treinosRouter.get('/:id', async (req, res) => {
  const treino = await obterTreino(req.params.id);
  res.json({ treino: comNomeDoCriador(treino) });
});

treinosRouter.get('/:id/registros', async (req, res) => {
  const treino = await obterTreino(req.params.id);
  await garantirAusenciaAutomaticaDoTreino(treino);

  const atletas = await prisma.atleta.findMany({
    where: { categoria: { in: treino.categorias } },
    include: {
      usuario: { select: { nome: true } },
      registrosPSE: { where: { treinoId: treino.id } },
      registrosTempo: { where: { treinoId: treino.id }, orderBy: [{ bloco: 'asc' }, { ordem: 'asc' }] },
      presencas: { where: { treinoId: treino.id } },
    },
    orderBy: { usuario: { nome: 'asc' } },
  });

  res.json({
    treino: comNomeDoCriador(treino),
    atletas: atletas.map((a) => ({
      atletaId: a.id,
      nome: a.usuario.nome,
      status: calcularStatusAtleta(a.registrosTempo, a.registrosPSE[0] ?? null, a.presencas),
      pse: a.registrosPSE[0]?.pse ?? null,
      qualidadeSono: a.registrosPSE[0]?.qualidadeSono ?? null,
      tempos: a.registrosTempo,
    })),
  });
});

treinosRouter.post('/', async (req, res) => {
  const parsed = treinoSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }

  const treino = await prisma.treino.create({
    data: { ...parsed.data, tecnicoId: req.tecnico!.id },
  });

  res.status(201).json({ treino });
});

treinosRouter.put('/:id', async (req, res) => {
  const parsed = treinoSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }

  await obterTreinoParaEditar(req.params.id, req.tecnico!);

  const treino = await prisma.treino.update({
    where: { id: req.params.id },
    data: parsed.data,
  });

  res.json({ treino });
});

treinosRouter.delete('/:id', async (req, res) => {
  await obterTreinoParaEditar(req.params.id, req.tecnico!);

  await prisma.treino.delete({ where: { id: req.params.id } });

  res.status(204).send();
});
