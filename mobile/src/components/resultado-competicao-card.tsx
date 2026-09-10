import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/theme-context';
import { formatarTempo } from '@/lib/tempo';
import type { Cores } from '@/lib/theme';
import { formatarProva, MEDALHA_EMOJI, MEDALHA_LABEL, type ResultadoCompeticao } from '@/lib/types';

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

type Props = {
  resultado: ResultadoCompeticao;
  onPress?: () => void;
};

export function ResultadoCompeticaoCard({ resultado, onPress }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.prova}>{formatarProva(resultado.estilo, resultado.distancia)}</Text>
        <Text style={styles.tempo}>{formatarTempo(resultado.tempoCentesimos)}</Text>
      </View>
      <Text style={styles.competicao}>{resultado.competicao.nome}</Text>
      <Text style={styles.detalhe}>
        {resultado.competicao.local} · {formatarData(resultado.competicao.data)}
      </Text>
      {resultado.colocacao != null || resultado.medalha ? (
        <View style={styles.badges}>
          {resultado.colocacao != null ? (
            <View style={styles.badge}>
              <Text style={styles.badgeTexto}>{resultado.colocacao}º lugar</Text>
            </View>
          ) : null}
          {resultado.medalha ? (
            <View style={styles.badge}>
              <Text style={styles.badgeTexto}>
                {MEDALHA_EMOJI[resultado.medalha]} {MEDALHA_LABEL[resultado.medalha]}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Wrapper>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      gap: 3,
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
    competicao: {
      fontSize: 13,
      fontWeight: '600',
      color: c.text,
      marginTop: 2,
    },
    detalhe: {
      fontSize: 12,
      color: c.textMuted,
    },
    badges: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 6,
    },
    badge: {
      backgroundColor: c.primarySoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    badgeTexto: {
      fontSize: 12,
      fontWeight: '600',
      color: c.primary,
    },
  });
}
