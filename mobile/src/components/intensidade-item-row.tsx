import { StyleSheet, Text, View } from 'react-native';

import { IntensidadeBadge } from '@/components/intensidade-badge';
import { RecordeBadge } from '@/components/recorde-badge';
import { useTheme } from '@/context/theme-context';
import { formatarTempo } from '@/lib/tempo';
import type { Cores } from '@/lib/theme';
import { ESTILO_LABEL, type ItemIntensidade } from '@/lib/types';

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

type Props = {
  item: ItemIntensidade;
};

export function IntensidadeItemRow({ item }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  return (
    <View style={styles.linha}>
      <View style={styles.info}>
        <Text style={styles.principal}>
          {item.distancia}{item.estilo ? ` ${ESTILO_LABEL[item.estilo]}` : ''} · {formatarTempo(item.tempoCentesimos)}
        </Text>
        <Text style={styles.detalhe}>{formatarData(item.treinoData)}</Text>
        {item.recorde ? <RecordeBadge /> : null}
      </View>
      <IntensidadeBadge faixa={item.faixa} intensidade={item.intensidade} />
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    linha: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    info: {
      gap: 2,
    },
    principal: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
    },
    detalhe: {
      fontSize: 12,
      color: c.textMuted,
    },
  });
}
