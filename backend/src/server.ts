import 'dotenv/config';

import { app } from './app';
import { manterBancoAtivo } from './lib/manter-banco-ativo';

const port = Number(process.env.PORT) || 3333;

// '0.0.0.0' explícito (não só a porta) — em produção (Prisma Compute) o
// servidor precisa aceitar conexões de qualquer interface de rede, não só
// loopback.
app.listen(port, '0.0.0.0', () => {
  console.log(`API rodando em http://localhost:${port}`);
  manterBancoAtivo();
});
