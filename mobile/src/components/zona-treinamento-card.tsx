import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/theme-context';
import { formatarTempo } from '@/lib/tempo';
import type { Cores } from '@/lib/theme';
import { formatarProva, type ProvaComZonas } from '@/lib/types';

// A1/A2 = aeróbico leve/moderado (verde), CA3/PA3 = capacidade/potência
// aeróbica (âmbar), AN = anaeróbico (vermelho) — mesma lógica de cores do
// LEVE/MODERADO/INTENSO já usada na tela de intensidade, só que em 5 graus.
function corDaZona(c: Cores, zona: string): { cor: string; corSuave: string } {
  if (zona === 'A1' || zona === 'A2') return { cor: c.success, corSuave: c.successSoft };
  if (zona === 'CA3' || zona === 'PA3') return { cor: c.warning, corSuave: c.warningSoft };
  return { cor: c.danger, corSuave: c.dangerSoft };
}

type Props = {
  prova: ProvaComZonas;
  // Cor de destaque da lateral do card — quem chama passa a cor da aba
  // (piscina de 50m ou 25m) ativa no momento.
  cor?: string;
};

export function ZonaTreinamentoCard({ prova, cor }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const corDestaque = cor ?? colors.primary;

  return (
    <View style={[styles.card, { borderLeftColor: corDestaque }]}>
      <Text style={styles.titulo}>{formatarProva(prova.estilo, prova.distancia)}</Text>
      {prova.melhorTempoCentesimos !== null ? (
        <Text style={styles.subtitulo}>Melhor tempo: {formatarTempo(prova.melhorTempoCentesimos)}</Text>
      ) : null}

      {prova.zonas.length > 0 ? (
        <View style={styles.zonas}>
          {prova.zonas.map((z) => {
            const { cor, corSuave } = corDaZona(colors, z.zona);
            return (
              <View key={z.zona} style={styles.zonaLinha}>
                <View style={[styles.zonaBadge, { backgroundColor: corSuave }]}>
                  <Text style={[styles.zonaBadgeTexto, { color: cor }]}>{z.zona}</Text>
                </View>
                <View style={styles.zonaTextos}>
                  <Text style={styles.zonaTempo}>
                    {formatarTempo(z.tempoRapidoCentesimos)} – {formatarTempo(z.tempoLentoCentesimos)}
                  </Text>
                  <Text style={styles.zonaDescricao}>
                    {z.descricao} · {z.percentualMin}%–{z.percentualMax}% do melhor tempo
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.vazioTexto}>Cadastre uma marca pra essa prova pra ver as zonas de treinamento.</Text>
      )}
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: c.border,
      borderLeftWidth: 4,
      borderRadius: 12,
      padding: 14,
      gap: 4,
      backgroundColor: c.surface,
    },
    titulo: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
    },
    subtitulo: {
      fontSize: 12,
      color: c.textMuted,
      marginBottom: 6,
    },
    zonas: {
      gap: 8,
      marginTop: 6,
    },
    zonaLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    zonaBadge: {
      minWidth: 44,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 8,
      alignItems: 'center',
    },
    zonaBadgeTexto: {
      fontSize: 12,
      fontWeight: '700',
    },
    zonaTextos: {
      flex: 1,
      gap: 1,
    },
    zonaTempo: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
    },
    zonaDescricao: {
      fontSize: 11,
      color: c.textMuted,
    },
    vazioTexto: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: 4,
    },
  });
}
