import { Router } from 'express';
import { z } from 'zod';

import { Categoria, EstiloNado, Sexo, TamanhoPiscina, TipoUsuario } from '../generated/prisma/enums';
import { parseCsv } from '../lib/csv';
import { AppError } from '../lib/errors';
import { agruparRecordesAtuais, buscarRecordesAtuais } from '../lib/recordes';
import { parseTempo } from '../lib/tempo';
import { authenticate, requireTipo } from '../middleware/auth';
import { prisma } from '../prisma';

export const recordesRouter = Router();

recordesRouter.use(authenticate);

function parseFiltros(query: Record<string, unknown>) {
  const { estilo, categoria, distancia, sexo, piscina } = query;

  if (estilo !== undefined && !Object.values(EstiloNado).includes(estilo as EstiloNado)) {
    throw new AppError(400, 'Estilo inválido');
  }
  if (categoria !== undefined && !Object.values(Categoria).includes(categoria as Categoria)) {
    throw new AppError(400, 'Categoria inválida');
  }
  if (sexo !== undefined && !Object.values(Sexo).includes(sexo as Sexo)) {
    throw new AppError(400, 'Sexo inválido');
  }
  if (piscina !== undefined && !Object.values(TamanhoPiscina).includes(piscina as TamanhoPiscina)) {
    throw new AppError(400, 'Piscina inválida');
  }
  const distanciaNum = distancia !== undefined ? Number(distancia) : undefined;
  if (distanciaNum !== undefined && (!Number.isInteger(distanciaNum) || distanciaNum <= 0)) {
    throw new AppError(400, 'Distância inválida');
  }

  return {
    estilo: estilo as EstiloNado | undefined,
    categoria: categoria as Categoria | undefined,
    distancia: distanciaNum,
    sexo: sexo as Sexo | undefined,
    piscina: piscina as TamanhoPiscina | undefined,
  };
}

// Recordes da APAN é uma vitrine pública dentro do app — técnico e atleta
// veem a mesma lista (o recorde atual de cada prova/categoria).
recordesRouter.get('/', async (req, res) => {
  const filtros = parseFiltros(req.query as Record<string, unknown>);
  const recordes = await buscarRecordesAtuais(filtros);
  res.json({ recordes });
});

recordesRouter.use(requireTipo(TipoUsuario.TECNICO));

// Lista completa (histórico bruto), usada na tela de gerenciamento do
// técnico para editar/excluir entradas específicas.
recordesRouter.get('/historico', async (req, res) => {
  const filtros = parseFiltros(req.query as Record<string, unknown>);
  const registros = await prisma.recordeInterno.findMany({
    where: {
      estilo: filtros.estilo,
      categoria: filtros.categoria,
      distancia: filtros.distancia,
      sexo: filtros.sexo,
      piscina: filtros.piscina,
    },
    orderBy: [{ estilo: 'asc' }, { distancia: 'asc' }, { categoria: 'asc' }, { tempoCentesimos: 'asc' }],
  });
  const atuais = new Set(agruparRecordesAtuais(registros).map((r) => r.id));
  res.json({ recordes: registros.map((r) => ({ ...r, atual: atuais.has(r.id) })) });
});

recordesRouter.get('/:id', async (req, res) => {
  const recorde = await prisma.recordeInterno.findUnique({ where: { id: req.params.id } });
  if (!recorde) {
    throw new AppError(404, 'Recorde não encontrado');
  }
  res.json({ recorde });
});

const recordeSchema = z.object({
  estilo: z.enum(EstiloNado, { error: 'Estilo é obrigatório' }),
  distancia: z.coerce.number({ error: 'Distância é obrigatória' }).int().positive('Distância deve ser maior que zero'),
  categoria: z.enum(Categoria, { error: 'Categoria é obrigatória' }),
  sexo: z.enum(Sexo, { error: 'Sexo é obrigatório' }),
  piscina: z.enum(TamanhoPiscina, { error: 'Piscina é obrigatória' }),
  tempoCentesimos: z.coerce
    .number({ error: 'Tempo é obrigatório' })
    .int()
    .positive('Tempo deve ser maior que zero'),
  nomeAtleta: z.string({ error: 'Nome do atleta é obrigatório' }).trim().min(1, 'Nome do atleta é obrigatório'),
  data: z.coerce.date({ error: 'Data é obrigatória' }),
});

