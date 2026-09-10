import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/theme-context';
import type { Cores } from '@/lib/theme';

export function RecordeBadge() {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  return (
    <View style={styles.badge}>
      <Text style={styles.texto}>🏆 Novo recorde!</Text>
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      backgroundColor: c.warningSoft,
    },
    texto: {
      fontSize: 12,
      fontWeight: '700',
      color: c.warning,
    },
  });
}
