import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/theme-context';
import type { Cores } from '@/lib/theme';
import { CATEGORIA_LABEL, PISCINA_LABEL, SEXO_LABEL, type RecordeInterno } from '@/lib/types';
import { formatarTempo } from '@/lib/tempo';

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

type Props = {
  recorde: RecordeInterno;
  atual?: boolean;
  onPress?: () => void;
};

export function RecordeCard({ recorde, atual, onPress }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper style={styles.linha} onPress={onPress}>
      <View style={styles.categoriaBadge}>
        <Text style={styles.categoriaTexto}>{CATEGORIA_LABEL[recorde.categoria]}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.tempo}>{formatarTempo(recorde.tempoCentesimos)}</Text>
        <Text style={styles.nome}>{recorde.nomeAtleta}</Text>
        <Text style={styles.detalhe}>
          {SEXO_LABEL[recorde.sexo]} · Piscina {PISCINA_LABEL[recorde.piscina]}
        </Text>
      </View>
      <View style={styles.direita}>
        <Text style={styles.data}>{formatarData(recorde.data)}</Text>
        {atual === false ? <Text style={styles.superado}>superado</Text> : null}
        {atual === true ? <Text style={styles.atual}>recorde atual</Text> : null}
      </View>
    </Wrapper>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    linha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    categoriaBadge: {
      backgroundColor: c.primarySoft,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    categoriaTexto: {
      fontSize: 11,
      fontWeight: '700',
      color: c.primary,
    },
    info: {
      flex: 1,
      gap: 1,
    },
    tempo: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    nome: {
      fontSize: 13,
      color: c.textMuted,
    },
    detalhe: {
      fontSize: 11,
      color: c.placeholder,
    },
    direita: {
      alignItems: 'flex-end',
      gap: 2,
    },
    data: {
      fontSize: 12,
      color: c.textMuted,
    },
    atual: {
      fontSize: 11,
      fontWeight: '700',
      color: c.success,
    },
    superado: {
      fontSize: 11,
      color: c.placeholder,
    },
  });
}
