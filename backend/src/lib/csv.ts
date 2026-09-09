// Planilhas de recordes chegam exportadas de fontes diferentes (Excel
// brasileiro usa ";" já que "," é separador decimal, colar direto de uma
// planilha vira tabulação, exportação "padrão" usa vírgula) — detecta qual
// separador foi usado olhando o cabeçalho em vez de exigir um formato fixo.
function detectarDelimitador(primeiraLinha: string): string {
  const candidatos = ['\t', ';', ','];
  let melhor = ',';
  let melhorContagem = 0;
  for (const c of candidatos) {
    const contagem = primeiraLinha.split(c).length - 1;
    if (contagem > melhorContagem) {
      melhorContagem = contagem;
      melhor = c;
    }
  }
  return melhor;
}

// Parser mínimo de CSV (RFC4180 simplificado): campos entre aspas duplas
// podem conter o separador/quebra de linha, aspas escapadas como "".
// Suficiente para as planilhas de importação de recordes — não precisa de
// uma lib externa para isso.
export function parseCsv(texto: string): string[][] {
  const linhas: string[][] = [];
  let campo = '';
  let linha: string[] = [];
  let dentroDeAspas = false;

  const conteudo = texto.replace(/^﻿/, '');
  const delimitador = detectarDelimitador(conteudo.split(/\r?\n/, 1)[0] ?? '');

  for (let i = 0; i < conteudo.length; i++) {
    const c = conteudo[i];

    if (dentroDeAspas) {
      if (c === '"') {
        if (conteudo[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          dentroDeAspas = false;
        }
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"') {
      dentroDeAspas = true;
    } else if (c === delimitador) {
      linha.push(campo);
      campo = '';
    } else if (c === '\r') {
      continue;
    } else if (c === '\n') {
      linha.push(campo);
      linhas.push(linha);
      campo = '';
      linha = [];
    } else {
      campo += c;
    }
  }

  if (campo.length > 0 || linha.length > 0) {
    linha.push(campo);
    linhas.push(linha);
  }

  return linhas.filter((l) => l.some((v) => v.trim().length > 0));
}
