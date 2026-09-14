import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { EstadoErro } from '@/components/estado-erro';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { alertar, confirmar } from '@/lib/alerta';
import { api, ApiError } from '@/lib/api';
import { formatarTempo } from '@/lib/tempo';
import type { Cores } from '@/lib/theme';
import {
  BLOCOS,
  ESTILO_LABEL,
  STATUS_ATLETA_LABEL,
  type AtletaRegistro,
  type RegistrosTreinoResponse,
  type StatusAtleta,
} from '@/lib/types';

// Pra chamada tanto faz quem registrou a presença: o atleta que anotou o
// treino sozinho e o que o técnico marcou aqui contam igual como presentes.
function estaPresente(status: StatusAtleta): boolean {
  return status === 'RESPONDIDO' || status === 'PRESENTE';
}

function temDados(atleta: AtletaRegistro): boolean {
  return atleta.tempos.length > 0 || atleta.pse !== null;
}

// Espelha o calcularStatusAtleta do backend (lib/ausencia.ts) pra lista
// reagir já no toque, sem esperar a rede: numa chamada o técnico marca
// vários atletas seguidos, e travar a cada toque atrapalha o fluxo. Se a
// requisição falhar, marcar() devolve o status anterior.
function statusApos(atleta: AtletaRegistro, presente: boolean): StatusAtleta {
  if (!presente) return 'AUSENTE';
  return temDados(atleta) ? 'RESPONDIDO' : 'PRESENTE';
}

export default function RegistrosTreinoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const [dados, setDados] = useState<RegistrosTreinoResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvandoLote, setSalvandoLote] = useState(false);

  const carregar = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.registrosDoTreino(token, id);
      setDados(res);
      setErro(null);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar os registros.');
    }
  }, [id, token]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  function aplicarStatusLocal(atletaId: string, status: StatusAtleta) {
    setDados((atual) =>
      atual
        ? { ...atual, atletas: atual.atletas.map((a) => (a.atletaId === atletaId ? { ...a, status } : a)) }
        : atual,
    );
  }

  async function marcar(atleta: AtletaRegistro, presente: boolean) {
    if (!token) return;
    const anterior = atleta.status;
    aplicarStatusLocal(atleta.atletaId, statusApos(atleta, presente));
    try {
      await api.marcarPresenca(token, { atletaId: atleta.atletaId, treinoId: id, presente });
    } catch (error) {
      aplicarStatusLocal(atleta.atletaId, anterior);
      alertar('Não foi possível salvar', error instanceof ApiError ? error.message : 'Tente de novo.');
    }
  }

  function marcarTodosPresentes() {
    if (!token || !dados || salvandoLote) return;

    // Quem já lançou tempo/PSE fica de fora: esse atleta já conta como
    // presente por conta própria, e sobrescrever apagaria essa informação.
    const alvos = dados.atletas.filter((a) => !temDados(a));
    if (alvos.length === 0) {
      alertar('Nada a marcar', 'Todos os atletas do grupo já registraram este treino por conta própria.');
      return;
    }

    const plural = alvos.length > 1;
    confirmar(
      'Marcar todos presentes',
      `${alvos.length} atleta${plural ? 's serão marcados' : ' será marcado'} como presente. Quem já lançou tempo ou PSE não é alterado.`,
      'Marcar todos',
      async () => {
        setSalvandoLote(true);
        try {
          await api.marcarPresencaEmLote(token, { treinoId: id, presente: true });
          await carregar();
        } catch (error) {
          alertar('Não foi possível salvar', error instanceof ApiError ? error.message : 'Tente de novo.');
        } finally {
          setSalvandoLote(false);
        }
      },
      false,
    );
  }

  if (erro && !dados) {
    return <EstadoErro mensagem={erro} aoTentarNovamente={carregar} />;
  }

  if (!dados) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const presentes = dados.atletas.filter((a) => estaPresente(a.status)).length;
  const ausentes = dados.atletas.filter((a) => a.status === 'AUSENTE').length;
  const semChamada = dados.atletas.filter((a) => a.status === 'PENDENTE').length;

  return (
    <FlatList
      data={dados.atletas}
      keyExtractor={(item) => item.atletaId}
      contentContainerStyle={styles.lista}
      ListHeaderComponent={
        dados.atletas.length > 0 ? (
          <View style={styles.cabecalho}>
            <Text style={styles.resumo}>
              {presentes} de {dados.atletas.length} presente{presentes === 1 ? '' : 's'}
              {ausentes > 0 ? ` · ${ausentes} ausente${ausentes > 1 ? 's' : ''}` : ''}
              {semChamada > 0 ? ` · ${semChamada} sem chamada` : ''}
            </Text>
            <Pressable
              style={[styles.botaoTodos, salvandoLote ? styles.botaoTodosDesabilitado : null]}
              onPress={marcarTodosPresentes}
              disabled={salvandoLote}
              accessibilityRole="button"
            >
              <Text style={styles.botaoTodosTexto}>{salvandoLote ? 'Marcando...' : 'Marcar todos presentes'}</Text>
            </Pressable>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.vazioTexto}>Nenhum atleta cadastrado nesse grupo ainda.</Text>
        </View>
      }
      renderItem={({ item }) => <AtletaRegistroCard atleta={item} aoMarcar={marcar} />}
    />
  );
}

