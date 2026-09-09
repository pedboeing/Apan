import { defineComputeConfig } from '@prisma/compute-sdk/config';

// API Express "pura" (não é nenhum dos frameworks com detecção automática),
// então usamos framework "custom": compila com o mesmo `npm run build` já
// usado localmente e aponta pro entrypoint compilado.
export default defineComputeConfig({
  app: {
    name: 'apan-api',
    framework: 'custom',
    // Sem isso o Compute assume a porta padrão (3000) pro roteamento
    // externo, enquanto o server.ts escuta em process.env.PORT (caindo pra
    // 3333 se não vier nada) — o app sobe normalmente, mas o ingress não
    // encontra ninguém na porta que ele esperava.
    httpPort: 3333,
    build: {
      command: 'npm run build',
      outputDirectory: 'dist',
      entrypoint: 'server.js',
    },
  },
});
