import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MelhoresMarcasLista } from '@/components/melhores-marcas-lista';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { api, ApiError } from '@/lib/api';
import type { Cores } from '@/lib/theme';
import { CATEGORIA_LABEL, type Categoria, type MelhorMarca } from '@/lib/types';

type Dados = {
  atleta: { id: string; nome: string; categoria: Categoria };
  marcas: MelhorMarca[];
};

export default function AtletaMarcasScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    api
      .melhoresMarcasAtleta(token!, id)
      .then((res) => {
        if (ativo) setDados(res);
      })
      .catch((error: unknown) => {
        if (ativo) setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar as marcas.');
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
    <ScrollView contentContainerStyle={styles.lista}>
      <View style={styles.headerContainer}>
        <Text style={styles.nome}>{dados.atleta.nome}</Text>
        <Text style={styles.categoria}>{CATEGORIA_LABEL[dados.atleta.categoria]}</Text>
      </View>

      <MelhoresMarcasLista marcas={dados.marcas} vazioTexto="Esse atleta ainda não cadastrou nenhuma marca." />
    </ScrollView>
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
    lista: {
      padding: 16,
      flexGrow: 1,
    },
    headerContainer: {
      gap: 6,
      marginBottom: 16,
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
