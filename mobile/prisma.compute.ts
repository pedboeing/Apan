import { defineComputeConfig } from '@prisma/compute-sdk/config';

// Versão web do app (react-native-web via expo export), servida como site
// estático comum — assim qualquer pessoa acessa o app por um link, direto
// no navegador do celular ou computador, sem precisar de Expo Go nem de
// build nativo (Android/iOS).
export default defineComputeConfig({
  app: {
    name: 'apan-web',
    framework: 'custom',
    httpPort: 3000,
    build: {
      command: 'npm run export:web',
      outputDirectory: '.',
      entrypoint: 'web-server.js',
    },
  },
});
