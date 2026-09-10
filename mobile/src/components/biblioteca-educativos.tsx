import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EstadoErro } from '@/components/estado-erro';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { api, ApiError } from '@/lib/api';
import type { Cores } from '@/lib/theme';
import { ESTILOS_EDUCATIVO, ESTILO_LABEL, type Educativo, type Estilo } from '@/lib/types';

export function BibliotecaEducativos() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  const [estilo, setEstilo] = useState<Estilo>(ESTILOS_EDUCATIVO[0]);
  const [educativos, setEducativos] = useState<Educativo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.listarEducativos(token, estilo);
      setEducativos(res.educativos);
      setErro(null);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar a biblioteca.');
    }
  }, [token, estilo]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  return (
    <View style={styles.tela}>
      <View style={styles.abas}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chips}>
            {ESTILOS_EDUCATIVO.map((e) => (
              <Pressable
                key={e}
                style={[styles.chip, estilo === e && styles.chipAtivo]}
                onPress={() => setEstilo(e)}
              >
                <Text style={[styles.chipTexto, estilo === e && styles.chipTextoAtivo]}>{ESTILO_LABEL[e]}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {!educativos && !erro ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : null}

      {erro && !educativos ? <EstadoErro mensagem={erro} aoTentarNovamente={carregar} /> : null}
      {erro && educativos ? (
        <View style={styles.avisoBanner}>
          <Text style={styles.avisoBannerTexto}>{erro}</Text>
        </View>
      ) : null}

      {educativos ? (
        <FlatList
          data={educativos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.vazioTexto}>Nenhum educativo cadastrado ainda para {ESTILO_LABEL[estilo]}.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push({ pathname: '/educativo/[id]', params: { id: item.id } })}
            >
              <Text style={styles.nome}>{item.nome}</Text>
              <Text style={styles.descricao} numberOfLines={2}>
                {item.descricaoObjetivo}
              </Text>
            </Pressable>
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
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
    },
    chips: {
      flexDirection: 'row',
      gap: 8,
    },
    chip: {
      borderWidth: 1,
      borderColor: c.borderInput,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    chipAtivo: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    chipTexto: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textMuted,
    },
    chipTextoAtivo: {
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
      marginHorizontal: 16,
      marginTop: 12,
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
    },
    card: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      gap: 4,
      backgroundColor: c.surface,
    },
    nome: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    descricao: {
      fontSize: 13,
      color: c.textMuted,
    },
  });
}
