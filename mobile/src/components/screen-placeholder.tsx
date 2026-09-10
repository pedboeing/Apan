import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import type { Cores } from '@/lib/theme';

type Props = {
  titulo: string;
};

export function ScreenPlaceholder({ titulo }: Props) {
  const { usuario } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.subtitulo}>Em construção — conteúdo chega nos próximos passos.</Text>
      <Text style={styles.usuario}>
        Logado como {usuario?.nome} ({usuario?.tipo})
      </Text>
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
      gap: 8,
      backgroundColor: c.background,
    },
    titulo: {
      fontSize: 22,
      fontWeight: '700',
      color: c.text,
    },
    subtitulo: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: 'center',
    },
    usuario: {
      fontSize: 12,
      color: c.placeholder,
      marginTop: 8,
    },
  });
}