function AtletaRegistroCard({
  atleta,
  aoMarcar,
}: {
  atleta: AtletaRegistro;
  aoMarcar: (atleta: AtletaRegistro, presente: boolean) => void;
}) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const [expandido, setExpandido] = useState(false);
  const blocosComTempo = BLOCOS.filter((b) => atleta.tempos.some((t) => t.bloco === b.key));

  const registrou = temDados(atleta);
  const presente = estaPresente(atleta.status);
  const ausente = atleta.status === 'AUSENTE';
  // Só acontece quando o técnico marca ausência por cima de um treino que o
  // atleta já registrou. É permitido — a chamada dele é a autoridade — mas
  // vale avisar na tela, porque pode ter sido toque errado.
  const conflito = ausente && registrou;

  const badgeEstilo =
    atleta.status === 'RESPONDIDO'
      ? styles.badgeRespondeu
      : atleta.status === 'PRESENTE'
        ? styles.badgePresente
        : ausente
          ? styles.badgeAusente
          : styles.badgePendente;

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.cardHeader}
        onPress={() => registrou && setExpandido((atual) => !atual)}
        disabled={!registrou}
        accessibilityRole={registrou ? 'button' : undefined}
      >
        <Text style={styles.cardNome}>{atleta.nome}</Text>
        <View style={styles.cardHeaderDireita}>
          <Text style={badgeEstilo}>{STATUS_ATLETA_LABEL[atleta.status].toLowerCase()}</Text>
          {registrou ? <Text style={styles.seta}>{expandido ? '▾' : '▸'}</Text> : null}
        </View>
      </Pressable>

      <View style={styles.chamada}>
        <Pressable
          style={[styles.botaoChamada, presente ? styles.chamadaPresenteAtiva : null]}
          onPress={() => aoMarcar(atleta, true)}
          accessibilityRole="button"
          accessibilityState={{ selected: presente }}
        >
          <Text style={[styles.botaoChamadaTexto, presente ? styles.chamadaTextoPresenteAtiva : null]}>Presente</Text>
        </Pressable>
        <Pressable
          style={[styles.botaoChamada, ausente ? styles.chamadaAusenteAtiva : null]}
          onPress={() => aoMarcar(atleta, false)}
          accessibilityRole="button"
          accessibilityState={{ selected: ausente }}
        >
          <Text style={[styles.botaoChamadaTexto, ausente ? styles.chamadaTextoAusenteAtiva : null]}>Ausente</Text>
        </Pressable>
      </View>

      {conflito ? <Text style={styles.aviso}>Marcado como ausente, mas tem registro lançado por ele.</Text> : null}

      {expandido ? (
        <View style={styles.detalhe}>
          <Text style={styles.cardPse}>
            PSE: {atleta.pse}
            {atleta.qualidadeSono ? ` · Sono: ${atleta.qualidadeSono}` : ''}
          </Text>

          {blocosComTempo.map((bloco) => {
            const tempos = atleta.tempos.filter((t) => t.bloco === bloco.key);
            return (
              <View key={bloco.key} style={styles.blocoTempos}>
                <Text style={styles.blocoTitulo}>{bloco.label}</Text>
                {tempos.map((t) => (
                  <Text key={t.id} style={styles.tiroLinha}>
                    {t.distancia}{t.estilo ? ` · ${ESTILO_LABEL[t.estilo]}` : ''} — {formatarTempo(t.tempoCentesimos)}
                  </Text>
                ))}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
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
    cabecalho: {
      gap: 10,
      marginBottom: 8,
    },
    resumo: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textMuted,
    },
    botaoTodos: {
      borderWidth: 1,
      borderColor: c.primary,
      backgroundColor: c.primarySoft,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
    },
    botaoTodosDesabilitado: {
      opacity: 0.6,
    },
    botaoTodosTexto: {
      fontSize: 14,
      fontWeight: '700',
      color: c.primary,
    },
    card: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      gap: 10,
      backgroundColor: c.surface,
      marginBottom: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    cardHeaderDireita: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    seta: {
      fontSize: 13,
      color: c.textMuted,
    },
    cardNome: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    chamada: {
      flexDirection: 'row',
      gap: 8,
    },
    botaoChamada: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      paddingVertical: 9,
      alignItems: 'center',
      backgroundColor: c.background,
    },
    botaoChamadaTexto: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textMuted,
    },
    chamadaPresenteAtiva: {
      borderColor: c.success,
      backgroundColor: c.successSoft,
    },
    chamadaTextoPresenteAtiva: {
      color: c.success,
    },
    chamadaAusenteAtiva: {
      borderColor: c.danger,
      backgroundColor: c.dangerSoft,
    },
    chamadaTextoAusenteAtiva: {
      color: c.danger,
    },
    aviso: {
      fontSize: 12,
      color: c.warning,
      lineHeight: 17,
    },
    badgeRespondeu: {
      fontSize: 11,
      fontWeight: '600',
      color: c.success,
      backgroundColor: c.successSoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      overflow: 'hidden',
    },
    badgePresente: {
      fontSize: 11,
      fontWeight: '600',
      color: c.primary,
      backgroundColor: c.primarySoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      overflow: 'hidden',
    },
    badgePendente: {
      fontSize: 11,
      fontWeight: '600',
      color: c.warning,
      backgroundColor: c.warningSoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      overflow: 'hidden',
    },
    badgeAusente: {
      fontSize: 11,
      fontWeight: '600',
      color: c.danger,
      backgroundColor: c.dangerSoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      overflow: 'hidden',
    },
    detalhe: {
      gap: 10,
      marginTop: 4,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    cardPse: {
      fontSize: 13,
      color: c.primary,
      fontWeight: '600',
    },
    blocoTempos: {
      gap: 4,
    },
    blocoTitulo: {
      fontSize: 12,
      fontWeight: '700',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    tiroLinha: {
      fontSize: 14,
      color: c.text,
      paddingVertical: 4,
      paddingHorizontal: 10,
      backgroundColor: c.background,
      borderRadius: 6,
    },
  });
}
