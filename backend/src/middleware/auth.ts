import type { NextFunction, Request, Response } from 'express';

import { TipoUsuario } from '../generated/prisma/enums';
import { AppError } from '../lib/errors';
import { verifyToken } from '../lib/jwt';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    throw new AppError(401, 'Token não fornecido');
  }

  try {
    const payload = verifyToken(token);
    req.usuario = { id: payload.sub, tipo: payload.tipo };
    req.tokenPayload = { iat: payload.iat, exp: payload.exp };
    next();
  } catch {
    throw new AppError(401, 'Token inválido ou expirado');
  }
}

export function requireTipo(tipo: TipoUsuario) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.usuario?.tipo !== tipo) {
      throw new AppError(403, 'Acesso negado para esse perfil');
    }
    next();
  };
}
