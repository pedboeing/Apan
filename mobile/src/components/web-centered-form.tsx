import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

// Larga o bastante pra caber duas colunas de chip/segmento lado a lado (ex:
// "Sou atleta" / "Sou técnico" no cadastro) com texto confortável, sem virar
// uma coluna larga de mais pra ler.
const LARGURA_MAXIMA = 520;

type Props = {
  children: ReactNode;
};

// Formulários (login, cadastro, editar treino/recorde/marca etc.) ficam
// ruins esticados pela tela toda no navegador — campo de texto e botão de
// 1600px de largura são difíceis de ler e de usar, e o resultado nem fica
// alinhado (inputs colados na esquerda, botão indo até a direita). Diferente
// de telas de lista/dashboard (que usam a tela toda de propósito), aqui
// limitamos E centralizamos o formulário inteiro como um bloco só, então
// input, chip e botão sempre têm a mesma largura. No celular (nativo ou
// navegador com tela estreita) isso não muda nada.
export function WebCenteredForm({ children }: Props) {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View style={styles.fundo}>
      <View style={styles.conteudo}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    alignItems: 'center',
  },
  conteudo: {
    flex: 1,
    width: '100%',
    maxWidth: LARGURA_MAXIMA,
  },
});
