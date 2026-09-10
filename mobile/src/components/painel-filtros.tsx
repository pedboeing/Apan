import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/theme-context';
import type { Cores } from '@/lib/theme';

type Props = {
  titulo?: string;
  resumo?: string;
  children: ReactNode;
};

// Caixinha clicável que esconde filtros/opções até o usuário tocar pra
// abrir — usada em toda tela que tinha várias linhas de chips de filtro
// sempre visíveis, pra deixar a lista de resultados como foco principal.
export function PainelFiltros({ titulo = 'Filtros', resumo, children }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const [aberto, setAberto] = useState(false);

  return (
    <View style={styles.container}>
      <Pressable style={styles.cabecalho} onPress={() => setAberto((v) => !v)}>
        <Text style={styles.titulo}>{titulo}</Text>
        <View style={styles.direita}>
          {!aberto && resumo ? <Text style={styles.resumo}>{resumo}</Text> : null}
          <Text style={styles.seta}>{aberto ? '▲' : '▼'}</Text>
        </View>
      </Pressable>
      {aberto ? <View style={styles.conteudo}>{children}</View> : null}
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    container: {
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
    },
    cabecalho: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    titulo: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
    },
    direita: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    resumo: {
      fontSize: 12,
      color: c.primary,
      fontWeight: '600',
    },
    seta: {
      fontSize: 11,
      color: c.textMuted,
    },
    conteudo: {
      paddingHorizontal: 16,
      paddingBottom: 14,
      gap: 8,
    },
  });
}
