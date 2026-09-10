import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EstadoErro } from '@/components/estado-erro';
import { PainelFiltros } from '@/components/painel-filtros';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { api, ApiError } from '@/lib/api';
import { secureStorage } from '@/lib/storage';
import type { Cores } from '@/lib/theme';
import { CATEGORIA_LABEL, FASE_CICLO_LABEL, GRUPOS_TREINO, type Treino } from '@/lib/types';

// Filtro é por grupo (ex: "Juvenil"), não por categoria exata, porque é assim
// que o treino é criado — marcar "Juvenil" já grava Juvenil I e II juntos
// (ver GRUPOS_TREINO em lib/types). Guardado pelo label do grupo, que é o
// identificador estável dessa lista.
const CHAVE_FILTRO_GRUPO = 'apan.treinos.filtro-grupo';

type GrupoTreino = (typeof GRUPOS_TREINO)[number];
type Secao = { label: string; data: Treino[] };

// pega só o primeiro nome — "criado por João Pedro" já deixa claro de quem
// é sem lotar o card com o nome completo de cada técnico do time.
function primeiroNome(nomeCompleto: string): string {
  return nomeCompleto.split(' ')[0] ?? nomeCompleto;
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

function ehDoGrupo(treino: Treino, grupo: GrupoTreino): boolean {
  return treino.categorias.some((c) => grupo.categorias.includes(c));
}

// Sem filtro, a lista vira uma seção por grupo (na ordem de GRUPOS_TREINO,
// do mais novo pro mais velho). Treino montado pra dois grupos aparece nos
// dois — é o que o técnico espera ao olhar "os treinos do Juvenil".
function montarSecoes(treinos: Treino[], grupoSelecionado: string | null): Secao[] {
  if (grupoSelecionado !== null) {
    const grupo = GRUPOS_TREINO.find((g) => g.label === grupoSelecionado);
    if (!grupo) return [];
    return [{ label: grupo.label, data: treinos.filter((t) => ehDoGrupo(t, grupo)) }];
  }

  const secoes = GRUPOS_TREINO.map((grupo) => ({
    label: grupo.label,
    data: treinos.filter((t) => ehDoGrupo(t, grupo)),
  })).filter((s) => s.data.length > 0);

  // Treino sem nenhuma categoria conhecida (dado antigo, salvo antes das
  // validações de hoje) sumiria da tela sem essa seção de resto.
  const agrupados = new Set(secoes.flatMap((s) => s.data.map((t) => t.id)));
  const semGrupo = treinos.filter((t) => !agrupados.has(t.id));
  return semGrupo.length > 0 ? [...secoes, { label: 'Sem grupo', data: semGrupo }] : secoes;
}

export default function TreinosScreen() {
  const { token, usuario } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const [treinos, setTreinos] = useState<Treino[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [grupo, setGrupo] = useState<string | null>(null);
  const [filtroCarregado, setFiltroCarregado] = useState(false);

  const carregar = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.listarTreinos(token);
      setTreinos(res.treinos);
      setErro(null);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar os treinos.');
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  // Espera o filtro salvo antes de mostrar a lista, senão o técnico veria
  // tudo por um instante e a tela se recortaria sozinha logo depois.
  useEffect(() => {
    let ativo = true;
    secureStorage.getItem(CHAVE_FILTRO_GRUPO).then((salvo) => {
      if (!ativo) return;
      if (salvo !== null && GRUPOS_TREINO.some((g) => g.label === salvo)) setGrupo(salvo);
      setFiltroCarregado(true);
    });
    return () => {
      ativo = false;
    };
  }, []);

  function selecionarGrupo(label: string | null) {
    setGrupo(label);
    if (label === null) void secureStorage.removeItem(CHAVE_FILTRO_GRUPO);
    else void secureStorage.setItem(CHAVE_FILTRO_GRUPO, label);
  }

  const secoes = useMemo(() => montarSecoes(treinos ?? [], grupo), [treinos, grupo]);
  const totalFiltrado = secoes.reduce((total, s) => total + s.data.length, 0);

  async function handleRefresh() {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }

  if ((treinos === null || !filtroCarregado) && !erro) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (erro && treinos === null) {
    return <EstadoErro mensagem={erro} aoTentarNovamente={carregar} />;
  }

  return (
    <View style={styles.tela}>
      <PainelFiltros titulo="Categoria" resumo={grupo ?? 'Todas as categorias'}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chips}>
            <Pressable style={[styles.chip, grupo === null && styles.chipAtivo]} onPress={() => selecionarGrupo(null)}>
              <Text style={[styles.chipTexto, grupo === null && styles.chipTextoAtivo]}>Todas</Text>
            </Pressable>
            {GRUPOS_TREINO.map((g) => (
              <Pressable
                key={g.label}
                style={[styles.chip, grupo === g.label && styles.chipAtivo]}
                onPress={() => selecionarGrupo(grupo === g.label ? null : g.label)}
              >
                <Text style={[styles.chipTexto, grupo === g.label && styles.chipTextoAtivo]}>{g.label}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </PainelFiltros>

      {erro ? (
        <View style={styles.avisoBanner}>
          <Text style={styles.avisoBannerTexto}>{erro}</Text>
        </View>
      ) : null}

      <SectionList
        sections={secoes}
        // Um treino de dois grupos aparece nas duas seções, então o id
        // sozinho não é chave única na lista inteira.
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.lista}
        refreshControl={<RefreshControl refreshing={atualizando} onRefresh={handleRefresh} />}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section }) =>
          // Com um grupo escolhido o cabeçalho só repetiria o que o filtro
          // já mostra ali em cima.
          grupo === null ? (
            <View style={styles.secaoHeader}>
              <Text style={styles.secaoTitulo}>{section.label}</Text>
              <Text style={styles.secaoContagem}>{section.data.length}</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.center}>
            {grupo !== null ? (
              <>
                <Text style={styles.vazioTitulo}>Nenhum treino de {grupo}</Text>
                <Pressable onPress={() => selecionarGrupo(null)} hitSlop={8}>
                  <Text style={styles.vazioAcao}>Ver todas as categorias</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.vazioTitulo}>Nenhum treino cadastrado</Text>
                <Text style={styles.vazioTexto}>Toque no botão + para criar o primeiro treino.</Text>
              </>
            )}
          </View>
        }
        ListFooterComponent={
          totalFiltrado > 0 && grupo !== null ? (
            <Text style={styles.rodape}>
              {totalFiltrado} {totalFiltrado === 1 ? 'treino' : 'treinos'} de {grupo}
            </Text>
          ) : null
        }
        renderItem={({ item }) => <TreinoCard treino={item} usuarioIdLogado={usuario?.id} />}
      />
    </View>
  );
}

