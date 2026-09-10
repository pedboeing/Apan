import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EstadoErro } from '@/components/estado-erro';
import { ExportarTabelaReferenciaPdfButton } from '@/components/exportar-tabela-referencia-pdf-button';
import { ZonaTreinamentoCard } from '@/components/zona-treinamento-card';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { api, ApiError } from '@/lib/api';
import type { Cores } from '@/lib/theme';
import type { ProvaComZonas, TabelaReferenciaPorPiscina } from '@/lib/types';

type Piscina = 'M50' | 'M25';

export function TabelaReferenciaAtleta() {
  const { token, usuario } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  const [piscina, setPiscina] = useState<Piscina>('M50');
  const [tabela, setTabela] = useState<TabelaReferenciaPorPiscina | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.minhaTabelaReferencia(token);
      setTabela(res);
      setErro(null);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar sua tabela de referência.');
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  if (!tabela && !erro) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (erro && !tabela) {
    return <EstadoErro mensagem={erro} aoTentarNovamente={carregar} />;
  }

  const provas: ProvaComZonas[] = tabela ? (piscina === 'M50' ? tabela.m50 : tabela.m25) : [];
  const corAtiva = piscina === 'M50' ? colors.primary : colors.accent;
  const semProvasPrincipais = tabela ? tabela.m50.length === 0 : false;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Minha tabela de referência</Text>
      <Text style={styles.explicacao}>
        Zonas de treinamento calculadas a partir das suas provas principais e das melhores marcas que você
        cadastrou. Cada zona é uma faixa de tempo em torno do seu melhor tempo naquela prova.
      </Text>

      {erro ? (
        <View style={styles.avisoBanner}>
          <Text style={styles.avisoBannerTexto}>{erro}</Text>
        </View>
      ) : null}

      {semProvasPrincipais ? (
        <View style={styles.vazioContainer}>
          <Text style={styles.vazioTitulo}>Você ainda não escolheu suas provas principais</Text>
          <Text style={styles.vazioTexto}>
            Escolha até 4 provas no seu perfil pra gerar sua tabela de referência pessoal.
          </Text>
          <Pressable style={styles.botao} onPress={() => router.push('/perfil')}>
            <Text style={styles.botaoTexto}>Ir para o perfil</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.abas}>
            <Pressable
              style={[styles.aba, piscina === 'M50' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setPiscina('M50')}
            >
              <Text style={[styles.abaTexto, piscina === 'M50' && styles.abaTextoAtiva]}>🏊 Piscina 50m</Text>
            </Pressable>
            <Pressable
              style={[styles.aba, piscina === 'M25' && { backgroundColor: colors.accent, borderColor: colors.accent }]}
              onPress={() => setPiscina('M25')}
            >
              <Text style={[styles.abaTexto, piscina === 'M25' && styles.abaTextoAtiva]}>🏊 Piscina 25m</Text>
            </Pressable>
          </View>

          {provas.map((p) => (
            <ZonaTreinamentoCard key={`${p.estilo}-${p.distancia}`} prova={p} cor={corAtiva} />
          ))}

          {provas.some((p) => p.melhorTempoCentesimos === null) ? (
            <Pressable style={styles.botaoSecundario} onPress={() => router.push('/marcas')}>
              <Text style={[styles.botaoSecundarioTexto, { color: corAtiva }]}>Cadastrar melhores marcas →</Text>
            </Pressable>
          ) : null}

          {tabela ? (
            <ExportarTabelaReferenciaPdfButton atletaNome={usuario?.nome ?? 'Atleta'} m25={tabela.m25} m50={tabela.m50} />
          ) : null}
        </>
      )}
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
      backgroundColor: c.background,
    },
    container: {
      padding: 16,
      gap: 14,
      flexGrow: 1,
      backgroundColor: c.background,
    },
    titulo: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
    },
    explicacao: {
      fontSize: 13,
      color: c.textMuted,
      lineHeight: 19,
    },
    avisoBanner: {
      backgroundColor: c.dangerSoft,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
    },
    avisoBannerTexto: {
      color: c.danger,
      fontSize: 13,
      textAlign: 'center',
    },
    vazioContainer: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 20,
      gap: 8,
      backgroundColor: c.surface,
      alignItems: 'center',
    },
    vazioTitulo: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
      textAlign: 'center',
    },
    vazioTexto: {
      fontSize: 13,
      color: c.textMuted,
      textAlign: 'center',
    },
    botao: {
      backgroundColor: c.primary,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: 'center',
      marginTop: 8,
    },
    botaoTexto: {
      color: c.onPrimary,
      fontWeight: '600',
      fontSize: 14,
    },
    abas: {
      flexDirection: 'row',
      gap: 8,
    },
    aba: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.borderInput,
      borderRadius: 16,
      paddingVertical: 10,
      alignItems: 'center',
    },
    abaTexto: {
      fontSize: 13,
      fontWeight: '700',
      color: c.textMuted,
    },
    abaTextoAtiva: {
      color: c.onPrimary,
    },
    botaoSecundario: {
      alignSelf: 'center',
      marginTop: 4,
      marginBottom: 4,
    },
    botaoSecundarioTexto: {
      fontWeight: '600',
      fontSize: 14,
    },
  });
}
