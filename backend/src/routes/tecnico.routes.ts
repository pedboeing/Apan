import { Router } from 'express';
import { z } from 'zod';

import { Categoria, OrigemPresenca, TipoUsuario } from '../generated/prisma/enums';
import { garantirCategoriaAtualizada } from '../lib/categoria';
import { AppError } from '../lib/errors';
import { calcularFrequenciaGrupo, type PeriodoFrequencia } from '../lib/frequencia';
import { calcularIntensidadesAtleta, calcularResumoSemana } from '../lib/intensidade';
import { montarTabelaReferencia } from '../lib/zonas-treinamento';
import { authenticate, requireTipo } from '../middleware/auth';
import { prisma } from '../prisma';

export const tecnicoRouter = Router();

tecnicoRouter.use(authenticate, requireTipo(TipoUsuario.TECNICO));

tecnicoRouter.get('/atletas', async (_req, res) => {
  const atletas = await prisma.atleta.findMany({
    include: { usuario: { select: { nome: true, email: true } } },
    orderBy: { usuario: { nome: 'asc' } },
  });

  const atualizados = await Promise.all(atletas.map((a) => garantirCategoriaAtualizada(a)));

  res.json({
    atletas: atualizados.map((a) => ({
      id: a.id,
      nome: a.usuario.nome,
      email: a.usuario.email,
      categoria: a.categoria,
    })),
  });
});

tecnicoRouter.get('/atletas/:atletaId/intensidade', async (req, res) => {
  const encontrado = await prisma.atleta.findUnique({
    where: { id: req.params.atletaId },
    include: { usuario: { select: { nome: true } } },
  });
  if (!encontrado) {
    throw new AppError(404, 'Atleta não encontrado');
  }
  const atleta = await garantirCategoriaAtualizada(encontrado);

  const itens = await calcularIntensidadesAtleta(atleta.id);
  const resumo = calcularResumoSemana(itens);

  res.json({
    atleta: { id: atleta.id, nome: atleta.usuario.nome, categoria: atleta.categoria },
    itens,
    resumo,
  });
});

tecnicoRouter.get('/atletas/:atletaId/resultados-competicao', async (req, res) => {
  const encontrado = await prisma.atleta.findUnique({
    where: { id: req.params.atletaId },
    include: { usuario: { select: { nome: true } } },
  });
  if (!encontrado) {
    throw new AppError(404, 'Atleta não encontrado');
  }
  const atleta = await garantirCategoriaAtualizada(encontrado);

  const resultados = await prisma.resultadoCompeticao.findMany({
    where: { atletaId: atleta.id },
    include: { competicao: true },
    orderBy: [{ competicao: { data: 'desc' } }, { criadoEm: 'desc' }],
  });

  res.json({
    atleta: { id: atleta.id, nome: atleta.usuario.nome, categoria: atleta.categoria },
    resultados,
  });
});

tecnicoRouter.get('/atletas/:atletaId/melhores-marcas', async (req, res) => {
  const encontrado = await prisma.atleta.findUnique({
    where: { id: req.params.atletaId },
    include: { usuario: { select: { nome: true } } },
  });
  if (!encontrado) {
    throw new AppError(404, 'Atleta não encontrado');
  }
  const atleta = await garantirCategoriaAtualizada(encontrado);

  const marcas = await prisma.melhorMarca.findMany({
    where: { atletaId: atleta.id },
    orderBy: [{ estilo: 'asc' }, { distancia: 'asc' }, { piscina: 'asc' }],
  });

  res.json({
    atleta: { id: atleta.id, nome: atleta.usuario.nome, categoria: atleta.categoria },
    marcas,
  });
});

tecnicoRouter.get('/atletas/:atletaId/tabela-referencia', async (req, res) => {
  const encontrado = await prisma.atleta.findUnique({
    where: { id: req.params.atletaId },
    include: { usuario: { select: { nome: true } } },
  });
  if (!encontrado) {
    throw new AppError(404, 'Atleta não encontrado');
  }
  const atleta = await garantirCategoriaAtualizada(encontrado);

  const [provasPrincipais, melhoresMarcas] = await Promise.all([
    prisma.provaPrincipal.findMany({ where: { atletaId: atleta.id }, orderBy: { ordem: 'asc' } }),
    prisma.melhorMarca.findMany({ where: { atletaId: atleta.id } }),
  ]);

  const { m25, m50 } = montarTabelaReferencia(provasPrincipais, melhoresMarcas);

  res.json({
    atleta: { id: atleta.id, nome: atleta.usuario.nome, categoria: atleta.categoria },
    m25,
    m50,
  });
});

tecnicoRouter.get('/frequencia', async (req, res) => {
  const { categoria, periodo } = req.query;

  if (typeof categoria !== 'string' || !Object.values(Categoria).includes(categoria as Categoria)) {
    throw new AppError(400, 'Informe uma categoria válida');
  }

  const periodoTipo: PeriodoFrequencia = periodo === 'semana' ? 'semana' : 'mes';

  const resultado = await calcularFrequenciaGrupo(categoria as Categoria, periodoTipo);

  res.json({ categoria: categoria as Categoria, periodoTipo, ...resultado });
});

const marcarPresencaSchema = z.object({
  atletaId: z.string({ error: 'Atleta é obrigatório' }).min(1),
  treinoId: z.string({ error: 'Treino é obrigatório' }).min(1),
  presente: z.boolean({ error: 'Informe se o atleta esteve presente' }),
});

tecnicoRouter.post('/presencas', async (req, res) => {
  const parsed = marcarPresencaSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }
  const { atletaId, treinoId, presente } = parsed.data;

  const [atleta, treino] = await Promise.all([
    prisma.atleta.findUnique({ where: { id: atletaId } }),
    prisma.treino.findUnique({ where: { id: treinoId } }),
  ]);
  if (!atleta) {
    throw new AppError(404, 'Atleta não encontrado');
  }
  if (!treino) {
    throw new AppError(404, 'Treino não encontrado');
  }

  const presenca = await prisma.presenca.upsert({
    where: { atletaId_treinoId: { atletaId, treinoId } },
    create: { atletaId, treinoId, presente, origem: OrigemPresenca.MANUAL },
    update: { presente, origem: OrigemPresenca.MANUAL },
  });

  res.status(201).json({ presenca });
});
