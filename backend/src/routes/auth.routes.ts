import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';

import { Sexo, TipoUsuario } from '../generated/prisma/enums';
import { Prisma } from '../generated/prisma/client';
import { calcularCategoria, garantirCategoriaAtualizada } from '../lib/categoria';
import { AppError } from '../lib/errors';
import { precisaRenovar, signToken } from '../lib/jwt';
import { authenticate } from '../middleware/auth';
import { prisma } from '../prisma';

export const authRouter = Router();

const baseCadastro = {
  nome: z.string({ error: 'Nome é obrigatório' }).trim().min(1, 'Nome é obrigatório'),
  email: z.string({ error: 'E-mail é obrigatório' }).trim().toLowerCase().email('E-mail inválido'),
  senha: z
    .string({ error: 'Senha é obrigatória' })
    .min(6, 'Senha deve ter ao menos 6 caracteres'),
};

const cadastroSchema = z.discriminatedUnion('tipo', [
  z.object({
    ...baseCadastro,
    tipo: z.literal(TipoUsuario.ATLETA),
    dataNascimento: z.coerce.date({ error: 'Data de nascimento é obrigatória' }),
    sexo: z.enum(Sexo, { error: 'Sexo é obrigatório' }),
  }),
  z.object({
    ...baseCadastro,
    tipo: z.literal(TipoUsuario.TECNICO),
    codigoConvite: z
      .string({ error: 'Código de convite é obrigatório' })
      .trim()
      .min(1, 'Código de convite é obrigatório'),
  }),
]);

const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8p6xDVKgVXR3lQGyKQVvFn8m1O.5N.';

const loginSchema = z.object({
  email: z.string({ error: 'E-mail é obrigatório' }).trim().toLowerCase().email('E-mail inválido'),
  senha: z.string({ error: 'Senha é obrigatória' }).min(1, 'Senha é obrigatória'),
});

function usuarioPublico(usuario: {
  id: string;
  nome: string;
  email: string;
  tipo: TipoUsuario;
  tecnico?: { admin: boolean } | null;
}) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    tipo: usuario.tipo,
    // Só um técnico marcado como admin direto no banco tem isso true — não
    // existe caminho de cadastro/edição de perfil que ligue essa flag.
    admin: usuario.tecnico?.admin ?? false,
  };
}

authRouter.post('/cadastro', async (req, res) => {
  const parsed = cadastroSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }
  const dados = parsed.data;

  if (dados.tipo === TipoUsuario.TECNICO) {
    const codigoValido = process.env.TECNICO_INVITE_CODE;
    if (!codigoValido || dados.codigoConvite !== codigoValido) {
      throw new AppError(403, 'Código de convite inválido');
    }
  }

  const senhaHash = await bcrypt.hash(dados.senha, 10);

  try {
    const usuario = await prisma.usuario.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        senha: senhaHash,
        tipo: dados.tipo,
        ...(dados.tipo === TipoUsuario.ATLETA
          ? {
              atleta: {
                create: {
                  categoria: calcularCategoria(dados.dataNascimento),
                  dataNascimento: dados.dataNascimento,
                  sexo: dados.sexo,
                },
              },
            }
          : { tecnico: { create: {} } }),
      },
      include: { tecnico: true },
    });

    const token = signToken({ sub: usuario.id, tipo: usuario.tipo });
    res.status(201).json({ token, usuario: usuarioPublico(usuario) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'E-mail já cadastrado');
    }
    throw error;
  }
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }
  const { email, senha } = parsed.data;

  const usuario = await prisma.usuario.findUnique({ where: { email }, include: { tecnico: true } });
  // Compara contra um hash "dummy" mesmo quando o e-mail não existe, para não
  // vazar por tempo de resposta se o e-mail está cadastrado.
  const senhaConfere = await bcrypt.compare(senha, usuario?.senha ?? DUMMY_HASH);

  if (!usuario || !senhaConfere) {
    throw new AppError(401, 'E-mail ou senha inválidos');
  }

  const token = signToken({ sub: usuario.id, tipo: usuario.tipo });
  res.json({ token, usuario: usuarioPublico(usuario) });
});

