import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PseTreinoForm } from '@/components/pse-treino-form';
import { TempoCronometradoForm } from '@/components/tempo-cronometrado-form';
import { WebCenteredForm } from '@/components/web-centered-form';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { alertar, confirmar } from '@/lib/alerta';
import { api, ApiError } from '@/lib/api';
import type { Cores } from '@/lib/theme';
import { BLOCOS, FASE_CICLO_LABEL, formatarGruposCategorias, treinoPrecisaResponder, type TreinoComRegistros } from '@/lib/types';

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

export default function TreinoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const [treino, setTreino] = useState<TreinoComRegistros | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    api
      .obterTreinoAtleta(token!, id)
      .then((res) => {
        if (ativo) setTreino(res.treino);
      })
      .catch((error: unknown) => {
        if (ativo) setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar o treino.');
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

  if (!treino) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const blocosComConteudo = BLOCOS.filter((b) => treino[b.textoField].length > 0);
  const pendente = treinoPrecisaResponder(treino);

  function handleNaoCompareci() {
    confirmar(
      'Não compareci',
      'Confirma que você não participou deste treino? Ele vai contar como ausência.',
      'Confirmar',
      async () => {
        try {
          await api.naoCompareci(token!, id);
          alertar('Ausência registrada', 'Esse treino agora conta como "Ausente" no seu histórico.');
          router.back();
        } catch (error) {
          alertar('Não foi possível registrar', error instanceof ApiError ? error.message : 'Tente novamente.');
        }
      },
    );
  }

  return (
    <WebCenteredForm>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {pendente ? (
          <View style={styles.pendenteBanner}>
            <Text style={styles.pendenteBannerTexto}>⚠ Falta responder este treino</Text>
          </View>
        ) : null}
        {treino.statusAtleta === 'AUSENTE' ? (
          <View style={styles.ausenteBanner}>
            <Text style={styles.ausenteBannerTexto}>😔 Contabilizado como ausente</Text>
          </View>
        ) : null}
        {pendente ? (
          <Pressable style={styles.naoCompareciBotao} onPress={handleNaoCompareci}>
            <Text style={styles.naoCompareciTexto}>Não compareci a este treino</Text>
          </Pressable>
        ) : null}

        <View style={styles.header}>
          <View style={styles.headerLinha}>
            <Text style={styles.data}>{formatarData(treino.data)}</Text>
            <Text style={styles.grupo}>{formatarGruposCategorias(treino.categorias)}</Text>
          </View>
          <Text style={styles.objetivo}>{treino.objetivoSemana}</Text>
          <View style={styles.headerLinha}>
            <Text style={styles.fase}>{FASE_CICLO_LABEL[treino.faseCiclo]}</Text>
            {treino.pseEsperada != null ? (
              <Text style={styles.pseEsperada}>PSE esperada: {treino.pseEsperada}</Text>
            ) : null}
          </View>
        </View>

        {treino.liberado ? (
          <>
            {blocosComConteudo.map((bloco) => (
              <View key={bloco.key} style={styles.bloco}>
                <Text style={styles.blocoTitulo}>{bloco.label}</Text>
                {treino[bloco.textoField].map((serie, index) => (
                  <Text key={index} style={styles.blocoTexto}>
                    {treino[bloco.textoField].length > 1 ? `${index + 1}. ${serie}` : serie}
                  </Text>
                ))}

                {treino[bloco.cronometradoField] ? (
                  <TempoCronometradoForm
                    treinoId={treino.id}
                    bloco={bloco.key}
                    label={bloco.label}
                    tempos={treino.tempos.filter((t) => t.bloco === bloco.key)}
                  />
                ) : null}
              </View>
            ))}

            <PseTreinoForm treinoId={treino.id} pseInicial={treino.pse} />
          </>
        ) : (
          <View style={styles.cadeadoCard}>
            <Text style={styles.cadeadoIcone}>🔒</Text>
            <Text style={styles.cadeadoTexto}>
              Esperando {treino.criadoPorNome ?? 'o técnico'} liberar o treino
            </Text>
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </WebCenteredForm>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 6,
      backgroundColor: c.background,
    },
    erro: {
      color: c.danger,
      fontSize: 14,
      textAlign: 'center',
    },
    container: {
      padding: 16,
      gap: 14,
      paddingBottom: 60,
      flexGrow: 1,
    },
    pendenteBanner: {
      alignSelf: 'flex-start',
      backgroundColor: c.warningSoft,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    pendenteBannerTexto: {
      fontSize: 13,
      fontWeight: '700',
      color: c.warning,
    },
    ausenteBanner: {
      alignSelf: 'flex-start',
      backgroundColor: c.dangerSoft,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    ausenteBannerTexto: {
      fontSize: 13,
      fontWeight: '700',
      color: c.danger,
    },
    naoCompareciBotao: {
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: c.danger,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    naoCompareciTexto: {
      fontSize: 13,
      fontWeight: '600',
      color: c.danger,
    },
    header: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      gap: 6,
      backgroundColor: c.surface,
    },
    headerLinha: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    data: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
    },
    grupo: {
      fontSize: 12,
      fontWeight: '600',
      color: c.primary,
      backgroundColor: c.primarySoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      overflow: 'hidden',
    },
    objetivo: {
      fontSize: 15,
      color: c.text,
      fontWeight: '600',
    },
    fase: {
      fontSize: 13,
      color: c.textMuted,
    },
    pseEsperada: {
      fontSize: 13,
      color: c.textMuted,
    },
    bloco: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      gap: 10,
      backgroundColor: c.surface,
    },
    blocoTitulo: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
    },
    blocoTexto: {
      fontSize: 15,
      color: c.text,
      lineHeight: 21,
    },
    cadeadoCard: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 32,
      alignItems: 'center',
      gap: 10,
      backgroundColor: c.surface,
    },
    cadeadoIcone: {
      fontSize: 32,
    },
    cadeadoTexto: {
      fontSize: 15,
      fontWeight: '600',
      color: c.textMuted,
      textAlign: 'center',
    },
  });
}
