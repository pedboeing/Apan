import { Router } from 'express';
import { z } from 'zod';

import {
  BlocoTreino,
  EstiloNado,
  Medalha,
  OrigemPresenca,
  QualidadeSono,
  TamanhoPiscina,
  TipoUsuario,
} from '../generated/prisma/enums';
import { Prisma } from '../generated/prisma/client';
import { calcularStatusAtleta, garantirAusenciasAutomaticasPorCategoria } from '../lib/ausencia';
import { garantirCategoriaAtualizada } from '../lib/categoria';
import { calcularFrequenciaAtleta } from '../lib/frequencia';
import { AppError } from '../lib/errors';
import { calcularIntensidadesAtleta, calcularResumoSemana } from '../lib/intensidade';
import { calcularMelhoresTempos, encontrarOuCriarCompeticao } from '../lib/resultados-competicao';
import { montarTabelaReferencia } from '../lib/zonas-treinamento';
import { authenticate, requireTipo } from '../middleware/auth';
import { prisma } from '../prisma';

export const atletaRouter = Router();

atletaRouter.use(authenticate, requireTipo(TipoUsuario.ATLETA));

// Toda rota do atleta passa por aqui, então é o ponto único pra garantir que
// a categoria usada no resto da requisição (ex: casar treinos do grupo)
// reflita a virada de ano, não só o que foi calculado da última vez que o
// perfil foi salvo.
async function getAtletaOuFalhar(usuarioId: string) {
  const atleta = await prisma.atleta.findUnique({ where: { usuarioId } });
  if (!atleta) {
    throw new AppError(403, 'Perfil de atleta não encontrado para este usuário');
  }
  return garantirCategoriaAtualizada(atleta);
}

// Junta o nome de quem criou (pro placeholder "Esperando Fulano liberar o
// treino") e some com o conteúdo — séries, PSE e tempos — enquanto o
// técnico não liberar. O treino continua aparecendo na lista do atleta
// normalmente (mesma data/categoria/objetivo de sempre), só o corpo real do
// treino é que fica escondido.
const incluirCriador = { tecnico: { select: { usuario: { select: { nome: true } } } } } as const;

function prepararTreinoParaAtleta<
  T extends {
    liberado: boolean;
    tecnico: { usuario: { nome: string } };
  },
>(treino: T, tempos: unknown[], pse: unknown | null, presencas: { presente: boolean }[]) {
  const { tecnico, ...resto } = treino;
  const criadoPorNome = tecnico.usuario.nome;
  const statusAtleta = calcularStatusAtleta(tempos, pse, presencas);

  if (!treino.liberado) {
    return {
      ...resto,
      criadoPorNome,
      statusAtleta,
      aquecimento: [] as string[],
      aquecimentoCronometrado: false,
      seriePreparatoria: [] as string[],
      seriePreparatoriaCronometrada: false,
      seriePrincipal: [] as string[],
      seriePrincipalCronometrada: false,
      soltura: [] as string[],
      solturaCronometrada: false,
      tempos: [],
      pse: null,
    };
  }

  return { ...resto, criadoPorNome, statusAtleta, tempos, pse };
}

function incluirRegistrosDoAtleta(atletaId: string) {
  return {
    registrosTempo: {
      where: { atletaId },
      orderBy: [{ bloco: 'asc' }, { ordem: 'asc' }] satisfies Prisma.RegistroTempoOrderByWithRelationInput[],
    },
    registrosPSE: { where: { atletaId } },
    presencas: { where: { atletaId } },
    ...incluirCriador,
  };
}

function prepararListaParaAtleta<
  T extends {
    registrosTempo: unknown[];
    registrosPSE: unknown[];
    presencas: { presente: boolean }[];
    liberado: boolean;
    tecnico: { usuario: { nome: string } };
  },
>(treinos: T[]) {
  return treinos.map(({ registrosTempo, registrosPSE, presencas, ...treino }) =>
    prepararTreinoParaAtleta(treino, registrosTempo, registrosPSE[0] ?? null, presencas),
  );
}

