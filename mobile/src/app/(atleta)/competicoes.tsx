import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { EstadoErro } from '@/components/estado-erro';
import { MelhorTempoCard } from '@/components/melhor-tempo-card';
import { ResultadoCompeticaoCard } from '@/components/resultado-competicao-card';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { api, ApiError } from '@/lib/api';
import type { Cores } from '@/lib/theme';
import type { MelhorTempoPorProva, ResultadoCompeticao } from '@/lib/types';

type Aba = 'melhores' | 'historico';

export default function CompeticoesScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  const [aba, setAba] = useState<Aba>('melhores');
  const [melhores, setMelhores] = useState<MelhorTempoPorProva[] | null>(null);
  const [historico, setHistorico] = useState<ResultadoCompeticao[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!token) return;
    try {
      const [melhoresRes, historicoRes] = await Promise.all([
        api.meusMelhoresTempos(token),
        api.meusResultadosCompeticao(token),
      ]);
      setMelhores(melhoresRes.melhores);
      setHistorico(historicoRes.resultados);
      setErro(null);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar as competições.');
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  const carregando = aba === 'melhores' ? !melhores && !erro : !historico && !erro;

  return (
    <View style={styles.tela}>
      <View style={styles.abas}>
        <Pressable style={[styles.aba, aba === 'melhores' && styles.abaAtiva]} onPress={() => setAba('melhores')}>
          <Text style={[styles.abaTexto, aba === 'melhores' && styles.abaTextoAtiva]}>Meus melhores tempos</Text>
        </Pressable>
        <Pressable style={[styles.aba, aba === 'historico' && styles.abaAtiva]} onPress={() => setAba('historico')}>
          <Text style={[styles.abaTexto, aba === 'historico' && styles.abaTextoAtiva]}>Histórico completo</Text>
        </Pressable>
      </View>

      {carregando ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : null}

      {erro && !melhores && !historico ? <EstadoErro mensagem={erro} aoTentarNovamente={carregar} /> : null}
      {erro && (melhores || historico) ? (
        <View style={styles.avisoBanner}>
          <Text style={styles.avisoBannerTexto}>{erro}</Text>
        </View>
      ) : null}

      {aba === 'melhores' && melhores ? (
        <FlatList
          data={melhores}
          keyExtractor={(item) => item.resultadoId}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.vazioTexto}>Você ainda não cadastrou nenhum resultado de competição.</Text>
            </View>
          }
          renderItem={({ item }) => <MelhorTempoCard melhor={item} />}
        />
      ) : null}

      {aba === 'historico' && historico ? (
        <FlatList
          data={historico}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.vazioTexto}>Você ainda não cadastrou nenhum resultado de competição.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ResultadoCompeticaoCard
              resultado={item}
              onPress={() => router.push({ pathname: '/competicao/[id]', params: { id: item.id } })}
            />
          )}
        />
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
    abas: {
      flexDirection: 'row',
      padding: 16,
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
    },
    aba: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.borderInput,
      borderRadius: 16,
      paddingVertical: 8,
      alignItems: 'center',
    },
    abaAtiva: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    abaTexto: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textMuted,
    },
    abaTextoAtiva: {
      color: c.onPrimary,
    },
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
    avisoBanner: {
      backgroundColor: c.dangerSoft,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    avisoBannerTexto: {
      color: c.danger,
      fontSize: 13,
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
  });
}
