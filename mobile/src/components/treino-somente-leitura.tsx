import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/theme-context';
import type { Cores } from '@/lib/theme';
import { BLOCOS, CATEGORIA_LABEL, FASE_CICLO_LABEL, type BlocoTreino, type Treino } from '@/lib/types';

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

type Props = {
  treino: Treino;
};

// Visão de um treino que o técnico logado não criou — mesmo conteúdo do
// formulário de edição, mas sem nenhum campo editável (só quem criou o
// treino pode mexer nele, ver treinos.routes.ts no backend).
export function TreinoSomenteLeitura({ treino }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  const blocosComConteudo = BLOCOS.filter((b) => treino[b.textoField].length > 0);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.bannerTexto}>👁 Somente visualização — só quem criou pode editar ou excluir</Text>
      </View>

      <View style={styles.header}>
        <View style={styles.headerLinha}>
          <Text style={styles.data}>{formatarData(treino.data)}</Text>
          <Text style={styles.grupo}>{treino.categorias.map((c) => CATEGORIA_LABEL[c]).join(', ')}</Text>
        </View>
        <Text style={styles.objetivo}>{treino.objetivoSemana}</Text>
        <View style={styles.headerLinha}>
          <Text style={styles.fase}>{FASE_CICLO_LABEL[treino.faseCiclo]}</Text>
          {treino.pseEsperada != null ? <Text style={styles.pseEsperada}>PSE esperada: {treino.pseEsperada}</Text> : null}
        </View>
        <Text style={styles.pseEsperada}>
          {treino.liberado ? '🔓 Liberado para os atletas' : '🔒 Bloqueado para os atletas'}
        </Text>
      </View>

      {blocosComConteudo.map((bloco) => (
        <View key={bloco.key} style={styles.bloco}>
          <View style={styles.blocoHeader}>
            <Text style={styles.blocoTitulo}>{bloco.label}</Text>
            {treino[bloco.cronometradoField] ? <Text style={styles.blocoTag}>⏱ anotar tempo</Text> : null}
          </View>
          {treino[bloco.textoField].map((serie, index) => (
            <Text key={index} style={styles.blocoTexto}>
              {treino[bloco.textoField].length > 1 ? `${index + 1}. ${serie}` : serie}
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    container: {
      padding: 16,
      gap: 14,
      paddingBottom: 40,
      flexGrow: 1,
    },
    banner: {
      alignSelf: 'flex-start',
      backgroundColor: c.warningSoft,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    bannerTexto: {
      fontSize: 13,
      fontWeight: '700',
      color: c.warning,
    },
    header: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      gap: 6,
      backgroundColor: c.surface,
    },
    headerLinha: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    data: {
      fontSize: 18,
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
      fontSize: 15,
      color: c.text,
      fontWeight: '600',
    },
    fase: {
      fontSize: 13,
      color: c.textMuted,
    },
    pseEsperada: {
      fontSize: 13,
      color: c.textMuted,
    },
    bloco: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      gap: 10,
      backgroundColor: c.surface,
    },
    blocoHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    blocoTitulo: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
    },
    blocoTag: {
      fontSize: 11,
      fontWeight: '700',
      color: c.textMuted,
    },
    blocoTexto: {
      fontSize: 15,
      color: c.text,
      lineHeight: 21,
    },
  });
}
