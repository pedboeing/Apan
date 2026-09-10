import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/theme-context';
import { formatarTempo } from '@/lib/tempo';
import type { Cores } from '@/lib/theme';
import { formatarProva, type MelhorTempoPorProva } from '@/lib/types';

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

type Props = {
  melhor: MelhorTempoPorProva;
};

export function MelhorTempoCard({ melhor }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.prova}>{formatarProva(melhor.estilo, melhor.distancia)}</Text>
        <Text style={styles.tempo}>{formatarTempo(melhor.tempoCentesimos)}</Text>
      </View>
      <Text style={styles.detalhe}>
        {melhor.competicaoNome} · {formatarData(melhor.data)}
      </Text>
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: c.border,
      borderLeftWidth: 4,
      borderLeftColor: c.primary,
      borderRadius: 12,
      padding: 14,
      gap: 2,
      backgroundColor: c.surface,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    prova: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    tempo: {
      fontSize: 16,
      fontWeight: '700',
      color: c.primary,
    },
    detalhe: {
      fontSize: 12,
      color: c.textMuted,
    },
  });
}
