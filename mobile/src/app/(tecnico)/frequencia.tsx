import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EstadoErro } from '@/components/estado-erro';
import { PainelFiltros } from '@/components/painel-filtros';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { api, ApiError } from '@/lib/api';
import type { Cores } from '@/lib/theme';
import {
  CATEGORIAS,
  CATEGORIA_LABEL,
  LIMITE_FREQUENCIA_BAIXA,
  PERIODOS_FREQUENCIA,
  type Categoria,
  type FrequenciaGrupoAtleta,
  type FrequenciaGrupoResponse,
  type PeriodoFrequencia,
} from '@/lib/types';

function formatarDia(iso: string): string {
  return iso.slice(8, 10);
}

export default function FrequenciaScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  const [categoria, setCategoria] = useState<Categoria>('JUVENIL_1');
  const [periodo, setPeriodo] = useState<PeriodoFrequencia>('mes');
  const [dados, setDados] = useState<FrequenciaGrupoResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.frequenciaGrupo(token, categoria, periodo);
      setDados(res);
      setErro(null);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar a frequência.');
    }
  }, [token, categoria, periodo]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  async function handleTogglePresenca(atletaId: string, treinoId: string, presenteAtual: boolean) {
    if (!token || salvando) return;
    setSalvando(true);
    try {
      await api.marcarPresenca(token, { atletaId, treinoId, presente: !presenteAtual });
      await carregar();
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível atualizar a presença.');
    } finally {
      setSalvando(false);
    }
  }

  const periodoLabel = PERIODOS_FREQUENCIA.find((p) => p.valor === periodo)?.label ?? periodo;

  return (
    <View style={styles.tela}>
      <PainelFiltros titulo="Grupo e período" resumo={`${CATEGORIA_LABEL[categoria]} · ${periodoLabel}`}>
        <Text style={styles.label}>Grupo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chips}>
            {CATEGORIAS.map((c) => (
              <Pressable
                key={c}
                style={[styles.chip, categoria === c && styles.chipAtivo]}
                onPress={() => setCategoria(c)}
              >
                <Text style={[styles.chipTexto, categoria === c && styles.chipTextoAtivo]}>{CATEGORIA_LABEL[c]}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.label}>Período</Text>
        <View style={styles.chips}>
          {PERIODOS_FREQUENCIA.map((p) => (
            <Pressable
              key={p.valor}
              style={[styles.chip, periodo === p.valor && styles.chipAtivo]}
              onPress={() => setPeriodo(p.valor)}
            >
              <Text style={[styles.chipTexto, periodo === p.valor && styles.chipTextoAtivo]}>{p.label}</Text>
            </Pressable>
          ))}
        </View>
      </PainelFiltros>

      {!dados && !erro ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : null}

      {erro && !dados ? <EstadoErro mensagem={erro} aoTentarNovamente={carregar} /> : null}
      {erro && dados ? (
        <View style={styles.avisoBanner}>
          <Text style={styles.avisoBannerTexto}>{erro}</Text>
        </View>
      ) : null}

      {dados ? (
        <FlatList
          data={dados.atletas}
          keyExtractor={(item) => item.atletaId}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.vazioTexto}>Nenhum atleta nesse grupo ainda.</Text>
            </View>
          }
          ListHeaderComponent={
            dados.treinos.length === 0 ? (
              <Text style={styles.semTreinos}>Nenhum treino desse grupo nesse período.</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <FrequenciaAtletaCard
              atleta={item}
              treinos={dados.treinos}
              onTogglePresenca={(treinoId) => handleTogglePresenca(item.atletaId, treinoId, item.presencasPorTreino[treinoId])}
              desabilitado={salvando}
            />
          )}
        />
      ) : null}
    </View>
  );
}

type CardProps = {
  atleta: FrequenciaGrupoAtleta;
  treinos: FrequenciaGrupoResponse['treinos'];
  onTogglePresenca: (treinoId: string) => void;
  desabilitado: boolean;
};

function FrequenciaAtletaCard({ atleta, treinos, onTogglePresenca, desabilitado }: CardProps) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const baixa = atleta.percentual !== null && atleta.percentual < LIMITE_FREQUENCIA_BAIXA;

  return (
    <View style={[styles.card, baixa && styles.cardBaixa]}>
      <View style={styles.cardHeader}>
        <Text style={styles.nome}>{atleta.nome}</Text>
        <View style={[styles.percentualBadge, { backgroundColor: baixa ? colors.dangerSoft : colors.successSoft }]}>
          <Text style={[styles.percentualTexto, { color: baixa ? colors.danger : colors.success }]}>
            {atleta.percentual !== null ? `${atleta.percentual}%` : '—'}
          </Text>
        </View>
      </View>
      <Text style={styles.detalhe}>
        {atleta.totalPresente} de {atleta.totalTreinos} treinos
      </Text>

      {treinos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dotsContainer}>
          {treinos.map((t) => {
            const presente = atleta.presencasPorTreino[t.id];
            return (
              <Pressable
                key={t.id}
                disabled={desabilitado}
                onPress={() => onTogglePresenca(t.id)}
                style={[styles.dot, { backgroundColor: presente ? colors.successSoft : colors.border }]}
              >
                <Text style={[styles.dotTexto, { color: presente ? colors.success : colors.textMuted }]}>
                  {formatarDia(t.data)}
                </Text>
              </Pressable>
            );
          })}
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
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textMuted,
      marginTop: 6,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      borderWidth: 1,
      borderColor: c.borderInput,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    chipAtivo: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    chipTexto: {
      fontSize: 13,
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
    semTreinos: {
      fontSize: 13,
      color: c.textMuted,
      textAlign: 'center',
      marginBottom: 8,
    },
    lista: {
      padding: 16,
      gap: 12,
      flexGrow: 1,
    },
    card: {
      borderWidth: 1,
      borderColor: c.border,
      borderLeftWidth: 4,
      borderLeftColor: c.border,
      borderRadius: 12,
      padding: 14,
      gap: 6,
      backgroundColor: c.surface,
      marginBottom: 12,
    },
    cardBaixa: {
      borderLeftColor: c.danger,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    nome: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    percentualBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    percentualTexto: {
      fontSize: 13,
      fontWeight: '700',
    },
    detalhe: {
      fontSize: 12,
      color: c.textMuted,
    },
    dotsContainer: {
      gap: 6,
      marginTop: 6,
    },
    dot: {
      width: 34,
      height: 34,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotTexto: {
      fontSize: 12,
      fontWeight: '700',
    },
  });
}
