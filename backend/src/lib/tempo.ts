// Mesma lógica flexível de parsing de tempo usada no app (mobile/src/lib/tempo.ts)
// — mantenha os dois em sincronia. Usada aqui na importação de CSV de recordes,
// já que planilhas históricas podem trazer tempos em formatos variados.

function normalizarFracao(frac: string): number {
  if (frac.length === 1) return Number(frac) * 10;
  return Number(frac.slice(0, 2));
}

export function parseTempo(texto: string): number | null {
  const t = texto.trim();
  if (!t) return null;

  let m: RegExpMatchArray | null;

  m = t.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
  if (m) {
    const mm = Number(m[1]);
    const ss = Number(m[2]);
    const cc = Number(m[3]);
    if (ss >= 60 || cc >= 100) return null;
    return mm * 6000 + ss * 100 + cc;
  }

  // Planilhas de cronometragem às vezes usam ponto no lugar de dois-pontos
  // como separador de min/seg/centésimos (ex: "00.28.89").
  m = t.match(/^(\d{1,2})\.(\d{1,2})\.(\d{1,2})$/);
  if (m) {
    const mm = Number(m[1]);
    const ss = Number(m[2]);
    const cc = Number(m[3]);
    if (ss >= 60 || cc >= 100) return null;
    return mm * 6000 + ss * 100 + cc;
  }

  m = t.match(/^(\d{1,2}):(\d{1,2})[.,](\d{1,2})$/);
  if (m) {
    const mm = Number(m[1]);
    const ss = Number(m[2]);
    if (ss >= 60) return null;
    return mm * 6000 + ss * 100 + normalizarFracao(m[3]);
  }

  m = t.match(/^(\d{1,2}):(\d{1,2})$/);
  if (m) {
    const mm = Number(m[1]);
    const ss = Number(m[2]);
    if (ss >= 60) return null;
    return mm * 6000 + ss * 100;
  }

  m = t.match(/^(\d{1,3})[.,](\d{1,2})$/);
  if (m) {
    const ss = Number(m[1]);
    return ss * 100 + normalizarFracao(m[2]);
  }

  m = t.match(/^(\d{1,3})$/);
  if (m) {
    return Number(m[1]) * 100;
  }

  return null;
}

export function formatarTempo(centesimos: number): string {
  const cc = centesimos % 100;
  const totalSegundos = Math.floor(centesimos / 100);
  const ss = totalSegundos % 60;
  const mm = Math.floor(totalSegundos / 60);
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}:${String(cc).padStart(2, '0')}`;
}
