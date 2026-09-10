import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/theme-context';
import type { Cores } from '@/lib/theme';
import { FAIXA_INTENSIDADE_LABEL, type FaixaIntensidade } from '@/lib/types';

type Props = {
  faixa: FaixaIntensidade | null;
  intensidade: number | null;
};

export function corDaFaixa(c: Cores, faixa: FaixaIntensidade): { cor: string; corSuave: string } {
  if (faixa === 'LEVE') return { cor: c.success, corSuave: c.successSoft };
  if (faixa === 'MODERADO') return { cor: c.warning, corSuave: c.warningSoft };
  return { cor: c.danger, corSuave: c.dangerSoft };
}

export function IntensidadeBadge({ faixa, intensidade }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  if (faixa === null || intensidade === null) {
    return (
      <View style={[styles.badge, { backgroundColor: colors.border }]}>
        <Text style={[styles.texto, { color: colors.textMuted }]}>sem referência</Text>
      </View>
    );
  }

  const { cor, corSuave } = corDaFaixa(colors, faixa);

  return (
    <View style={[styles.badge, { backgroundColor: corSuave }]}>
      <Text style={[styles.texto, { color: cor }]}>
        {intensidade}% · {FAIXA_INTENSIDADE_LABEL[faixa]}
      </Text>
    </View>
  );
}

function criarEstilos(_c: Cores) {
  return StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    texto: {
      fontSize: 12,
      fontWeight: '700',
    },
  });
}