// Mostra o(s) treino(s) de HOJE (não importa o status) + qualquer treino de
// dias anteriores que ainda esteja pendente (o atleta não respondeu e ainda
// não passou das 48h) — assim nenhum treino recente passa despercebido só
// porque um novo foi criado por cima dele. Treino que já foi respondido ou
// que já virou "ausente" sai daqui e passa a aparecer só em "Meu histórico".
atletaRouter.get('/meu-treino', async (req, res) => {
  const atleta = await getAtletaOuFalhar(req.usuario!.id);
  await garantirAusenciasAutomaticasPorCategoria(atleta.categoria, atleta.id);

  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setUTCDate(hoje.getUTCDate() + 1);
  const limiteJanela = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const candidatos = await prisma.treino.findMany({
    where: {
      categorias: { has: atleta.categoria },
      data: { lt: amanha }, // nunca mostra treino com data futura
      OR: [{ data: { gte: hoje, lt: amanha } }, { criadoEm: { gte: limiteJanela } }],
    },
    include: incluirRegistrosDoAtleta(atleta.id),
    orderBy: { criadoEm: 'desc' },
  });

  let preparados = prepararListaParaAtleta(candidatos);
  preparados = preparados.filter((t) => (t.data >= hoje && t.data < amanha) || t.statusAtleta === 'PENDENTE');

  // Nada de hoje nem pendente: cai pro comportamento antigo (mostra o
  // treino mais recente que existir, seja qual for o status), só pra tela
  // não ficar vazia quando o grupo está sem nada em aberto.
  if (preparados.length === 0) {
    const maisRecente = await prisma.treino.findFirst({
      where: { categorias: { has: atleta.categoria } },
      orderBy: { data: 'desc' },
    });

    if (maisRecente) {
      const inicioDia = new Date(maisRecente.data);
      inicioDia.setUTCHours(0, 0, 0, 0);
      const fimDia = new Date(inicioDia);
      fimDia.setUTCDate(inicioDia.getUTCDate() + 1);

      const doDiaMaisRecente = await prisma.treino.findMany({
        where: { categorias: { has: atleta.categoria }, data: { gte: inicioDia, lt: fimDia } },
        include: incluirRegistrosDoAtleta(atleta.id),
        orderBy: { criadoEm: 'desc' },
      });
      preparados = prepararListaParaAtleta(doDiaMaisRecente);
    }
  }

  res.json({ treinos: preparados });
});

atletaRouter.get('/treinos/:id', async (req, res) => {
  const atleta = await getAtletaOuFalhar(req.usuario!.id);
  await garantirAusenciasAutomaticasPorCategoria(atleta.categoria, atleta.id);

  const treino = await prisma.treino.findUnique({
    where: { id: req.params.id },
    include: incluirRegistrosDoAtleta(atleta.id),
  });

  if (!treino) {
    throw new AppError(404, 'Treino não encontrado');
  }

  const [preparado] = prepararListaParaAtleta([treino]);
  res.json({ treino: preparado });
});

// Além do que o atleta já respondeu, também traz o que já virou "ausente"
// (48h sem resposta, ou "Não compareci") — assim o histórico fica completo,
// não só a parte boa.
atletaRouter.get('/meu-historico', async (req, res) => {
  const atleta = await getAtletaOuFalhar(req.usuario!.id);
  await garantirAusenciasAutomaticasPorCategoria(atleta.categoria, atleta.id);

  const treinos = await prisma.treino.findMany({
    where: {
      OR: [
        { registrosTempo: { some: { atletaId: atleta.id } } },
        { registrosPSE: { some: { atletaId: atleta.id } } },
        { presencas: { some: { atletaId: atleta.id, presente: false } } },
      ],
    },
    include: incluirRegistrosDoAtleta(atleta.id),
    orderBy: { data: 'desc' },
  });

  res.json({ treinos: prepararListaParaAtleta(treinos) });
});

atletaRouter.get('/minha-intensidade', async (req, res) => {
  const atleta = await getAtletaOuFalhar(req.usuario!.id);

  const itens = await calcularIntensidadesAtleta(atleta.id);
  const resumo = calcularResumoSemana(itens);

  res.json({ itens, resumo });
});

