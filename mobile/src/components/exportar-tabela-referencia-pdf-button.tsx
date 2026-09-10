import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/theme-context';
import { imprimirHtmlWeb } from '@/lib/imprimir-html-web';
import { gerarHtmlTabelaReferencia } from '@/lib/tabela-referencia-pdf';
import type { Cores } from '@/lib/theme';
import type { ProvaComZonas } from '@/lib/types';

type Props = {
  atletaNome: string;
  m25: ProvaComZonas[];
  m50: ProvaComZonas[];
};

export function ExportarTabelaReferenciaPdfButton({ atletaNome, m25, m50 }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const [exportando, setExportando] = useState(false);

  async function handleExportar() {
    setExportando(true);
    try {
      const html = gerarHtmlTabelaReferencia(atletaNome, m25, m50);

      if (Platform.OS === 'web') {
        imprimirHtmlWeb(html);
        return;
      }

      const { uri } = await Print.printToFileAsync({ html });
      const disponivel = await Sharing.isAvailableAsync();
      if (disponivel) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Tabela de referência' });
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
          <Text style={styles.botaoTexto}>📄 Exportar tabela em PDF</Text>
        )}
      </Pressable>
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    centralizador: {
      ...Platform.select({ web: { alignItems: 'center' as const } }),
    },
    botao: {
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      ...Platform.select({ web: { width: '100%' as const, maxWidth: 360 } }),
    },
    botaoTexto: {
      color: c.primary,
      fontWeight: '600',
      fontSize: 14,
    },
  });
}
