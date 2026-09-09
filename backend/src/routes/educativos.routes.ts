import { Router } from 'express';
import { z } from 'zod';

import { EstiloNado, StatusEducativo, TipoUsuario } from '../generated/prisma/enums';
import { AppError } from '../lib/errors';
import { authenticate, requireTipo } from '../middleware/auth';
import { prisma } from '../prisma';

export const educativosRouter = Router();

educativosRouter.use(authenticate);

const educativoSchema = z.object({
  estilo: z.enum(EstiloNado, { error: 'Estilo é obrigatório' }),
  nome: z.string({ error: 'Nome é obrigatório' }).trim().min(1, 'Nome é obrigatório'),
  descricaoObjetivo: z
    .string({ error: 'Descrição do objetivo é obrigatória' })
    .trim()
    .min(1, 'Descrição do objetivo é obrigatória'),
  videoUrl: z.url({ error: 'Informe uma URL de vídeo válida' }),
});

// Biblioteca pública: técnico e atleta veem os mesmos educativos publicados.
educativosRouter.get('/', async (req, res) => {
  const { estilo } = req.query;
  if (estilo !== undefined && !Object.values(EstiloNado).includes(estilo as EstiloNado)) {
    throw new AppError(400, 'Estilo inválido');
  }

  const educativos = await prisma.educativo.findMany({
    where: { status: StatusEducativo.PUBLICADO, estilo: estilo as EstiloNado | undefined },
    orderBy: [{ estilo: 'asc' }, { nome: 'asc' }],
  });

  res.json({ educativos });
});

// Fila de aprovação do técnico — precisa vir antes de "/:id" pra não ser
// capturada pela rota de parâmetro.
educativosRouter.get('/pendentes', requireTipo(TipoUsuario.TECNICO), async (_req, res) => {
  const educativos = await prisma.educativo.findMany({
    where: { status: StatusEducativo.PENDENTE },
    include: { autor: { select: { nome: true } } },
    orderBy: { criadoEm: 'asc' },
  });

  res.json({
    educativos: educativos.map(({ autor, ...e }) => ({ ...e, autorNome: autor.nome })),
  });
});

// Retorno pro atleta sobre o que ele sugeriu (aprovado, rejeitado ou ainda pendente).
educativosRouter.get('/minhas-sugestoes', requireTipo(TipoUsuario.ATLETA), async (req, res) => {
  const educativos = await prisma.educativo.findMany({
    where: { autorId: req.usuario!.id },
    orderBy: { criadoEm: 'desc' },
  });

  res.json({ educativos });
});

educativosRouter.get('/:id', async (req, res) => {
  const educativo = await prisma.educativo.findUnique({ where: { id: req.params.id } });
  if (!educativo) {
    throw new AppError(404, 'Educativo não encontrado');
  }

  const podeVer =
    educativo.status === StatusEducativo.PUBLICADO ||
    req.usuario!.tipo === TipoUsuario.TECNICO ||
    educativo.autorId === req.usuario!.id;
  if (!podeVer) {
    throw new AppError(404, 'Educativo não encontrado');
  }

  res.json({ educativo });
});

educativosRouter.post('/', requireTipo(TipoUsuario.TECNICO), async (req, res) => {
  const parsed = educativoSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }

  const educativo = await prisma.educativo.create({
    data: { ...parsed.data, status: StatusEducativo.PUBLICADO, autorId: req.usuario!.id },
  });

  res.status(201).json({ educativo });
});

educativosRouter.put('/:id', requireTipo(TipoUsuario.TECNICO), async (req, res) => {
  const id = req.params.id as string;
  const parsed = educativoSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }

  const existente = await prisma.educativo.findUnique({ where: { id } });
  if (!existente) {
    throw new AppError(404, 'Educativo não encontrado');
  }

  const educativo = await prisma.educativo.update({ where: { id }, data: parsed.data });
  res.json({ educativo });
});

educativosRouter.delete('/:id', requireTipo(TipoUsuario.TECNICO), async (req, res) => {
  const id = req.params.id as string;
  const existente = await prisma.educativo.findUnique({ where: { id } });
  if (!existente) {
    throw new AppError(404, 'Educativo não encontrado');
  }

  await prisma.educativo.delete({ where: { id } });
  res.status(204).send();
});

// Sugestão de atleta: entra como PENDENTE e só fica pública depois de aprovada.
educativosRouter.post('/sugestoes', requireTipo(TipoUsuario.ATLETA), async (req, res) => {
  const parsed = educativoSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }

  const educativo = await prisma.educativo.create({
    data: { ...parsed.data, status: StatusEducativo.PENDENTE, autorId: req.usuario!.id },
  });

  res.status(201).json({ educativo });
});

async function buscarPendenteOuFalhar(id: string) {
  const educativo = await prisma.educativo.findUnique({ where: { id } });
  if (!educativo) {
    throw new AppError(404, 'Educativo não encontrado');
  }
  if (educativo.status !== StatusEducativo.PENDENTE) {
    throw new AppError(400, 'Esse educativo já foi avaliado');
  }
  return educativo;
}

educativosRouter.post('/:id/aprovar', requireTipo(TipoUsuario.TECNICO), async (req, res) => {
  const id = req.params.id as string;
  await buscarPendenteOuFalhar(id);
  const educativo = await prisma.educativo.update({
    where: { id },
    data: { status: StatusEducativo.PUBLICADO },
  });
  res.json({ educativo });
});

educativosRouter.post('/:id/rejeitar', requireTipo(TipoUsuario.TECNICO), async (req, res) => {
  const id = req.params.id as string;
  await buscarPendenteOuFalhar(id);
  const educativo = await prisma.educativo.update({
    where: { id },
    data: { status: StatusEducativo.REJEITADO },
  });
  res.json({ educativo });
});