atletaRouter.get('/minha-frequencia', async (req, res) => {
  const atleta = await getAtletaOuFalhar(req.usuario!.id);

  const frequencia = await calcularFrequenciaAtleta(atleta.id, atleta.categoria, 'mes');

  res.json(frequencia);
});

const registroTempoSchema = z.object({
  treinoId: z.string({ error: 'Treino é obrigatório' }).min(1),
  bloco: z.enum(BlocoTreino, { error: 'Bloco é obrigatório' }),
  tiros: z
    .array(
      z.object({
        // Texto livre por escolha deliberada — não precisa ser um número
        // (ver comentário de RegistroTempo.distancia no schema).
        distancia: z.string({ error: 'Tiro é obrigatório' }).trim().min(1, 'Informe o tiro'),
        tempoCentesimos: z.coerce
          .number({ error: 'Tempo é obrigatório' })
          .int()
          .positive('Tempo deve ser maior que zero'),
        estilo: z.enum(EstiloNado).nullish(),
      }),
    )
    .min(1, 'Adicione ao menos um tiro'),
});

atletaRouter.post('/registros-tempo', async (req, res) => {
  const parsed = registroTempoSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }
  const { treinoId, bloco, tiros } = parsed.data;

  const atleta = await getAtletaOuFalhar(req.usuario!.id);

  const treino = await prisma.treino.findUnique({ where: { id: treinoId } });
  if (!treino) {
    throw new AppError(404, 'Treino não encontrado');
  }
  if (!treino.liberado) {
    throw new AppError(403, 'Este treino ainda não foi liberado pelo técnico');
  }

  const cronometradoPorBloco: Record<BlocoTreino, boolean> = {
    AQUECIMENTO: treino.aquecimentoCronometrado,
    SERIE_PREPARATORIA: treino.seriePreparatoriaCronometrada,
    SERIE_PRINCIPAL: treino.seriePrincipalCronometrada,
    SOLTURA: treino.solturaCronometrada,
  };
  if (!cronometradoPorBloco[bloco]) {
    throw new AppError(400, 'Este bloco não está marcado para anotar tempo');
  }

  const tempos = await prisma.$transaction(async (tx) => {
    await tx.registroTempo.deleteMany({ where: { atletaId: atleta.id, treinoId, bloco } });
    await tx.registroTempo.createMany({
      data: tiros.map((tiro, index) => ({
        atletaId: atleta.id,
        treinoId,
        bloco,
        distancia: tiro.distancia,
        tempoCentesimos: tiro.tempoCentesimos,
        estilo: tiro.estilo ?? null,
        ordem: index,
      })),
    });
    return tx.registroTempo.findMany({ where: { atletaId: atleta.id, treinoId, bloco }, orderBy: { ordem: 'asc' } });
  });

  res.status(201).json({ tempos });
});

const registroPSESchema = z.object({
  treinoId: z.string({ error: 'Treino é obrigatório' }).min(1),
  pse: z.coerce
    .number({ error: 'PSE é obrigatória' })
    .min(0, 'PSE deve ser entre 0 e 10')
    .max(10, 'PSE deve ser entre 0 e 10'),
  qualidadeSono: z.enum(QualidadeSono).nullish(),
});

atletaRouter.post('/registros-pse', async (req, res) => {
  const parsed = registroPSESchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }
  const { treinoId, pse, qualidadeSono } = parsed.data;

  const atleta = await getAtletaOuFalhar(req.usuario!.id);

  const treino = await prisma.treino.findUnique({ where: { id: treinoId } });
  if (!treino) {
    throw new AppError(404, 'Treino não encontrado');
  }
  if (!treino.liberado) {
    throw new AppError(403, 'Este treino ainda não foi liberado pelo técnico');
  }

  const registro = await prisma.registroPSE.upsert({
    where: { atletaId_treinoId: { atletaId: atleta.id, treinoId } },
    create: { atletaId: atleta.id, treinoId, pse, qualidadeSono: qualidadeSono ?? null },
    update: { pse, qualidadeSono: qualidadeSono ?? null },
  });

  // Presença é conveniência administrativa: nunca deve atrasar nem derrubar
  // o registro de PSE, que é o fluxo principal do atleta.
  try {
    await prisma.presenca.upsert({
      where: { atletaId_treinoId: { atletaId: atleta.id, treinoId } },
      create: { atletaId: atleta.id, treinoId, presente: true, origem: OrigemPresenca.AUTOMATICA },
      update: { presente: true, origem: OrigemPresenca.AUTOMATICA },
    });
  } catch (erro) {
    console.error('Falha ao marcar presença automática a partir da PSE:', erro);
  }

  res.status(201).json({ registro });
});

