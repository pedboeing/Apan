import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { EstadoErro } from '@/components/estado-erro';
import { TreinoResumoCard } from '@/components/treino-resumo-card';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { api, ApiError } from '@/lib/api';
import type { Cores } from '@/lib/theme';
import { LIMITE_FREQUENCIA_BAIXA, type FrequenciaAtleta, type TreinoComRegistros } from '@/lib/types';

export default function MeuHistoricoScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const [treinos, setTreinos] = useState<TreinoComRegistros[] | null>(null);
  const [frequencia, setFrequencia] = useState<FrequenciaAtleta | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!token) return;
    try {
      const [historico, minhaFrequencia] = await Promise.all([api.meuHistorico(token), api.minhaFrequencia(token)]);
      setTreinos(historico.treinos);
      setFrequencia(minhaFrequencia);
      setErro(null);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar o histórico.');
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  if (!treinos && !erro) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (erro && !treinos) {
    return <EstadoErro mensagem={erro} aoTentarNovamente={carregar} />;
  }

  const frequenciaBaixa = frequencia?.percentual !== null && (frequencia?.percentual ?? 100) < LIMITE_FREQUENCIA_BAIXA;

  return (
    <FlatList
      data={treinos ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.lista}
      ListHeaderComponent={
        <View style={styles.headerContainer}>
          {frequencia && frequencia.totalTreinos > 0 ? (
            <View style={[styles.frequenciaCard, frequenciaBaixa && styles.frequenciaCardBaixa]}>
              <Text style={styles.frequenciaTitulo}>Minha frequência</Text>
              <Text style={styles.frequenciaTexto}>
                {frequencia.totalPresente} de {frequencia.totalTreinos} treinos no último mês
                {frequencia.percentual !== null ? ` · ${frequencia.percentual}%` : ''}
              </Text>
            </View>
          ) : null}

          <Text style={styles.subtitulo}>Treinos respondidos e ausências</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.vazioTitulo}>Nenhum registro ainda</Text>
          <Text style={styles.vazioTexto}>Os treinos que você responder (ou faltar) aparecem aqui.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TreinoResumoCard
          treino={item}
          onPress={() => router.push({ pathname: '/treino/[id]', params: { id: item.id } })}
        />
      )}
    />
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 6,
    },
    erro: {
      color: c.danger,
      fontSize: 14,
      textAlign: 'center',
    },
    vazioTitulo: {
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
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
    headerContainer: {
      gap: 12,
      marginBottom: 4,
    },
    frequenciaCard: {
      borderWidth: 1,
      borderColor: c.border,
      borderLeftWidth: 4,
      borderLeftColor: c.success,
      borderRadius: 12,
      padding: 14,
      backgroundColor: c.surface,
    },
    frequenciaCardBaixa: {
      borderLeftColor: c.danger,
    },
    frequenciaTitulo: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
    },
    frequenciaTexto: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: 2,
    },
    subtitulo: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
    },
  });
}
