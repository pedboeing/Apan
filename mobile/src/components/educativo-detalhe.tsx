import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { VideoPlayer } from '@/components/video-player';
import { useTheme } from '@/context/theme-context';
import type { Cores } from '@/lib/theme';
import { ESTILO_LABEL, type Educativo } from '@/lib/types';

type Props = {
  educativo: Educativo;
  onEditar?: () => void;
};

export function EducativoDetalhe({ educativo, onEditar }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <VideoPlayer url={educativo.videoUrl} />

      <View style={styles.header}>
        <View style={styles.estiloBadge}>
          <Text style={styles.estiloTexto}>{ESTILO_LABEL[educativo.estilo]}</Text>
        </View>
        <Text style={styles.nome}>{educativo.nome}</Text>
      </View>

      <Text style={styles.label}>Objetivo do exercício</Text>
      <Text style={styles.descricao}>{educativo.descricaoObjetivo}</Text>

      {onEditar ? (
        <Pressable style={styles.botaoEditar} onPress={onEditar}>
          <Text style={styles.botaoEditarTexto}>Editar educativo</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    container: {
      padding: 16,
      gap: 12,
      paddingBottom: 60,
      flexGrow: 1,
    },
    header: {
      gap: 6,
    },
    estiloBadge: {
      alignSelf: 'flex-start',
      backgroundColor: c.primarySoft,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    estiloTexto: {
      fontSize: 12,
      fontWeight: '700',
      color: c.primary,
    },
    nome: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textMuted,
      marginTop: 4,
    },
    descricao: {
      fontSize: 15,
      color: c.text,
      lineHeight: 21,
    },
    botaoEditar: {
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 16,
    },
    botaoEditarTexto: {
      color: c.primary,
      fontWeight: '600',
      fontSize: 15,
    },
  });
}
