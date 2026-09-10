// Converte um link comum de YouTube/Vimeo (o que o técnico costuma colar,
// tipo o link da barra de endereço) para a URL de embed correspondente.
// Se não reconhecer o link, devolve a URL original — o player tenta
// carregar do mesmo jeito.
export function paraUrlIncorporada(url: string): string {
  const u = url.trim();

  const youtubeWatch = u.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([\w-]{6,})/);
  if (youtubeWatch) {
    return `https://www.youtube.com/embed/${youtubeWatch[1]}`;
  }
  if (/youtube\.com\/embed\//.test(u)) {
    return u;
  }

  const vimeo = u.match(/vimeo\.com\/(\d+)/);
  if (vimeo) {
    return `https://player.vimeo.com/video/${vimeo[1]}`;
  }
  if (/player\.vimeo\.com\/video\//.test(u)) {
    return u;
  }

  return u;
}

// O YouTube (e, com menos frequência, o Vimeo) recusa tocar o embed quando a
// página que o carrega não tem uma origem http(s) reconhecível — é o que dá
// o "Erro 153" dentro do WebView do Expo Go, que navega direto pra URL sem
// nenhuma página "hospedando" o iframe. A correção é servir um HTML mínimo
// com o iframe dentro, e dizer pro WebView que esse HTML "pertence" a uma
// origem https (baseUrl) em vez de carregar a URL do vídeo diretamente.
export function construirHtmlEmbed(embedUrl: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <style>
      html, body { margin: 0; padding: 0; background: #000; height: 100%; }
      iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
    </style>
  </head>
  <body>
    <iframe
      src="${embedUrl}"
      allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
      allowfullscreen
    ></iframe>
  </body>
</html>`;
}
