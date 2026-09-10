import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { IntensidadeItemRow } from '@/components/intensidade-item-row';
import { IntensidadeResumoCard } from '@/components/intensidade-resumo-card';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { api, ApiError } from '@/lib/api';
import type { Cores } from '@/lib/theme';
import { CATEGORIA_LABEL, type IntensidadeTecnicoResponse } from '@/lib/types';

export default function AtletaIntensidadeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const [dados, setDados] = useState<IntensidadeTecnicoResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    api
      .intensidadeAtleta(token!, id)
      .then((res) => {
        if (ativo) setDados(res);
      })
      .catch((error: unknown) => {
        if (ativo) setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar a intensidade.');
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
      data={dados.itens}
      keyExtractor={(item) => item.registroId}
      contentContainerStyle={styles.lista}
      ListHeaderComponent={
        <View style={styles.headerContainer}>
          <Text style={styles.nome}>{dados.atleta.nome}</Text>
          <Text style={styles.categoria}>{CATEGORIA_LABEL[dados.atleta.categoria]}</Text>
          <Pressable
            style={styles.linkCompeticoes}
            onPress={() => router.push({ pathname: '/atleta/[id]/competicoes', params: { id } })}
          >
            <Text style={styles.linkCompeticoesTexto}>Ver histórico de competições →</Text>
          </Pressable>
          <Pressable
            style={styles.linkCompeticoes}
            onPress={() => router.push({ pathname: '/atleta/[id]/marcas', params: { id } })}
          >
            <Text style={styles.linkCompeticoesTexto}>Ver melhores marcas →</Text>
          </Pressable>
          <Pressable
            style={styles.linkCompeticoes}
            onPress={() => router.push({ pathname: '/atleta/[id]/referencia', params: { id } })}
          >
            <Text style={styles.linkCompeticoesTexto}>Ver tabela de referência →</Text>
          </Pressable>
          <IntensidadeResumoCard resumo={dados.resumo} />
          <Text style={styles.subtitulo}>Histórico de tiros</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.vazioTexto}>Esse atleta ainda não registrou nenhum tempo.</Text>
        </View>
      }
      renderItem={({ item }) => <IntensidadeItemRow item={item} />}
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
      flexGrow: 1,
    },
    headerContainer: {
      gap: 10,
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
    linkCompeticoes: {
      alignSelf: 'flex-start',
    },
    linkCompeticoesTexto: {
      color: c.primary,
      fontWeight: '600',
      fontSize: 14,
    },
    subtitulo: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
      marginTop: 8,
    },
  });
}
