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
import type { TreinoComRegistros } from '@/lib/types';

export default function MeuTreinoScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const [treinos, setTreinos] = useState<TreinoComRegistros[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.meuTreino(token);
      setTreinos(res.treinos);
      setErro(null);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar o treino.');
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

  return (
    <FlatList
      data={treinos ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.lista}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.vazioTitulo}>Nenhum treino disponível</Text>
          <Text style={styles.vazioTexto}>
            Assim que seu técnico montar um treino para o seu grupo, ele aparece aqui.
          </Text>
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
  });
}
