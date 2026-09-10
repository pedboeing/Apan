import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EstadoErro } from '@/components/estado-erro';
import { MelhoresMarcasLista } from '@/components/melhores-marcas-lista';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { api, ApiError } from '@/lib/api';
import type { Cores } from '@/lib/theme';
import type { MelhorMarca } from '@/lib/types';

export default function MarcasScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  const [marcas, setMarcas] = useState<MelhorMarca[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.minhasMelhoresMarcas(token);
      setMarcas(res.marcas);
      setErro(null);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar suas marcas.');
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  return (
    <View style={styles.tela}>
      {!marcas && !erro ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : null}

      {erro && !marcas ? <EstadoErro mensagem={erro} aoTentarNovamente={carregar} /> : null}

      {marcas ? (
        <ScrollView contentContainerStyle={styles.lista}>
          {erro ? (
            <View style={styles.avisoBanner}>
              <Text style={styles.avisoBannerTexto}>{erro}</Text>
            </View>
          ) : null}
          <MelhoresMarcasLista
            marcas={marcas}
            vazioTexto="Você ainda não cadastrou nenhuma marca. Toque no + para adicionar seu melhor tempo numa prova."
            onPressMarca={(marca) => router.push({ pathname: '/marca/[id]', params: { id: marca.id } })}
          />
        </ScrollView>
      ) : null}
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    tela: {
      flex: 1,
      backgroundColor: c.background,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    avisoBanner: {
      backgroundColor: c.dangerSoft,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      marginBottom: 12,
    },
    avisoBannerTexto: {
      color: c.danger,
      fontSize: 13,
      textAlign: 'center',
    },
    lista: {
      padding: 16,
      flexGrow: 1,
    },
  });
}