recordesRouter.post('/', async (req, res) => {
  const parsed = recordeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }

  const recorde = await prisma.recordeInterno.create({ data: parsed.data });
  res.status(201).json({ recorde });
});

recordesRouter.put('/:id', async (req, res) => {
  const parsed = recordeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }

  const existente = await prisma.recordeInterno.findUnique({ where: { id: req.params.id } });
  if (!existente) {
    throw new AppError(404, 'Recorde não encontrado');
  }

  const recorde = await prisma.recordeInterno.update({ where: { id: req.params.id }, data: parsed.data });
  res.json({ recorde });
});

recordesRouter.delete('/:id', async (req, res) => {
  const existente = await prisma.recordeInterno.findUnique({ where: { id: req.params.id } });
  if (!existente) {
    throw new AppError(404, 'Recorde não encontrado');
  }

  await prisma.recordeInterno.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

const CABECALHO_ESPERADO = ['estilo', 'distancia', 'categoria', 'sexo', 'piscina', 'tempo', 'nomeatleta', 'data'];

// Aceita algumas variações comuns de planilha ("F"/"Feminino", "25"/"25m")
// além dos nomes exatos do enum, já que quem preenche a planilha
// provavelmente não conhece os valores internos do sistema.
function parseSexoPlanilha(texto: string): Sexo | null {
  const t = texto.trim().toUpperCase();
  if (t === 'MASCULINO' || t === 'M') return Sexo.MASCULINO;
  if (t === 'FEMININO' || t === 'F') return Sexo.FEMININO;
  return null;
}

function parsePiscinaPlanilha(texto: string): TamanhoPiscina | null {
  const t = texto.trim().toUpperCase().replace(/\s/g, '');
  if (t === 'M25' || t === '25' || t === '25M') return TamanhoPiscina.M25;
  if (t === 'M50' || t === '50' || t === '50M') return TamanhoPiscina.M50;
  return null;
}

// Aceita a categoria como o nome do enum ("INFANTIL_1") ou como escrita
// numa planilha ("Infantil 1", "Infantil I", "infantil1", "Júnior II",
// "Pré-Mirim"): remove acentos, normaliza traço/espaço e converte
// numeral romano (I/II) pro arábico equivalente antes de comparar.
function parseCategoriaPlanilha(texto: string): Categoria | null {
  let t = texto
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  t = t.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  t = t.replace(/([A-Z])(\d)/, '$1 $2');
  t = t.replace(/\bII$/, '2').replace(/\bI$/, '1');
  t = t.replace(/\s+/g, '_');
  return Object.values(Categoria).includes(t as Categoria) ? (t as Categoria) : null;
}

// new Date(Date.UTC(...)) normaliza silenciosamente valores fora do intervalo
// (mês 13 vira janeiro do ano seguinte, dia 31 num mês de 30 dias avança pro
// próximo mês) em vez de rejeitar — por isso conferimos se os componentes da
// data resultante batem com o que foi digitado.
function construirData(ano: number, mes: number, dia: number): Date | null {
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) {
    return null;
  }
  return d;
}

function parseDataPlanilha(texto: string): Date | null {
  const t = texto.trim();

  const br = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) {
    const [, dia, mes, ano] = br;
    return construirData(Number(ano), Number(mes), Number(dia));
  }

  const iso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const [, ano, mes, dia] = iso;
    return construirData(Number(ano), Number(mes), Number(dia));
  }

  return null;
}

const importarSchema = z.object({
  csv: z.string({ error: 'Envie o conteúdo do CSV' }).min(1, 'Arquivo CSV vazio'),
});

