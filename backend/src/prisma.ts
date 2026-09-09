import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from './generated/prisma/client';

// Sem esses timeouts, uma conexão travada com o Postgres (rede instável,
// pool esgotado, banco reiniciando) deixa a query pendurada pra sempre — ela
// nunca resolve nem rejeita, então nem o handler de erro do Express entra em
// ação. Do lado do usuário isso aparece como "carregando para sempre", sem
// nenhuma mensagem de erro (só um F5 daria certo, e só às vezes).
const adapter = new PrismaPg(
  {
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10_000, // tempo máx. pra abrir uma conexão nova
    statement_timeout: 15_000, // tempo máx. pra uma query individual rodar
    query_timeout: 15_000, // mesma ideia, aplicada do lado do driver `pg`
    idleTimeoutMillis: 30_000, // fecha conexões ociosas, evita acumular conexão morta no pool
    max: 10, // limite de conexões simultâneas por instância do servidor
  },
  {
    onPoolError: (err: Error) => console.error('[prisma] erro no pool de conexões:', err),
    onConnectionError: (err: Error) => console.error('[prisma] erro numa conexão:', err),
  },
);

export const prisma = new PrismaClient({ adapter });
