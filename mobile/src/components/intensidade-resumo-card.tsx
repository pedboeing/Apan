import { StyleSheet, Text, View } from 'react-native';

import { IntensidadeBadge } from '@/components/intensidade-badge';
import { useTheme } from '@/context/theme-context';
import type { Cores } from '@/lib/theme';
import { classificarFaixaCliente, type ResumoIntensidade } from '@/lib/types';

type Props = {
  resumo: ResumoIntensidade;
};

export function IntensidadeResumoCard({ resumo }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Intensidade da semana</Text>

      {resumo.mediaSemana !== null ? (
        <View style={styles.linha}>
          <Text style={styles.media}>{resumo.mediaSemana}%</Text>
          <IntensidadeBadge faixa={classificarFaixaCliente(resumo.mediaSemana)} intensidade={resumo.mediaSemana} />
        </View>
      ) : (
        <Text style={styles.semDados}>Ainda sem dados suficientes essa semana.</Text>
      )}

      <Text style={styles.detalhe}>
        {resumo.quantidadeComReferenciaSemana} de {resumo.quantidadeTirosSemana} tiros com referência essa semana
      </Text>
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    container: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      gap: 8,
      backgroundColor: c.surface,
    },
    titulo: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
    },
    linha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    media: {
      fontSize: 26,
      fontWeight: '700',
      color: c.text,
    },
    semDados: {
      fontSize: 13,
      color: c.textMuted,
    },
    detalhe: {
      fontSize: 12,
      color: c.textMuted,
    },
  });
}
