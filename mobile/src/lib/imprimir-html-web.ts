// expo-print no navegador NÃO usa o html recebido — ExponentPrint.web.ts
// simplesmente chama `window.print()`, que imprime a página atual (por isso
// o PDF saía como um "print da tela" em vez do layout bonito gerado em
// treino-pdf.ts/tabela-referencia-pdf.ts). Pra imprimir o HTML de verdade,
// abrimos uma aba nova só com esse HTML e mandamos imprimir ela.
export function imprimirHtmlWeb(html: string): void {
  const janela = window.open('', '_blank');
  if (!janela) {
    window.alert('Não foi possível abrir a janela de impressão. Verifique se o navegador não está bloqueando pop-ups para este site.');
    return;
  }

  janela.document.open();
  janela.document.write(html);
  janela.document.close();

  let jaImprimiu = false;
  const imprimir = () => {
    if (jaImprimiu) return;
    jaImprimiu = true;
    janela.focus();
    janela.print();
  };

  // document.write termina de forma síncrona, mas em alguns navegadores o
  // layout só fica pronto após o evento load da janela — e em outros
  // (Safari, por exemplo) esse load não dispara de forma confiável para um
  // documento escrito assim. Por isso: tenta no load, com um fallback por
  // tempo garantindo que a impressão sempre dispara.
  janela.onload = imprimir;
  setTimeout(imprimir, 300);
}
