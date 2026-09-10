import { formatarTempo } from './tempo';
import { formatarProva, type ProvaComZonas } from './types';

// Mesmas cores de zona usadas no app (components/zona-treinamento-card.tsx)
// — mantenha as duas em sincronia.
const COR_ZONA: Record<string, { cor: string; corSuave: string }> = {
  A1: { cor: '#12977E', corSuave: '#DEF4EF' },
  A2: { cor: '#12977E', corSuave: '#DEF4EF' },
  CA3: { cor: '#C97A0A', corSuave: '#FDF0D9' },
  PA3: { cor: '#C97A0A', corSuave: '#FDF0D9' },
  AN: { cor: '#D93B3B', corSuave: '#FBE4E4' },
};

// Piscina de 50m = azul (primary do app), 25m = roxo (accent do app) —
// mesma dupla de cores usada em melhores-marcas-lista.tsx e no tema.
const COR_PISCINA = {
  M50: { cor: '#0077B6', corSuave: '#DFF1FA' },
  M25: { cor: '#6B5CA5', corSuave: '#EDE9F7' },
};

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderizarProva(prova: ProvaComZonas): string {
  const titulo = escaparHtml(formatarProva(prova.estilo, prova.distancia));

  if (prova.melhorTempoCentesimos === null) {
    return `
      <div class="prova prova-vazia">
        <div class="prova-titulo">${titulo}</div>
        <div class="prova-vazia-texto">Nenhuma marca cadastrada nessa piscina</div>
      </div>
    `;
  }

  const linhas = prova.zonas
    .map((z) => {
      const { cor, corSuave } = COR_ZONA[z.zona] ?? { cor: '#0077B6', corSuave: '#DFF1FA' };
      return `
        <tr>
          <td class="col-zona"><span class="zona-badge" style="background:${corSuave};color:${cor};">${z.zona}</span></td>
          <td class="col-tempo">${formatarTempo(z.tempoRapidoCentesimos)} – ${formatarTempo(z.tempoLentoCentesimos)}</td>
          <td class="col-desc">${escaparHtml(z.descricao)}</td>
          <td class="col-pct">${z.percentualMin}%–${z.percentualMax}%</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div class="prova">
      <div class="prova-header">
        <div class="prova-titulo">${titulo}</div>
        <div class="prova-melhor">Melhor tempo: ${formatarTempo(prova.melhorTempoCentesimos)}</div>
      </div>
      <table class="zonas-tabela">
        <thead>
          <tr>
            <th class="col-zona">Zona</th>
            <th class="col-tempo">Tempo de referência</th>
            <th class="col-desc">Interpretação</th>
            <th class="col-pct">% do melhor tempo</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
  `;
}

function renderizarSecaoPiscina(titulo: string, piscina: 'M50' | 'M25', provas: ProvaComZonas[]): string {
  const { cor, corSuave } = COR_PISCINA[piscina];
  const provasHtml = provas.map(renderizarProva).join('');

  return `
    <section class="piscina-secao" style="border-left-color:${cor};">
      <div class="piscina-header" style="background:${corSuave};">
        <span class="piscina-titulo" style="color:${cor};">🏊 ${titulo}</span>
      </div>
      <div class="piscina-conteudo">
        ${provasHtml || '<p class="prova-vazia-texto">Nenhuma prova principal escolhida.</p>'}
      </div>
    </section>
  `;
}

export function gerarHtmlTabelaReferencia(atletaNome: string, m25: ProvaComZonas[], m50: ProvaComZonas[]): string {
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
        font-size: 13px;
        font-weight: 700;
      }
      .atleta-nome {
        margin-top: 18px;
        font-size: 22px;
        font-weight: 700;
      }
      .conteudo {
        padding: 28px 40px 0 40px;
        display: flex;
        flex-direction: column;
        gap: 22px;
      }
      .piscina-secao {
        background: #FFFFFF;
        border: 1px solid #DCE6EA;
        border-left-width: 6px;
        border-radius: 10px;
        overflow: hidden;
        page-break-inside: avoid;
      }
      .piscina-header {
        padding: 12px 18px;
      }
      .piscina-titulo {
        font-size: 15px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .piscina-conteudo {
        padding: 16px 18px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .prova {
        page-break-inside: avoid;
      }
      .prova-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 6px;
      }
      .prova-titulo {
        font-size: 15px;
        font-weight: 700;
      }
      .prova-melhor {
        font-size: 12px;
        color: #5B7480;
      }
      .prova-vazia {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
      }
      .prova-vazia-texto {
        font-size: 12px;
        color: #94A8AF;
        font-style: italic;
      }
      .zonas-tabela {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }
      .zonas-tabela th {
        text-align: left;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        color: #5B7480;
        padding: 4px 8px;
        border-bottom: 1px solid #DCE6EA;
      }
      .zonas-tabela td {
        padding: 6px 8px;
        border-bottom: 1px solid #EDF2F4;
      }
      .col-zona { width: 60px; }
      .col-tempo { width: 160px; font-weight: 700; }
      .col-pct { width: 90px; color: #5B7480; }
      .zona-badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 800;
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
            <div class="subtitulo">Tabela de referência</div>
          </div>
          <div class="header-data">${geradoEm}</div>
        </div>
        <div class="atleta-nome">${escaparHtml(atletaNome)}</div>
      </div>

      <div class="conteudo">
        ${renderizarSecaoPiscina('Piscina 50m', 'M50', m50)}
        ${renderizarSecaoPiscina('Piscina 25m', 'M25', m25)}
      </div>

      <div class="rodape">Gerado pelo app APAN em ${geradoEm}</div>
    </div>
  </body>
</html>`;
}
