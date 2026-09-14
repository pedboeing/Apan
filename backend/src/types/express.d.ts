import type { TipoUsuario } from '../generated/prisma/enums';
import type { Tecnico } from '../generated/prisma/client';

declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: string;
        tipo: TipoUsuario;
      };
      tecnico?: Tecnico;
      // Campos de tempo do JWT apresentado na requisição (segundos).
      // Preenchido pelo authenticate, usado pelo GET /auth/me pra decidir
      // se devolve um token renovado.
      tokenPayload?: { iat?: number; exp?: number };
    }
  }
}

export {};
