import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { ResultadoCompeticaoCard } from '@/components/resultado-competicao-card';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { api, ApiError } from '@/lib/api';
import type { Cores } from '@/lib/theme';
import { CATEGORIA_LABEL, type Categoria, type ResultadoCompeticao } from '@/lib/types';

type Dados = {
  atleta: { id: string; nome: string; categoria: Categoria };
  resultados: ResultadoCompeticao[];
};

export default function AtletaCompeticoesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    api
      .resultadosCompeticaoAtleta(token!, id)
      .then((res) => {
        if (ativo) setDados(res);
      })
      .catch((error: unknown) => {
        if (ativo) setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar o histórico.');
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

  return (
    <FlatList
      data={dados.resultados}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.lista}
      ListHeaderComponent={
        <View style={styles.headerContainer}>
          <Text style={styles.nome}>{dados.atleta.nome}</Text>
          <Text style={styles.categoria}>{CATEGORIA_LABEL[dados.atleta.categoria]}</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.vazioTexto}>Esse atleta ainda não cadastrou nenhum resultado de competição.</Text>
        </View>
      }
      renderItem={({ item }) => <ResultadoCompeticaoCard resultado={item} />}
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
    headerContainer: {
      gap: 6,
      marginBottom: 8,
    },
    nome: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
    },
    categoria: {
      fontSize: 12,
      fontWeight: '600',
      color: c.primary,
      alignSelf: 'flex-start',
      backgroundColor: c.primarySoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      overflow: 'hidden',
    },
  });
}
