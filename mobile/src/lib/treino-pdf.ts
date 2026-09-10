import { BLOCOS, FASE_CICLO_LABEL, type BlocoTreino, type Treino } from './types';

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

// Uma cor por bloco, na "ordem natural" de um treino: aquece (quente),
// prepara (neutro/frio), o corpo principal do treino (azul da marca) e
// solta/relaxa no final (violeta calmo). Mantém uma identidade visual
// coerente com o resto do app sem depender do tema (o PDF é sempre "claro").
const COR_BLOCO: Record<BlocoTreino, { cor: string; corSuave: string }> = {
  AQUECIMENTO: { cor: '#C97A0A', corSuave: '#FDF0D9' },
  SERIE_PREPARATORIA: { cor: '#12977E', corSuave: '#DEF4EF' },
  SERIE_PRINCIPAL: { cor: '#0077B6', corSuave: '#DFF1FA' },
  SOLTURA: { cor: '#6B5CA5', corSuave: '#EDE9F7' },
};

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderizarBloco(treino: Treino, bloco: (typeof BLOCOS)[number]): string {
  const series = treino[bloco.textoField];
  if (series.length === 0) return '';

  const cronometrado = treino[bloco.cronometradoField];
  const { cor, corSuave } = COR_BLOCO[bloco.key];

  const itensSerie =
    series.length > 1
      ? `<ol class="serie-lista">${series.map((s) => `<li>${escaparHtml(s)}</li>`).join('')}</ol>`
      : `<p class="serie-texto">${escaparHtml(series[0])}</p>`;

  return `
    <section class="bloco" style="border-left-color:${cor};">
      <div class="bloco-header">
        <span class="bloco-titulo" style="color:${cor};">${bloco.label}</span>
        ${cronometrado ? `<span class="bloco-tag" style="background:${corSuave};color:${cor};">⏱ Anotar tempo</span>` : ''}
      </div>
      ${itensSerie}
    </section>
  `;
}

export function gerarHtmlTreino(treino: Treino, tecnicoNome: string): string {
  const blocosHtml = BLOCOS.map((b) => renderizarBloco(treino, b))
    .filter((html) => html.length > 0)
    .join('');

  const categoriasHtml = treino.categorias
    .map((c) => `<span class="pill">${c}</span>`)
    .join('');

  const geradoEm = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { margin: 0; }
      /* Geradores de PDF/impressão descartam cor de fundo por padrão (pra
         economizar tinta) — sem isso o cabeçalho colorido, os selos e os
         cartões viram texto cinza num fundo branco. */
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      body {
        margin: 0;
        font-family: -apple-system, Helvetica, Arial, sans-serif;
        color: #0B1F2A;
        background: #F3F8FA;
      }
      .pagina { padding: 0 0 36px 0; }
      .header {
        /* cor sólida de reserva caso o gerador não suporte gradiente */
        background-color: #0077B6;
        background: linear-gradient(135deg, #0077B6 0%, #12977E 100%);
        color: #FFFFFF;
        padding: 32px 40px;
      }
      .header-topo {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
      }
      .marca {
        font-size: 28px;
        font-weight: 800;
        letter-spacing: 1px;
      }
      .subtitulo {
        font-size: 13px;
        opacity: 0.9;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .header-data {
        font-size: 15px;
        font-weight: 700;
      }
      .objetivo {
        margin-top: 18px;
        font-size: 22px;
        font-weight: 700;
      }
      .header-meta {
        margin-top: 14px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }
      .pill {
        background: rgba(255,255,255,0.22);
        border-radius: 20px;
        padding: 4px 12px;
        font-size: 12px;
        font-weight: 700;
      }
      .conteudo {
        padding: 28px 40px 0 40px;
      }
      .bloco {
        background: #FFFFFF;
        border: 1px solid #DCE6EA;
        border-left-width: 6px;
        border-radius: 10px;
        padding: 16px 18px;
        margin-bottom: 16px;
        page-break-inside: avoid;
      }
      .bloco-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .bloco-titulo {
        font-size: 15px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .bloco-tag {
        font-size: 11px;
        font-weight: 700;
        padding: 3px 10px;
        border-radius: 10px;
      }
      .serie-texto {
        font-size: 14px;
        line-height: 1.5;
        margin: 0;
        white-space: pre-wrap;
      }
      .serie-lista {
        margin: 0;
        padding-left: 20px;
        font-size: 14px;
        line-height: 1.6;
      }
      .serie-lista li {
        margin-bottom: 4px;
        white-space: pre-wrap;
      }
      .rodape {
        margin-top: 24px;
        padding: 0 40px;
        font-size: 11px;
        color: #5B7480;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="pagina">
      <div class="header">
        <div class="header-topo">
          <div>
            <div class="marca">APAN</div>
            <div class="subtitulo">Plano de treino</div>
          </div>
          <div class="header-data">${formatarData(treino.data)}</div>
        </div>
        <div class="objetivo">${escaparHtml(treino.objetivoSemana)}</div>
        <div class="header-meta">
          ${categoriasHtml}
          <span class="pill">${FASE_CICLO_LABEL[treino.faseCiclo]}</span>
          ${treino.pseEsperada != null ? `<span class="pill">PSE esperada: ${treino.pseEsperada}</span>` : ''}
        </div>
      </div>

      <div class="conteudo">
        ${blocosHtml}
      </div>

      <div class="rodape">Montado por ${escaparHtml(tecnicoNome)} · Gerado pelo app APAN em ${geradoEm}</div>
    </div>
  </body>
</html>`;
}