authRouter.get('/me', authenticate, async (req, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.usuario!.id },
    include: {
      atleta: { include: { provasPrincipais: { orderBy: { ordem: 'asc' } } } },
      tecnico: true,
    },
  });

  if (!usuario) {
    throw new AppError(401, 'Usuário não encontrado');
  }

  const atleta = usuario.atleta ? await garantirCategoriaAtualizada(usuario.atleta) : null;

  // O app chama esta rota toda vez que abre. Aproveitamos pra renovar a
  // sessão de quem está ativo: passada a metade da validade, devolvemos um
  // token novo e o app troca o guardado (ver auth-context.tsx). Sem isso,
  // todo mundo era deslogado de uma vez quando o prazo vencia.
  const tokenRenovado = precisaRenovar(req.tokenPayload ?? {})
    ? signToken({ sub: usuario.id, tipo: usuario.tipo })
    : undefined;

  res.json({
    usuario: { ...usuarioPublico(usuario), atleta, tecnico: usuario.tecnico },
    ...(tokenRenovado ? { token: tokenRenovado } : {}),
  });
});

const atualizarPerfilBase = {
  nome: z.string({ error: 'Nome é obrigatório' }).trim().min(1, 'Nome é obrigatório'),
  email: z.string({ error: 'E-mail é obrigatório' }).trim().toLowerCase().email('E-mail inválido'),
};

const atualizarPerfilAtletaSchema = z.object({
  ...atualizarPerfilBase,
  dataNascimento: z.coerce.date({ error: 'Data de nascimento é obrigatória' }),
  sexo: z.enum(Sexo, { error: 'Sexo é obrigatório' }),
});

const atualizarPerfilTecnicoSchema = z.object(atualizarPerfilBase);

// Técnico só edita nome/e-mail; atleta também edita data de nascimento (o
// schema usado depende do tipo do usuário autenticado, não do que vem no
// corpo da requisição). Categoria nunca vem do cliente — é sempre
// recalculada a partir da data de nascimento (ver lib/categoria.ts).
authRouter.put('/me', authenticate, async (req, res) => {
  const ehAtleta = req.usuario!.tipo === TipoUsuario.ATLETA;

  const parsedAtleta = ehAtleta ? atualizarPerfilAtletaSchema.safeParse(req.body) : null;
  const parsedTecnico = !ehAtleta ? atualizarPerfilTecnicoSchema.safeParse(req.body) : null;
  const parsed = parsedAtleta ?? parsedTecnico!;
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }

  try {
    const usuario = await prisma.usuario.update({
      where: { id: req.usuario!.id },
      data: {
        nome: parsed.data.nome,
        email: parsed.data.email,
        ...(parsedAtleta?.success
          ? {
              atleta: {
                update: {
                  categoria: calcularCategoria(parsedAtleta.data.dataNascimento),
                  dataNascimento: parsedAtleta.data.dataNascimento,
                  sexo: parsedAtleta.data.sexo,
                },
              },
            }
          : {}),
      },
      include: { atleta: true, tecnico: true },
    });

    res.json({ usuario: { ...usuarioPublico(usuario), atleta: usuario.atleta, tecnico: usuario.tecnico } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'E-mail já cadastrado');
    }
    throw error;
  }
});

const alterarSenhaSchema = z.object({
  senhaAtual: z.string({ error: 'Senha atual é obrigatória' }).min(1, 'Senha atual é obrigatória'),
  novaSenha: z.string({ error: 'Nova senha é obrigatória' }).min(6, 'Nova senha deve ter ao menos 6 caracteres'),
});

authRouter.put('/senha', authenticate, async (req, res) => {
  const parsed = alterarSenhaSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues[0]?.message ?? 'Dados inválidos');
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.id } });
  if (!usuario) {
    throw new AppError(401, 'Usuário não encontrado');
  }

  const senhaConfere = await bcrypt.compare(parsed.data.senhaAtual, usuario.senha);
  if (!senhaConfere) {
    throw new AppError(400, 'Senha atual incorreta');
  }

  const novoHash = await bcrypt.hash(parsed.data.novaSenha, 10);
  await prisma.usuario.update({ where: { id: usuario.id }, data: { senha: novoHash } });

  res.status(204).send();
});
