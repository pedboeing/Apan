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
    // Os limites precisam caber o despertar do banco suspenso, medido em
    // ~16s em produção — com os 15s antigos a primeira requisição depois de
    // um período ocioso falhava por pouco. O manter-banco-ativo.ts torna
    // isso raro; esta folga é a rede de segurança pra quando acontecer
    // mesmo assim (logo depois de um deploy, por exemplo). Tem que ficar
    // abaixo do TIMEOUT_MS do app (mobile/src/lib/api.ts), senão o cliente
    // desiste antes e o usuário vê erro de conexão em vez da resposta.
    connectionTimeoutMillis: 20_000, // tempo máx. pra abrir uma conexão nova
    statement_timeout: 25_000, // tempo máx. pra uma query individual rodar
    query_timeout: 25_000, // mesma ideia, aplicada do lado do driver `pg`
    idleTimeoutMillis: 30_000, // fecha conexões ociosas, evita acumular conexão morta no pool
    max: 10, // limite de conexões simultâneas por instância do servidor
  },
  {
    onPoolError: (err: Error) => console.error('[prisma] erro no pool de conexões:', err),
    onConnectionError: (err: Error) => console.error('[prisma] erro numa conexão:', err),
  },
);

export const prisma = new PrismaClient({ adapter });