const naoCompareciSchema = z.object({
  treinoId: z.string({ error: 'Treino é obrigatório' }).min(1),
});

// O atleta declara a própria ausência num treino — mesmo status que a
// verificação automática de 48h chegaria sozinha (ver lib/ausencia.ts), só
// que na hora, sem precisar esperar o prazo passar. Não faz sentido marcar
// ausência de algo que já foi respondido, então isso é bloqueado.
atletaRouter.post('/nao-compareci', async (req, res) => {
  const parsed = naoCompareciSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }
  const { treinoId } = parsed.data;

  const atleta = await getAtletaOuFalhar(req.usuario!.id);

  const treino = await prisma.treino.findUnique({ where: { id: treinoId } });
  if (!treino) {
    throw new AppError(404, 'Treino não encontrado');
  }
  if (!treino.liberado) {
    throw new AppError(403, 'Este treino ainda não foi liberado pelo técnico');
  }

  const [temTempo, temPse] = await Promise.all([
    prisma.registroTempo.findFirst({ where: { atletaId: atleta.id, treinoId } }),
    prisma.registroPSE.findUnique({ where: { atletaId_treinoId: { atletaId: atleta.id, treinoId } } }),
  ]);
  if (temTempo || temPse) {
    throw new AppError(409, 'Você já registrou esse treino — não é possível marcar como ausente.');
  }

  const presenca = await prisma.presenca.upsert({
    where: { atletaId_treinoId: { atletaId: atleta.id, treinoId } },
    create: { atletaId: atleta.id, treinoId, presente: false, origem: OrigemPresenca.ATLETA },
    update: { presente: false, origem: OrigemPresenca.ATLETA },
  });

  res.status(201).json({ presenca });
});

const resultadoCompeticaoSchema = z.object({
  competicao: z.object({
    nome: z.string({ error: 'Nome da competição é obrigatório' }).trim().min(1, 'Nome da competição é obrigatório'),
    data: z.coerce.date({ error: 'Data da competição é obrigatória' }),
    local: z.string({ error: 'Local é obrigatório' }).trim().min(1, 'Local é obrigatório'),
  }),
  estilo: z.enum(EstiloNado, { error: 'Estilo é obrigatório' }),
  distancia: z.coerce.number({ error: 'Distância é obrigatória' }).int().positive('Distância deve ser maior que zero'),
  tempoCentesimos: z.coerce
    .number({ error: 'Tempo é obrigatório' })
    .int()
    .positive('Tempo deve ser maior que zero'),
  colocacao: z.coerce.number().int().positive('Colocação deve ser maior que zero').nullish(),
  medalha: z.enum(Medalha).nullish(),
});

atletaRouter.get('/resultados-competicao', async (req, res) => {
  const atleta = await getAtletaOuFalhar(req.usuario!.id);

  const resultados = await prisma.resultadoCompeticao.findMany({
    where: { atletaId: atleta.id },
    include: { competicao: true },
    orderBy: [{ competicao: { data: 'desc' } }, { criadoEm: 'desc' }],
  });

  res.json({ resultados });
});

atletaRouter.get('/meus-melhores-tempos', async (req, res) => {
  const atleta = await getAtletaOuFalhar(req.usuario!.id);

  const melhores = await calcularMelhoresTempos(atleta.id);

  res.json({ melhores });
});

