import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';

import { AppError } from './lib/errors';
import { atletaRouter } from './routes/atleta.routes';
import { authRouter } from './routes/auth.routes';
import { educativosRouter } from './routes/educativos.routes';
import { recordesRouter } from './routes/recordes.routes';
import { tecnicoRouter } from './routes/tecnico.routes';
import { treinosRouter } from './routes/treinos.routes';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRouter);
app.use('/treinos', treinosRouter);
app.use('/atleta', atletaRouter);
app.use('/tecnico', tecnicoRouter);
app.use('/recordes', recordesRouter);
app.use('/educativos', educativosRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.path}` });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});
