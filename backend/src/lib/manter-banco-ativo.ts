import { prisma } from '../prisma';

// O Prisma Postgres suspende o banco depois de um tempo sem uso, e acordá-lo
// leva ~16s — mais que o query_timeout do adapter. Resultado: a primeira
// pessoa a abrir o app depois de um período parado tomava erro, enquanto
// todas as seguintes eram atendidas em meio segundo. Nos logs isso aparecia
// como "Query read timeout" vindo do pg-pool.
//
// Um SELECT leve de tempos em tempos mantém o banco de pé e faz esse caso
// deixar de existir enquanto o servidor estiver rodando.
//
// 60s é folgado sem ser custoso: medindo em produção, 40s parado ainda
// respondia quente (0,74s), e a suspensão só apareceu depois de vários
// minutos de silêncio.
const INTERVALO_MS = 60_000;

export function manterBancoAtivo(): NodeJS.Timeout {
  const timer = setInterval(() => {
    // Falhar aqui não pode derrubar o servidor nem virar ruído: a próxima
    // requisição de verdade tenta de novo por conta própria.
    void prisma.$queryRaw`SELECT 1`.catch((erro: unknown) => {
      console.error('[banco] ping de manutenção falhou:', erro instanceof Error ? erro.message : erro);
    });
  }, INTERVALO_MS);

  // Sem unref o timer segura o processo vivo e atrapalha um encerramento
  // limpo (o Node fica esperando o próximo tick pra poder sair).
  timer.unref();
  return timer;
}
