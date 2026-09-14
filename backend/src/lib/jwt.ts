import jwt from 'jsonwebtoken';

import type { TipoUsuario } from '../generated/prisma/enums';

export type JwtPayload = {
  sub: string;
  tipo: TipoUsuario;
};

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET não configurado no .env');
  }
  return secret;
}

export function signToken(payload: JwtPayload): string {
  const expiresIn = process.env.JWT_EXPIRES_IN ?? '30d';
  return jwt.sign(payload, getSecret(), { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
}

// O que a verificação devolve de fato: o nosso payload mais os campos de
// tempo padrão do JWT (em segundos), que são o que permite decidir renovação.
export type JwtPayloadVerificado = JwtPayload & { iat?: number; exp?: number };

export function verifyToken(token: string): JwtPayloadVerificado {
  return jwt.verify(token, getSecret()) as JwtPayloadVerificado;
}

// Sessão rolante: passada a metade da validade, vale entregar um token novo
// em vez de esperar o antigo vencer e obrigar login outra vez. Quem usa o
// app de vez em quando nunca mais é deslogado; quem some por mais tempo que
// a validade inteira continua tendo que entrar de novo, que é o correto.
export function precisaRenovar(payload: { iat?: number; exp?: number }, agora = Date.now()): boolean {
  if (!payload.iat || !payload.exp) return false;
  const metadeDaVida = payload.iat + (payload.exp - payload.iat) / 2;
  return agora / 1000 >= metadeDaVida;
}