atletaRouter.get('/resultados-competicao/:id', async (req, res) => {
  const atleta = await getAtletaOuFalhar(req.usuario!.id);

  const resultado = await prisma.resultadoCompeticao.findUnique({
    where: { id: req.params.id },
    include: { competicao: true },
  });
  if (!resultado || resultado.atletaId !== atleta.id) {
    throw new AppError(404, 'Resultado não encontrado');
  }

  res.json({ resultado });
});

atletaRouter.post('/resultados-competicao', async (req, res) => {
  const parsed = resultadoCompeticaoSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }
  const { competicao, ...dadosResultado } = parsed.data;

  const atleta = await getAtletaOuFalhar(req.usuario!.id);
  const comp = await encontrarOuCriarCompeticao(competicao.nome, competicao.data, competicao.local);

  const resultado = await prisma.resultadoCompeticao.create({
    data: { ...dadosResultado, atletaId: atleta.id, competicaoId: comp.id },
    include: { competicao: true },
  });

  res.status(201).json({ resultado });
});

async function getResultadoDoAtletaOuFalhar(id: string, atletaId: string) {
  const resultado = await prisma.resultadoCompeticao.findUnique({ where: { id } });
  if (!resultado || resultado.atletaId !== atletaId) {
    throw new AppError(404, 'Resultado não encontrado');
  }
  return resultado;
}

atletaRouter.put('/resultados-competicao/:id', async (req, res) => {
  const id = req.params.id as string;
  const parsed = resultadoCompeticaoSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }
  const { competicao, ...dadosResultado } = parsed.data;

  const atleta = await getAtletaOuFalhar(req.usuario!.id);
  await getResultadoDoAtletaOuFalhar(id, atleta.id);
  const comp = await encontrarOuCriarCompeticao(competicao.nome, competicao.data, competicao.local);

  const resultado = await prisma.resultadoCompeticao.update({
    where: { id },
    data: { ...dadosResultado, competicaoId: comp.id },
    include: { competicao: true },
  });

  res.json({ resultado });
});

atletaRouter.delete('/resultados-competicao/:id', async (req, res) => {
  const id = req.params.id as string;

  const atleta = await getAtletaOuFalhar(req.usuario!.id);
  await getResultadoDoAtletaOuFalhar(id, atleta.id);

  await prisma.resultadoCompeticao.delete({ where: { id } });
  res.status(204).send();
});

const melhorMarcaSchema = z.object({
  estilo: z.enum(EstiloNado, { error: 'Estilo é obrigatório' }),
  distancia: z.coerce.number({ error: 'Distância é obrigatória' }).int().positive('Distância deve ser maior que zero'),
  piscina: z.enum(TamanhoPiscina, { error: 'Piscina é obrigatória' }),
  tempoCentesimos: z.coerce
    .number({ error: 'Tempo é obrigatório' })
    .int()
    .positive('Tempo deve ser maior que zero'),
  data: z.coerce.date().nullish(),
});

atletaRouter.get('/melhores-marcas', async (req, res) => {
  const atleta = await getAtletaOuFalhar(req.usuario!.id);

  const marcas = await prisma.melhorMarca.findMany({
    where: { atletaId: atleta.id },
    orderBy: [{ estilo: 'asc' }, { distancia: 'asc' }, { piscina: 'asc' }],
  });

  res.json({ marcas });
});

atletaRouter.get('/melhores-marcas/:id', async (req, res) => {
  const atleta = await getAtletaOuFalhar(req.usuario!.id);

  const marca = await prisma.melhorMarca.findUnique({ where: { id: req.params.id } });
  if (!marca || marca.atletaId !== atleta.id) {
    throw new AppError(404, 'Marca não encontrada');
  }

  res.json({ marca });
});

atletaRouter.post('/melhores-marcas', async (req, res) => {
  const parsed = melhorMarcaSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }

  const atleta = await getAtletaOuFalhar(req.usuario!.id);

  try {
    const marca = await prisma.melhorMarca.create({
      data: { ...parsed.data, data: parsed.data.data ?? null, atletaId: atleta.id },
    });
    res.status(201).json({ marca });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'Você já tem uma marca cadastrada para essa prova e piscina — edite a existente.');
    }
    throw error;
  }
});

