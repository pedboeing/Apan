import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ResultadoCompeticaoForm } from '@/components/resultado-competicao-form';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { api, ApiError } from '@/lib/api';
import type { Cores } from '@/lib/theme';
import type { ResultadoCompeticao } from '@/lib/types';

export default function EditarResultadoCompeticaoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const [resultado, setResultado] = useState<ResultadoCompeticao | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    api
      .obterResultadoCompeticao(token!, id)
      .then((res) => {
        if (ativo) setResultado(res.resultado);
      })
      .catch((error: unknown) => {
        if (ativo) setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar o resultado.');
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

  if (!resultado) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ResultadoCompeticaoForm
      inicial={resultado}
      submitLabel="Salvar alterações"
      onSubmit={async (dados) => {
        await api.atualizarResultadoCompeticao(token!, id, dados);
        router.back();
      }}
      onExcluir={async () => {
        await api.excluirResultadoCompeticao(token!, id);
        router.back();
      }}
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
      backgroundColor: c.background,
    },
    erro: {
      color: c.danger,
      fontSize: 14,
      textAlign: 'center',
    },
  });
}
