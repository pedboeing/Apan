import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/theme-context';
import type { Cores } from '@/lib/theme';
import { FASE_CICLO_LABEL, formatarGruposCategorias, treinoPrecisaResponder, type TreinoComRegistros } from '@/lib/types';

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

type Props = {
  treino: TreinoComRegistros;
  onPress: () => void;
};

export function TreinoResumoCard({ treino, onPress }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  const cronometrado =
    treino.aquecimentoCronometrado ||
    treino.seriePreparatoriaCronometrada ||
    treino.seriePrincipalCronometrada ||
    treino.solturaCronometrada;
  const pendente = treinoPrecisaResponder(treino);

  return (
    <Pressable style={[styles.card, pendente && styles.cardPendente]} onPress={onPress}>
      {pendente ? (
        <View style={styles.pendenteBanner}>
          <Text style={styles.pendenteBannerTexto}>⚠ Falta responder este treino</Text>
        </View>
      ) : null}
      <View style={styles.header}>
        <Text style={styles.data}>{formatarData(treino.data)}</Text>
        <Text style={styles.grupo}>{formatarGruposCategorias(treino.categorias)}</Text>
      </View>
      <Text style={styles.objetivo}>{treino.objetivoSemana}</Text>
      <View style={styles.footer}>
        <Text style={styles.fase}>{FASE_CICLO_LABEL[treino.faseCiclo]}</Text>
        {!treino.liberado ? <Text style={styles.tag}>🔒 bloqueado</Text> : null}
        {cronometrado ? <Text style={styles.tag}>⏱ anotar tempo</Text> : null}
        {treino.pse ? <Text style={styles.tag}>PSE: {treino.pse.pse}</Text> : null}
        {treino.statusAtleta === 'AUSENTE' ? <Text style={styles.tagAusente}>😔 Ausente</Text> : null}
        {treino.statusAtleta === 'RESPONDIDO' ? <Text style={styles.tagRespondido}>✓ Respondido</Text> : null}
      </View>
    </Pressable>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: c.border,
      borderLeftWidth: 4,
      borderLeftColor: c.border,
      borderRadius: 12,
      padding: 14,
      gap: 6,
      backgroundColor: c.surface,
    },
    cardPendente: {
      borderLeftColor: c.warning,
    },
    pendenteBanner: {
      alignSelf: 'flex-start',
      backgroundColor: c.warningSoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      marginBottom: 2,
    },
    pendenteBannerTexto: {
      fontSize: 12,
      fontWeight: '700',
      color: c.warning,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    data: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
    },
    grupo: {
      fontSize: 12,
      fontWeight: '600',
      color: c.primary,
      backgroundColor: c.primarySoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      overflow: 'hidden',
    },
    objetivo: {
      fontSize: 14,
      color: c.text,
    },
    footer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 2,
      flexWrap: 'wrap',
    },
    fase: {
      fontSize: 12,
      color: c.textMuted,
    },
    tag: {
      fontSize: 12,
      color: c.textMuted,
    },
    tagAusente: {
      fontSize: 12,
      fontWeight: '700',
      color: c.danger,
    },
    tagRespondido: {
      fontSize: 12,
      fontWeight: '700',
      color: c.success,
    },
  });
}
