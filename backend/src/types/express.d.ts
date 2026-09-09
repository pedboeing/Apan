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
    }
  }
}

export {};
