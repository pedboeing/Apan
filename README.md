# APAN — App de Gestão de Treinos

App mobile para a APAN (equipe de natação) centralizar planejamento de
treinos, registro de desempenho e evolução esportiva dos atletas em uma base
de dados única, compartilhada entre dois perfis de acesso:

- **Técnico** — monta e padroniza os treinos, acompanha o desempenho dos atletas.
- **Atleta** — registra o próprio desempenho (tempos, PSE) e acompanha sua evolução.

Cada perfil tem navegação e telas próprias no app, mas compartilha o mesmo
backend e banco de dados.

> Fase 1 do lançamento é restrita às categorias juvenil e acima, rodando via
> **Expo Go** (sem build nativo ainda).

## Estrutura de pastas

```
Apan/
├── mobile/                  App Expo (React Native + TypeScript + Expo Router)
│   └── src/
│       ├── app/             Telas e navegação (file-based routing)
│       │   ├── (auth)/      Login e cadastro (não logado)
│       │   ├── (tecnico)/   Tabs do técnico: Treinos, Atletas
│       │   └── (atleta)/    Tabs do atleta: Meu treino, Meu histórico
│       ├── context/         AuthProvider (sessão, login/cadastro/logout)
│       ├── lib/             Cliente da API e storage seguro (token)
│       └── components/      Componentes compartilhados
├── backend/                 API Node.js + Express + TypeScript
│   ├── prisma/
│   │   └── schema.prisma    Modelo do banco (Usuario, Atleta, Tecnico)
│   └── src/
│       ├── app.ts           Configuração do Express
│       ├── server.ts        Ponto de entrada da API
│       ├── prisma.ts        Cliente Prisma
│       ├── routes/          Rotas da API (auth.routes.ts)
│       ├── middleware/      Middlewares (autenticação/autorização)
│       └── lib/             JWT, hashing e erros compartilhados
└── docker-compose.yml       Postgres local para desenvolvimento
```

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20+
- PostgreSQL local — via **Docker** (se já tiver o Docker Desktop rodando
  com WSL2/Hyper-V configurado) ou instalado **nativamente no Windows**
  (mais simples, sem depender de virtualização)
