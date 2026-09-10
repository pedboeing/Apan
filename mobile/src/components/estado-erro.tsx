import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/theme-context';
import type { Cores } from '@/lib/theme';

type Props = {
  mensagem: string;
  aoTentarNovamente?: () => void;
};

export function EstadoErro({ mensagem, aoTentarNovamente }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.mensagem}>{mensagem}</Text>
      {aoTentarNovamente ? (
        <Pressable style={styles.botao} onPress={aoTentarNovamente}>
          <Text style={styles.botaoTexto}>Tentar novamente</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 14,
    },
    mensagem: {
      color: c.danger,
      fontSize: 14,
      textAlign: 'center',
    },
    botao: {
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    botaoTexto: {
      color: c.primary,
      fontWeight: '600',
      fontSize: 14,
    },
  });
}