// Importação em lote via CSV, para o levantamento histórico de recordes
// (colunas: estilo,distancia,categoria,sexo,piscina,tempo,nomeAtleta,data).
// Linhas inválidas são reportadas, mas não impedem a importação das demais.
recordesRouter.post('/importar', async (req, res) => {
  const parsed = importarSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }

  const linhas = parseCsv(parsed.data.csv);
  if (linhas.length < 2) {
    throw new AppError(400, 'CSV vazio ou sem linhas de dados');
  }

  const cabecalho = linhas[0].map((c) => c.trim().toLowerCase());
  const indices = CABECALHO_ESPERADO.map((col) => cabecalho.indexOf(col));
  if (indices.some((i) => i === -1)) {
    throw new AppError(
      400,
      'Cabeçalho do CSV deve conter as colunas: estilo,distancia,categoria,sexo,piscina,tempo,nomeAtleta,data',
    );
  }
  const [iEstilo, iDistancia, iCategoria, iSexo, iPiscina, iTempo, iNome, iData] = indices;

  const validos: {
    estilo: EstiloNado;
    distancia: number;
    categoria: Categoria;
    sexo: Sexo;
    piscina: TamanhoPiscina;
    tempoCentesimos: number;
    nomeAtleta: string;
    data: Date;
  }[] = [];
  const erros: string[] = [];

  for (let linhaIdx = 1; linhaIdx < linhas.length; linhaIdx++) {
    const numeroLinha = linhaIdx + 1;
    const colunas = linhas[linhaIdx];

    const estilo = colunas[iEstilo]?.trim().toUpperCase();
    const distancia = Number(colunas[iDistancia]?.trim());
    const categoria = parseCategoriaPlanilha(colunas[iCategoria] ?? '');
    const sexo = parseSexoPlanilha(colunas[iSexo] ?? '');
    const piscina = parsePiscinaPlanilha(colunas[iPiscina] ?? '');
    const tempoCentesimos = parseTempo(colunas[iTempo] ?? '');
    const nomeAtleta = colunas[iNome]?.trim();
    const data = parseDataPlanilha(colunas[iData] ?? '');

    if (!estilo || !Object.values(EstiloNado).includes(estilo as EstiloNado)) {
      erros.push(`Linha ${numeroLinha}: estilo inválido ("${colunas[iEstilo] ?? ''}")`);
      continue;
    }
    if (!Number.isInteger(distancia) || distancia <= 0) {
      erros.push(`Linha ${numeroLinha}: distância inválida ("${colunas[iDistancia] ?? ''}")`);
      continue;
    }
    if (!categoria) {
      erros.push(`Linha ${numeroLinha}: categoria inválida ("${colunas[iCategoria] ?? ''}")`);
      continue;
    }
    if (!sexo) {
      erros.push(`Linha ${numeroLinha}: sexo inválido ("${colunas[iSexo] ?? ''}"). Use Masculino ou Feminino.`);
      continue;
    }
    if (!piscina) {
      erros.push(`Linha ${numeroLinha}: piscina inválida ("${colunas[iPiscina] ?? ''}"). Use 25 ou 50.`);
      continue;
    }
    if (tempoCentesimos === null) {
      erros.push(`Linha ${numeroLinha}: tempo inválido ("${colunas[iTempo] ?? ''}")`);
      continue;
    }
    if (!nomeAtleta) {
      erros.push(`Linha ${numeroLinha}: nome do atleta é obrigatório`);
      continue;
    }
    if (!data) {
      erros.push(`Linha ${numeroLinha}: data inválida ("${colunas[iData] ?? ''}"). Use dd/mm/aaaa.`);
      continue;
    }

    validos.push({
      estilo: estilo as EstiloNado,
      distancia,
      categoria: categoria as Categoria,
      sexo,
      piscina,
      tempoCentesimos,
      nomeAtleta,
      data,
    });
  }

  if (validos.length > 0) {
    await prisma.recordeInterno.createMany({ data: validos });
  }

  res.status(201).json({ criados: validos.length, ignorados: erros.length, erros });
});
