// Servidor estático mínimo pro build web do Expo Router (pasta dist/,
// gerada por `npx expo export --platform web`). Usa o mesmo motor do
// pacote `serve` (serve-handler) — já resolve URLs "limpas" (/cadastro ->
// cadastro.html) e rotas dinâmicas do expo-router corretamente, então não
// precisamos reimplementar essa lógica na mão.
const http = require('http');
const path = require('path');
const handler = require('serve-handler');

const port = Number(process.env.PORT) || 3000;
// Caminho absoluto a partir de __dirname, não relativo ao cwd do processo —
// em produção (Prisma Compute) o processo pode ser iniciado de um
// diretório diferente de onde este arquivo realmente está.
const pastaPublica = path.join(__dirname, 'dist');

// Sem isso, o navegador guarda o HTML de cada rota e não confere se saiu
// uma versão nova — depois de um deploy, quem já tinha aberto o site (isso
// é especialmente agressivo no Safari/iOS, ainda mais quando "adicionado à
// tela de início") continua vendo a versão antiga até limpar o cache na
// mão. Os arquivos dentro de _expo/ e assets/ já têm um hash no próprio
// nome (ex: entry-a153cb01....js) — esses são seguros de guardar pra
// sempre, porque um deploy novo sempre gera um nome de arquivo novo, nunca
// reaproveita um arquivo velho por engano.
const cabecalhos = [
  { source: '**/*.html', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }] },
  { source: '_expo/**', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
  { source: 'assets/**', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
];

const server = http.createServer((req, res) => handler(req, res, { public: pastaPublica, headers: cabecalhos }));

server.listen(port, '0.0.0.0', () => {
  console.log(`Build web da APAN servido em http://localhost:${port}`);
});
