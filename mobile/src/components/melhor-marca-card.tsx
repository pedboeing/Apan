import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/theme-context';
import { formatarTempo } from '@/lib/tempo';
import type { Cores } from '@/lib/theme';
import { formatarProva, type MelhorMarca } from '@/lib/types';

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

type Props = {
  marca: MelhorMarca;
  // Cor de destaque do card — quem chama passa a cor da seção (piscina de
  // 50m ou 25m) pra reforçar visualmente em qual grupo essa marca está.
  cor?: string;
  onPress?: () => void;
};

export function MelhorMarcaCard({ marca, cor, onPress }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const corDestaque = cor ?? colors.primary;

  return (
    <Pressable style={[styles.card, { borderLeftColor: corDestaque }]} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.prova}>{formatarProva(marca.estilo, marca.distancia)}</Text>
        <Text style={[styles.tempo, { color: corDestaque }]}>{formatarTempo(marca.tempoCentesimos)}</Text>
      </View>
      {marca.data ? <Text style={styles.detalhe}>{formatarData(marca.data)}</Text> : null}
    </Pressable>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: c.border,
      borderLeftWidth: 4,
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
    },
    detalhe: {
      fontSize: 12,
      color: c.textMuted,
    },
  });
}
