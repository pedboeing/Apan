import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { EstadoErro } from '@/components/estado-erro';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { api, ApiError } from '@/lib/api';
import type { Cores } from '@/lib/theme';
import { ESTILO_LABEL, STATUS_EDUCATIVO_LABEL, type Educativo, type StatusEducativo } from '@/lib/types';

function corDoStatus(c: Cores, status: StatusEducativo): { cor: string; corSuave: string } {
  if (status === 'PUBLICADO') return { cor: c.success, corSuave: c.successSoft };
  if (status === 'REJEITADO') return { cor: c.danger, corSuave: c.dangerSoft };
  return { cor: c.warning, corSuave: c.warningSoft };
}

export default function MinhasSugestoesScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  const [educativos, setEducativos] = useState<Educativo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.minhasSugestoes(token);
      setEducativos(res.educativos);
      setErro(null);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar suas sugestões.');
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

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
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.vazioTexto}>Você ainda não sugeriu nenhum educativo.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const { cor, corSuave } = corDoStatus(colors, item.status);
        return (
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.estiloBadge}>
                <Text style={styles.estiloTexto}>{ESTILO_LABEL[item.estilo]}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: corSuave }]}>
                <Text style={[styles.statusTexto, { color: cor }]}>{STATUS_EDUCATIVO_LABEL[item.status]}</Text>
              </View>
            </View>
            <Text style={styles.nome}>{item.nome}</Text>
            <Text style={styles.descricao} numberOfLines={2}>
              {item.descricaoObjetivo}
            </Text>
          </View>
        );
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
      gap: 4,
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
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    statusTexto: {
      fontSize: 11,
      fontWeight: '700',
    },
    nome: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
      marginTop: 4,
    },
    descricao: {
      fontSize: 13,
      color: c.textMuted,
    },
  });
}
