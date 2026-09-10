import { StyleSheet, Text, View } from 'react-native';

import { MelhorMarcaCard } from '@/components/melhor-marca-card';
import { useTheme } from '@/context/theme-context';
import type { Cores } from '@/lib/theme';
import type { MelhorMarca } from '@/lib/types';

type Props = {
  marcas: MelhorMarca[];
  onPressMarca?: (marca: MelhorMarca) => void;
  vazioTexto?: string;
};

// Piscina de 50m usa a cor "primary" do tema, piscina de 25m usa "accent"
// (roxo) — as duas seções ficam visualmente distintas sem depender de texto
// pra o usuário perceber a diferença.
export function MelhoresMarcasLista({ marcas, onPressMarca, vazioTexto }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  const marcas50 = marcas.filter((m) => m.piscina === 'M50');
  const marcas25 = marcas.filter((m) => m.piscina === 'M25');

  if (marcas.length === 0) {
    return (
      <View style={styles.vazioContainer}>
        <Text style={styles.vazioTexto}>{vazioTexto ?? 'Nenhuma marca cadastrada ainda.'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.secao}>
        <View style={[styles.secaoHeader, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.secaoTitulo, { color: colors.primary }]}>🏊 Piscina 50m</Text>
        </View>
        {marcas50.length > 0 ? (
          <View style={styles.secaoLista}>
            {marcas50.map((m) => (
              <MelhorMarcaCard
                key={m.id}
                marca={m}
                cor={colors.primary}
                onPress={onPressMarca ? () => onPressMarca(m) : undefined}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.secaoVazia}>Nenhuma marca cadastrada na piscina de 50m.</Text>
        )}
      </View>

      <View style={styles.secao}>
        <View style={[styles.secaoHeader, { backgroundColor: colors.accentSoft }]}>
          <Text style={[styles.secaoTitulo, { color: colors.accent }]}>🏊 Piscina 25m</Text>
        </View>
        {marcas25.length > 0 ? (
          <View style={styles.secaoLista}>
            {marcas25.map((m) => (
              <MelhorMarcaCard
                key={m.id}
                marca={m}
                cor={colors.accent}
                onPress={onPressMarca ? () => onPressMarca(m) : undefined}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.secaoVazia}>Nenhuma marca cadastrada na piscina de 25m.</Text>
        )}
      </View>
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    container: {
      gap: 20,
    },
    secao: {
      gap: 10,
    },
    secaoHeader: {
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    secaoTitulo: {
      fontSize: 14,
      fontWeight: '800',
    },
    secaoLista: {
      gap: 10,
    },
    secaoVazia: {
      fontSize: 13,
      color: c.textMuted,
      paddingHorizontal: 2,
    },
    vazioContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    vazioTexto: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: 'center',
    },
  });
}
