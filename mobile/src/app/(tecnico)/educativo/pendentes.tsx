import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { EstadoErro } from '@/components/estado-erro';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { api, ApiError } from '@/lib/api';
import type { Cores } from '@/lib/theme';
import { ESTILO_LABEL, type EducativoPendente } from '@/lib/types';

export default function EducativosPendentesScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  const [educativos, setEducativos] = useState<EducativoPendente[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.educativosPendentes(token);
      setEducativos(res.educativos);
      setErro(null);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar a fila de aprovação.');
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  async function handleAprovar(id: string) {
    if (!token) return;
    setProcessando(id);
    try {
      await api.aprovarEducativo(token, id);
      await carregar();
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível aprovar o educativo.');
    } finally {
      setProcessando(null);
    }
  }

  async function handleRejeitar(id: string) {
    if (!token) return;
    setProcessando(id);
    try {
      await api.rejeitarEducativo(token, id);
      await carregar();
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível rejeitar o educativo.');
    } finally {
      setProcessando(null);
    }
  }

  if (!educativos && !erro) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (erro && !educativos) {
    return <EstadoErro mensagem={erro} aoTentarNovamente={carregar} />;
  }

  return (
    <FlatList
      data={educativos ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.lista}
      ListHeaderComponent={
        erro ? (
          <View style={styles.avisoBanner}>
            <Text style={styles.avisoBannerTexto}>{erro}</Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.vazioTexto}>Nenhuma sugestão pendente no momento.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Pressable onPress={() => router.push({ pathname: '/educativo/[id]', params: { id: item.id } })}>
            <View style={styles.header}>
              <View style={styles.estiloBadge}>
                <Text style={styles.estiloTexto}>{ESTILO_LABEL[item.estilo]}</Text>
              </View>
              <Text style={styles.autor}>sugerido por {item.autorNome}</Text>
            </View>
            <Text style={styles.nome}>{item.nome}</Text>
            <Text style={styles.descricao} numberOfLines={2}>
              {item.descricaoObjetivo}
            </Text>
          </Pressable>

          <View style={styles.acoes}>
            <Pressable
              style={styles.botaoRejeitar}
              onPress={() => handleRejeitar(item.id)}
              disabled={processando === item.id}
            >
              {processando === item.id ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <Text style={styles.botaoRejeitarTexto}>Rejeitar</Text>
              )}
            </Pressable>
            <Pressable
              style={styles.botaoAprovar}
              onPress={() => handleAprovar(item.id)}
              disabled={processando === item.id}
            >
              {processando === item.id ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Text style={styles.botaoAprovarTexto}>Aprovar</Text>
              )}
            </Pressable>
          </View>
        </View>
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
      backgroundColor: c.background,
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
      marginBottom: 12,
      borderRadius: 8,
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
      backgroundColor: c.background,
    },
    card: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      gap: 10,
      backgroundColor: c.surface,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    estiloBadge: {
      backgroundColor: c.primarySoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    estiloTexto: {
      fontSize: 11,
      fontWeight: '700',
      color: c.primary,
    },
    autor: {
      fontSize: 12,
      color: c.textMuted,
    },
    nome: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
      marginTop: 6,
    },
    descricao: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: 2,
    },
    acoes: {
      flexDirection: 'row',
      gap: 10,
    },
    botaoRejeitar: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.danger,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
    },
    botaoRejeitarTexto: {
      color: c.danger,
      fontWeight: '600',
      fontSize: 13,
    },
    botaoAprovar: {
      flex: 1,
      backgroundColor: c.primary,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
    },
    botaoAprovarTexto: {
      color: c.onPrimary,
      fontWeight: '600',
      fontSize: 13,
    },
  });
}