async function getMarcaDoAtletaOuFalhar(id: string, atletaId: string) {
  const marca = await prisma.melhorMarca.findUnique({ where: { id } });
  if (!marca || marca.atletaId !== atletaId) {
    throw new AppError(404, 'Marca não encontrada');
  }
  return marca;
}

atletaRouter.put('/melhores-marcas/:id', async (req, res) => {
  const id = req.params.id as string;
  const parsed = melhorMarcaSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }

  const atleta = await getAtletaOuFalhar(req.usuario!.id);
  await getMarcaDoAtletaOuFalhar(id, atleta.id);

  try {
    const marca = await prisma.melhorMarca.update({
      where: { id },
      data: { ...parsed.data, data: parsed.data.data ?? null },
    });
    res.json({ marca });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'Você já tem uma marca cadastrada para essa prova e piscina — edite a existente.');
    }
    throw error;
  }
});

atletaRouter.delete('/melhores-marcas/:id', async (req, res) => {
  const id = req.params.id as string;

  const atleta = await getAtletaOuFalhar(req.usuario!.id);
  await getMarcaDoAtletaOuFalhar(id, atleta.id);

  await prisma.melhorMarca.delete({ where: { id } });
  res.status(204).send();
});

const provasPrincipaisSchema = z.object({
  provas: z
    .array(
      z.object({
        estilo: z.enum(EstiloNado, { error: 'Estilo é obrigatório' }),
        distancia: z.coerce
          .number({ error: 'Distância é obrigatória' })
          .int()
          .positive('Distância deve ser maior que zero'),
      }),
    )
    .max(4, 'Escolha no máximo 4 provas principais'),
});

atletaRouter.get('/provas-principais', async (req, res) => {
  const atleta = await getAtletaOuFalhar(req.usuario!.id);

  const provas = await prisma.provaPrincipal.findMany({
    where: { atletaId: atleta.id },
    orderBy: { ordem: 'asc' },
  });

  res.json({ provas });
});

// Seleção sempre substituída por completo — o atleta não edita uma prova
// principal individualmente, ele escolhe a lista toda de novo (deleteMany +
// createMany numa transação evita ficar com estado parcial se der erro no
// meio, e a ordem enviada vira a ordem de exibição no perfil).
atletaRouter.put('/provas-principais', async (req, res) => {
  const parsed = provasPrincipaisSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }

  const chaves = parsed.data.provas.map((p) => `${p.estilo}|${p.distancia}`);
  if (new Set(chaves).size !== chaves.length) {
    throw new AppError(400, 'Você repetiu a mesma prova mais de uma vez');
  }

  const atleta = await getAtletaOuFalhar(req.usuario!.id);

  const provas = await prisma.$transaction(async (tx) => {
    await tx.provaPrincipal.deleteMany({ where: { atletaId: atleta.id } });
    if (parsed.data.provas.length > 0) {
      await tx.provaPrincipal.createMany({
        data: parsed.data.provas.map((p, index) => ({
          atletaId: atleta.id,
          estilo: p.estilo,
          distancia: p.distancia,
          ordem: index,
        })),
      });
    }
    return tx.provaPrincipal.findMany({ where: { atletaId: atleta.id }, orderBy: { ordem: 'asc' } });
  });

  res.json({ provas });
});

// Tabela de referência pessoal: zonas de treinamento calculadas a partir
// das provas principais do atleta + as melhores marcas que ele cadastrou.
atletaRouter.get('/tabela-referencia', async (req, res) => {
  const atleta = await getAtletaOuFalhar(req.usuario!.id);

  const [provasPrincipais, melhoresMarcas] = await Promise.all([
    prisma.provaPrincipal.findMany({ where: { atletaId: atleta.id }, orderBy: { ordem: 'asc' } }),
    prisma.melhorMarca.findMany({ where: { atletaId: atleta.id } }),
  ]);

  const { m25, m50 } = montarTabelaReferencia(provasPrincipais, melhoresMarcas);

  res.json({ m25, m50 });
});
