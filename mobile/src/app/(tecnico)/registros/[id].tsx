import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { api, ApiError } from '@/lib/api';
import { formatarTempo } from '@/lib/tempo';
import type { Cores } from '@/lib/theme';
import { BLOCOS, ESTILO_LABEL, STATUS_ATLETA_LABEL, type AtletaRegistro, type RegistrosTreinoResponse } from '@/lib/types';

export default function RegistrosTreinoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const [dados, setDados] = useState<RegistrosTreinoResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    api
      .registrosDoTreino(token!, id)
      .then((res) => {
        if (ativo) setDados(res);
      })
      .catch((error: unknown) => {
        if (ativo) setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar os registros.');
      });
    return () => {
      ativo = false;
    };
  }, [id, token]);

  if (erro) {
    return (
      <View style={styles.center}>
        <Text style={styles.erro}>{erro}</Text>
      </View>
    );
  }

  if (!dados) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const respondidos = dados.atletas.filter((a) => a.status === 'RESPONDIDO').length;
  const ausentes = dados.atletas.filter((a) => a.status === 'AUSENTE').length;

  return (
    <FlatList
      data={dados.atletas}
      keyExtractor={(item) => item.atletaId}
      contentContainerStyle={styles.lista}
      ListHeaderComponent={
        <Text style={styles.resumo}>
          {respondidos} de {dados.atletas.length} atletas já responderam
          {ausentes > 0 ? ` · ${ausentes} ausente${ausentes > 1 ? 's' : ''}` : ''}
        </Text>
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.vazioTexto}>Nenhum atleta cadastrado nesse grupo ainda.</Text>
        </View>
      }
      renderItem={({ item }) => <AtletaRegistroCard atleta={item} />}
    />
  );
}

function AtletaRegistroCard({ atleta }: { atleta: AtletaRegistro }) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const [expandido, setExpandido] = useState(false);
  const blocosComTempo = BLOCOS.filter((b) => atleta.tempos.some((t) => t.bloco === b.key));
  const respondeu = atleta.status === 'RESPONDIDO';

  // Só quem já respondeu tem algo pra mostrar — pendente ou ausente, a caixa
  // fica só com nome + selo, sem abrir (não tem tiro nem PSE nenhum dos
  // dois casos).
  function handlePress() {
    if (!respondeu) return;
    setExpandido((atual) => !atual);
  }

  const badgeEstilo =
    atleta.status === 'RESPONDIDO' ? styles.badgeRespondeu : atleta.status === 'AUSENTE' ? styles.badgeAusente : styles.badgePendente;

  return (
    <Pressable style={styles.card} onPress={handlePress} disabled={!respondeu} accessibilityRole={respondeu ? 'button' : undefined}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardNome}>{atleta.nome}</Text>
        <View style={styles.cardHeaderDireita}>
          <Text style={badgeEstilo}>{STATUS_ATLETA_LABEL[atleta.status].toLowerCase()}</Text>
          {respondeu ? <Text style={styles.seta}>{expandido ? '▾' : '▸'}</Text> : null}
        </View>
      </View>

      {expandido ? (
        <View style={styles.detalhe}>
          <Text style={styles.cardPse}>
            PSE: {atleta.pse}
            {atleta.qualidadeSono ? ` · Sono: ${atleta.qualidadeSono}` : ''}
          </Text>

          {blocosComTempo.map((bloco) => {
            const tempos = atleta.tempos.filter((t) => t.bloco === bloco.key);
            return (
              <View key={bloco.key} style={styles.blocoTempos}>
                <Text style={styles.blocoTitulo}>{bloco.label}</Text>
                {tempos.map((t) => (
                  <Text key={t.id} style={styles.tiroLinha}>
                    {t.distancia}{t.estilo ? ` · ${ESTILO_LABEL[t.estilo]}` : ''} — {formatarTempo(t.tempoCentesimos)}
                  </Text>
                ))}
              </View>
            );
          })}
        </View>
      ) : null}
    </Pressable>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    erro: {
      color: c.danger,
      fontSize: 14,
      textAlign: 'center',
    },
    vazioTexto: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: 'center',
    },
    lista: {
      padding: 16,
      gap: 12,
      flexGrow: 1,
    },
    resumo: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textMuted,
      marginBottom: 8,
    },
    card: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      gap: 6,
      backgroundColor: c.surface,
      marginBottom: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardHeaderDireita: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    seta: {
      fontSize: 13,
      color: c.textMuted,
    },
    cardNome: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    badgeRespondeu: {
      fontSize: 11,
      fontWeight: '600',
      color: c.success,
      backgroundColor: c.successSoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      overflow: 'hidden',
    },
    badgePendente: {
      fontSize: 11,
      fontWeight: '600',
      color: c.warning,
      backgroundColor: c.warningSoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      overflow: 'hidden',
    },
    badgeAusente: {
      fontSize: 11,
      fontWeight: '600',
      color: c.danger,
      backgroundColor: c.dangerSoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      overflow: 'hidden',
    },
    detalhe: {
      gap: 10,
      marginTop: 4,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    cardPse: {
      fontSize: 13,
      color: c.primary,
      fontWeight: '600',
    },
    blocoTempos: {
      gap: 4,
    },
    blocoTitulo: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    tiroLinha: {
      fontSize: 14,
      color: c.text,
      paddingVertical: 4,
      paddingHorizontal: 10,
      backgroundColor: c.background,
      borderRadius: 6,
    },
  });
}
