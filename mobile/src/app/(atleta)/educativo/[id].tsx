import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { EducativoDetalhe } from '@/components/educativo-detalhe';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { api, ApiError } from '@/lib/api';
import type { Cores } from '@/lib/theme';
import type { Educativo } from '@/lib/types';

export default function EducativoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const [educativo, setEducativo] = useState<Educativo | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      api
        .obterEducativo(token!, id)
        .then((res) => {
          if (ativo) setEducativo(res.educativo);
        })
        .catch((error: unknown) => {
          if (ativo) setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar o educativo.');
        });
      return () => {
        ativo = false;
      };
    }, [id, token]),
  );

  if (erro) {
    return (
      <View style={styles.center}>
        <Text style={styles.erro}>{erro}</Text>
      </View>
    );
  }

  if (!educativo) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return <EducativoDetalhe educativo={educativo} />;
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