function TreinoCard({ treino, usuarioIdLogado }: { treino: Treino; usuarioIdLogado: string | undefined }) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  const cronometrado =
    treino.aquecimentoCronometrado ||
    treino.seriePreparatoriaCronometrada ||
    treino.seriePrincipalCronometrada ||
    treino.solturaCronometrada;

  const ehMeu = treino.criadoPorUsuarioId === usuarioIdLogado;

  return (
    <Pressable style={styles.card} onPress={() => router.push({ pathname: '/treino/[id]', params: { id: treino.id } })}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardData}>{formatarData(treino.data)}</Text>
        <Text style={styles.cardGrupo}>{treino.categorias.map((c) => CATEGORIA_LABEL[c]).join(', ')}</Text>
      </View>
      <Text style={styles.cardObjetivo}>{treino.objetivoSemana}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardFase}>{FASE_CICLO_LABEL[treino.faseCiclo]}</Text>
        {!treino.liberado ? <Text style={styles.cardCronometrado}>🔒 bloqueado p/ atletas</Text> : null}
        {treino.pseEsperada != null ? <Text style={styles.cardPse}>PSE {treino.pseEsperada}</Text> : null}
        {cronometrado ? <Text style={styles.cardCronometrado}>⏱ anotar tempo</Text> : null}
      </View>
      {treino.criadoPorNome ? (
        <Text style={ehMeu ? styles.cardCriador : styles.cardCriadorOutro}>
          {ehMeu ? 'Criado por você' : `👁 Criado por ${primeiroNome(treino.criadoPorNome)}`}
        </Text>
      ) : null}
    </Pressable>
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
      gap: 6,
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
    secaoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.background,
      paddingVertical: 8,
      marginTop: 4,
    },
    secaoTitulo: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    secaoContagem: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textMuted,
    },
    rodape: {
      fontSize: 12,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: 4,
    },
    vazioTitulo: {
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
    },
    vazioTexto: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: 'center',
    },
    vazioAcao: {
      fontSize: 14,
      fontWeight: '600',
      color: c.primary,
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
      gap: 6,
      backgroundColor: c.surface,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardData: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
    },
    cardGrupo: {
      fontSize: 12,
      fontWeight: '600',
      color: c.primary,
      backgroundColor: c.primarySoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      overflow: 'hidden',
    },
    cardObjetivo: {
      fontSize: 14,
      color: c.text,
    },
    cardFooter: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 2,
    },
    cardFase: {
      fontSize: 12,
      color: c.textMuted,
    },
    cardPse: {
      fontSize: 12,
      color: c.textMuted,
    },
    cardCronometrado: {
      fontSize: 12,
      color: c.textMuted,
    },
    cardCriador: {
      fontSize: 11,
      color: c.textMuted,
      marginTop: 2,
    },
    cardCriadorOutro: {
      fontSize: 12,
      fontWeight: '700',
      color: c.primary,
      backgroundColor: c.primarySoft,
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      marginTop: 4,
      overflow: 'hidden',
    },
  });
}
