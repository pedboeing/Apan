import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { imprimirHtmlWeb } from '@/lib/imprimir-html-web';
import type { Cores } from '@/lib/theme';
import { gerarHtmlTreino } from '@/lib/treino-pdf';
import type { Treino } from '@/lib/types';

type Props = {
  treino: Treino;
};

export function ExportarTreinoPdfButton({ treino }: Props) {
  const { usuario } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const [exportando, setExportando] = useState(false);

  async function handleExportar() {
    setExportando(true);
    try {
      const html = gerarHtmlTreino(treino, usuario?.nome ?? 'Técnico');

      if (Platform.OS === 'web') {
        imprimirHtmlWeb(html);
        return;
      }

      const { uri } = await Print.printToFileAsync({ html });
      const disponivel = await Sharing.isAvailableAsync();
      if (disponivel) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Plano de treino' });
      }
    } finally {
      setExportando(false);
    }
  }

  return (
    <View style={styles.centralizador}>
      <Pressable style={styles.botao} onPress={handleExportar} disabled={exportando}>
        {exportando ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.botaoTexto}>📄 Exportar treino em PDF</Text>
        )}
      </Pressable>
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    // No navegador o container pai (tela de edição do treino) não é um
    // formulário centralizado — sem isso o botão esticava até a borda da
    // tela pelo alignItems:'stretch' padrão do pai.
    centralizador: {
      ...Platform.select({ web: { alignItems: 'center' as const } }),
    },
    botao: {
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      marginHorizontal: 24,
      marginTop: 12,
      ...Platform.select({ web: { width: '100%' as const, maxWidth: 360, marginHorizontal: 0 } }),
    },
    botaoTexto: {
      color: c.primary,
      fontWeight: '600',
      fontSize: 14,
    },
  });
}
