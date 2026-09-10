// Formato padrão do app pra tempo de natação: MM:SS.CC — dois pontos
// separam minuto de segundo, ponto separa segundo de centésimo. Minuto some
// por completo quando é zero (não mostra "0:"); segundo nunca é omitido, e
// vem sem zero à esquerda quando é a parte mais significativa mostrada (ex:
// "6.51", não "06.51"); centésimo sempre aparece, com 2 dígitos.
export function formatarTempo(centesimos: number): string {
  const cc = centesimos % 100;
  const totalSegundos = Math.floor(centesimos / 100);
  const ss = totalSegundos % 60;
  const mm = Math.floor(totalSegundos / 60);

  const segundosTexto = mm > 0 ? String(ss).padStart(2, '0') : String(ss);
  const tempoBase = mm > 0 ? `${mm}:${segundosTexto}` : segundosTexto;
  return `${tempoBase}.${String(cc).padStart(2, '0')}`;
}

// --- Entrada de tempo -------------------------------------------------
//
// Em vez de texto livre, o atleta digita só números e o campo (ver
// components/tempo-input.tsx) monta a pontuação sozinho. Os dígitos são
// digitados na ordem normal de leitura (o mesmo jeito que se fala o tempo em
// voz alta) — cada dígito novo entra no FIM do que já foi digitado. A
// pontuação aparece sozinha porque a formatação sempre lê os 2 últimos
// dígitos digitados como centésimo, os 2 antes disso como segundo, e o resto
// como minuto — então o campo se ajusta conforme mais dígitos entram:
//
//   1 → 12 → 123 → 1234 → 12345 → 123456
//   1 → .12 → 1.23 → 12.34 → 1:23.45 → 12:34.56
//   (digitando 1, 2, 3, 4, 5, 6 nessa ordem)
//
// `buffer` é sempre só dígitos crus (sem pontuação), na ordem que reproduz o
// texto formatado via bufferParaTexto — nunca é guardado em lugar nenhum,
// existe só durante a digitação dentro do componente.

const MAX_DIGITOS_BUFFER = 6; // MM:SS.CC — minuto de até 2 dígitos (até 99 min)

export function digitarNoBuffer(buffer: string, digito: string): string {
  if (buffer.length >= MAX_DIGITOS_BUFFER) return buffer;
  return buffer + digito;
}

// Desfaz exatamente o último dígito digitado — o inverso de digitarNoBuffer:
// como todo dígito novo entra no fim, desfazer é sempre tirar o último
// caractere.
export function apagarDoBuffer(buffer: string): string {
  return buffer.slice(0, -1);
}

// Mesma separação usada na formatação (últimos 2 dígitos = centésimos,
// próximos 2 = segundo, resto = minuto) pra converter o que foi digitado no
// valor em centésimos que a API espera.
export function bufferParaCentesimos(buffer: string): number | null {
  if (buffer.length === 0) return null;
  if (buffer.length === 1) return Number(buffer);

  const cc = Number(buffer.slice(-2));
  const resto = buffer.slice(0, -2);
  if (resto.length === 0) return cc;

  const ss = Number(resto.slice(-2));
  const mm = resto.length > 2 ? Number(resto.slice(0, -2)) : 0;
  return mm * 6000 + ss * 100 + cc;
}

// Texto mostrado no campo enquanto o atleta digita. Segue a mesma ideia do
// formatarTempo (esconde o que ainda não foi preenchido), mas sem
// normalizar segundo ≥ 60 — o buffer mostra exatamente os dígitos crus que
// foram digitados; o valor final (bufferParaCentesimos) já fica
// matematicamente correto e se reformata sozinho da próxima vez que for
// exibido em outro lugar do app (ex: reabrir esse mesmo campo pra editar).
export function bufferParaTexto(buffer: string): string {
  if (buffer.length === 0) return '';
  if (buffer.length === 1) return buffer;

  const cc = buffer.slice(-2);
  const resto = buffer.slice(0, -2);
  if (resto.length === 0) return `.${cc}`;
  if (resto.length <= 2) return `${resto}.${cc}`;

  const ss = resto.slice(-2);
  const mm = resto.slice(0, -2);
  return `${mm}:${ss}.${cc}`;
}

// Pra pré-preencher o campo ao editar um tempo já salvo: o buffer nada mais
// é que os dígitos do texto já formatado, sem a pontuação — já que
// bufferParaTexto reproduz exatamente essa mesma formatação a partir dele.
export function centesimosParaBuffer(centesimos: number | null): string {
  if (centesimos == null) return '';
  return formatarTempo(centesimos).replace(/[:.]/g, '');
}