- App **[Expo Go](https://expo.dev/go)** instalado no celular (Android/iOS)

## Rodando tudo localmente

### 1. Banco de dados (PostgreSQL)

**Opção A — Docker** (se o Docker Desktop já estiver funcionando):

```bash
docker compose up -d
```

Isso sobe um Postgres local em `localhost:5432` com usuário `apan`, senha
`apan` e banco `apan_dev` — já batendo com o `.env` de exemplo do backend.

**Opção B — PostgreSQL instalado nativamente** (usado neste projeto, já que
o Docker Desktop na máquina de desenvolvimento não tinha WSL2/Hyper-V
configurado):

1. Instale o PostgreSQL (ex: `winget install --id PostgreSQL.PostgreSQL.17`
   ou o instalador em https://www.postgresql.org/download/windows/). Ele
   sobe como serviço do Windows (`postgresql-x64-17`) já ouvindo em
   `localhost:5432`.
2. Crie o usuário e o banco usados pelo projeto (via `psql -U postgres` ou
   pgAdmin, que já vem junto):
   ```sql
   CREATE ROLE apan LOGIN PASSWORD 'apan' CREATEDB;
   CREATE DATABASE apan_dev OWNER apan;
   ```

Se preferir outro usuário/senha/porta, ajuste `backend/.env` com sua
própria `DATABASE_URL` em vez de seguir o padrão `apan`/`apan`/`apan_dev`
acima.

### 2. Backend (API)

```bash
cd backend
npm install
cp .env.example .env    # ajuste DATABASE_URL/PORT se necessário
npm run prisma:migrate  # cria as tabelas no banco a partir do schema.prisma
npm run dev              # inicia a API em http://localhost:3333
```

Scripts disponíveis em `backend/package.json`:

| Script                  | Descrição                                      |
| ----------------------- | ----------------------------------------------- |
| `npm run dev`           | API em modo desenvolvimento (reinicia sozinha) |
| `npm run build`         | Compila TypeScript para `dist/`                |
| `npm start`             | Roda o build de produção (`dist/server.js`)    |
| `npm run prisma:generate` | Gera o Prisma Client a partir do schema      |
| `npm run prisma:migrate` | Cria/atualiza as tabelas no banco (dev)        |
| `npm run prisma:studio`  | Abre o Prisma Studio para inspecionar os dados |

### 3. App mobile (Expo)

Em outro terminal:

```bash
cd mobile
npm install
npx expo start
```

O terminal vai mostrar um QR code:

- Abra o app **Expo Go** no celular e escaneie o QR code para rodar o app no
  seu aparelho (celular e computador precisam estar na mesma rede Wi-Fi).
- Ou pressione `w` no terminal para abrir no navegador.

> **Importante:** o app se conecta à API pela URL em `mobile/.env`
> (`EXPO_PUBLIC_API_URL`). O padrão é `http://localhost:3333`, que funciona
> no navegador e em emulador iOS. Testando em um **celular físico via Expo
> Go**, troque para o IP da sua máquina na rede local (ex:
> `http://192.168.0.10:3333`), já que "localhost" no celular aponta para o
> próprio celular. No emulador Android, use `http://10.0.2.2:3333`.

## Autenticação

- **Cadastro** (`POST /auth/cadastro`) — cria a conta como `ATLETA` (com
  `categoria` e `dataNascimento`) ou `TECNICO`. Cadastro de técnico exige um
  `codigoConvite` que precisa bater com `TECNICO_INVITE_CODE` no `.env` do
  backend — é uma trava simples para não deixar qualquer pessoa virar
  "técnico"; evoluir para convites individuais é um passo futuro.
- **Login** (`POST /auth/login`) — retorna um token JWT (`JWT_EXPIRES_IN`,
  30 dias por padrão) e os dados do usuário.
- **Sessão** (`GET /auth/me`, protegida) — retorna o usuário logado a partir
  do token (`Authorization: Bearer <token>`).
- No app, o token e os dados do usuário ficam salvos com `expo-secure-store`
  (armazenamento criptografado no dispositivo), então a sessão persiste
  entre aberturas do app — não precisa logar toda vez.
- Depois do login, o app leva o técnico para as abas **Treinos**/**Atletas**
  e o atleta para **Meu treino**/**Meu histórico** (ainda placeholders).

## Banco de dados

O schema inicial (`backend/prisma/schema.prisma`) define:

- **Usuario** — dados de login/conta, com `tipo` (`TECNICO` ou `ATLETA`)
  distinguindo o perfil de acesso.
- **Atleta** — dados adicionais do atleta (categoria: `PETIZ`, `MIRIM`,
  `INFANTIL`, `JUVENIL`, `JUNIOR`, `SENIOR`, data de nascimento), vinculado
  1:1 a um `Usuario`.
- **Tecnico** — dados adicionais do técnico, vinculado 1:1 a um `Usuario`.

As entidades de treino, desempenho e recordes serão adicionadas nas próximas
etapas.

## Variáveis de ambiente

O backend usa um arquivo `.env` (veja `backend/.env.example`):

```
DATABASE_URL="postgresql://apan:apan@localhost:5432/apan_dev?schema=public"
PORT=3333
JWT_SECRET="dev-secret-troque-em-producao"
JWT_EXPIRES_IN="30d"
TECNICO_INVITE_CODE="apan-tecnico-2026"
```

O app mobile usa `mobile/.env` (veja `mobile/.env.example`):

```
EXPO_PUBLIC_API_URL=http://localhost:3333
```

## Ambiente de produção (testes com a equipe)

Pra testar o app fora da sua rede local (ex: com atletas/técnicos mais
velhos da equipe), existe um ambiente hospedado separado do banco/API local
de desenvolvimento — nenhum dos dois se mistura.

- **Banco de dados:** Prisma Postgres, região `us-east-1`, projeto `apan`
  (workspace `wksp_cmsf5ow568nri0xgi8wrmmip1`, projeto
  `proj_uzbu946cnecvuomia5f8qwgh`). Console:
  https://console.prisma.io/wksp_cmsf5ow568nri0xgi8wrmmip1/proj_uzbu946cnecvuomia5f8qwgh
- **API:** Prisma Compute, app `apan-api`, URL pública fixa:
  `https://rqhlujs2xpigf5229hbzdwds.ewr.prisma.build`
- **Variáveis de ambiente de produção** (`JWT_SECRET`, `JWT_EXPIRES_IN`,
  `TECNICO_INVITE_CODE`, `DATABASE_URL`) ficam guardadas no próprio projeto
  Compute (`prisma-cli project env list --role production`), não em
  arquivo local — evita ficar espalhando segredo de produção em `.env`.

### Rodar as migrations em produção

Não é automático — depois de mexer no schema e criar uma migration
localmente (`npm run prisma:migrate`), aplique ela também em produção:

```bash
cd backend
DATABASE_URL="<direct connection string do console.prisma.io>" npx prisma migrate deploy
```

### Redeploy da API

```bash
cd backend
PRISMA_SERVICE_TOKEN="<seu token>" npx @prisma/cli@latest app deploy \
  --project proj_uzbu946cnecvuomia5f8qwgh --prod --yes --json --no-interactive
```

### App mobile publicado como site (web) — caminho principal pra testar

O jeito recomendado de testar hoje é a **versão web** do app (react-native-web),
publicada como um site comum — funciona em Android e iPhone, direto no
navegador, sem instalar nada e sem depender do seu computador ligado.

- **URL pública fixa:** https://pe8iazkjm0lnjms0c18oig2w.ewr.prisma.build/
- **App Compute:** `apan-web` (mesmo projeto `proj_uzbu946cnecvuomia5f8qwgh`
  da API/banco)
- **Página pra mandar pra equipe testar** (link + instruções, tem versão
  para imprimir também em `teste-apan.pdf` na raiz do repo):
  https://claude.ai/code/artifact/62ad1127-e9fe-4c37-afd7-05f8c793f0e8

Testador só precisa abrir o link no navegador do celular — dá pra "instalar"
como atalho na tela inicial (menu do navegador → "Adicionar à tela de
início"), o que faz abrir em tela cheia parecendo um app nativo.

**⚠️ Ao publicar uma atualização, sempre aponte pra API de produção** — o
`EXPO_PUBLIC_API_URL` fica "gravado" dentro do bundle no momento do build,
então rodar sem isso usa o `mobile/.env` local (seu IP de rede, que não
funciona pra quem não está na sua Wi-Fi):

```bash
cd mobile
EXPO_PUBLIC_API_URL="https://rqhlujs2xpigf5229hbzdwds.ewr.prisma.build" \
  PRISMA_SERVICE_TOKEN="<seu token>" npx @prisma/cli@latest app deploy \
  --project proj_uzbu946cnecvuomia5f8qwgh --app apan-web --prod --yes --json --no-interactive
```

Isso reconstrói e substitui o site na mesma URL — quem já tem o link salvo
não precisa de link novo, só recarregar a página.

### App mobile via Expo Go (alternativa, mais frágil)

Também existe uma publicação via **EAS Update** pro app rodar dentro do
**Expo Go**, sem precisar do `npx expo start` ligado — mas essa rota tem
duas fragilidades conhecidas que a versão web não tem:

1. `runtimeVersion` está fixado manualmente em `"exposdk:54.0.0"` (único
   formato que o Expo Go aceita). Quando o Expo Go atualizar de SDK no
   celular de alguém, ele passa a pedir `exposdk:<versão nova>` e essa
   branch para de servir update pra quem atualizou (erro 404 "no available
   update for the runtime") — precisa editar `mobile/app.json` e republicar.
2. Projetos novos no Expo têm vindo com visibilidade "privada" por padrão
   (erro 403 "this project requires authentication"), sem opção conhecida
   de destravar via CLI ou API — não confirmamos se dá pra resolver via
   dashboard (https://expo.dev/accounts/boeingp/projects/mobile/settings).

Por isso a versão web é o caminho recomendado por enquanto. Detalhes de
como republicar (caso quiera tentar de novo):

- **Branch:** `production` (branch ID `019fcecf-c123-7a66-a8c2-544c22775458`)
- **Link Expo Go:**
  `exp://u.expo.dev/40865961-155e-4c9a-82f1-044de707ea33/branch/019fcecf-c123-7a66-a8c2-544c22775458`

```bash
cd mobile
EXPO_PUBLIC_API_URL="https://rqhlujs2xpigf5229hbzdwds.ewr.prisma.build" \
  EXPO_TOKEN="<seu token>" npx eas-cli@latest update --branch production --message "descreva o que mudou"
```

### Testar o app mobile local contra a API de produção

Se você (dev) quiser rodar `npx expo start` normalmente mas testar contra o
banco/API de produção em vez do seu backend local, troque temporariamente
o `EXPO_PUBLIC_API_URL` do `mobile/.env` pelo valor de
`mobile/.env.production`.
