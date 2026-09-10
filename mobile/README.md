# APAN — App (Expo)

App mobile de gestão de treinos da APAN, construído com Expo + React Native +
TypeScript, usando Expo Router para navegação por arquivos.

Veja o [README na raiz do repositório](../README.md) para o contexto geral do
projeto e instruções completas de como rodar tudo localmente (banco, backend
e app).

## Comandos rápidos

```bash
npm install
npx expo start
```

No terminal aberto pelo `expo start`, escaneie o QR code com o app **Expo Go**
(Android/iOS) para abrir o app no seu celular. Também é possível pressionar
`w` para abrir no navegador, ou `a`/`i` se tiver emulador Android / simulador
iOS configurado.

Todo o código do app fica em [src/](src/), com as rotas (telas) em
[src/app/](src/app/), seguindo o padrão de file-based routing do Expo Router.
