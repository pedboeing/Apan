import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { TempoInput } from '@/components/tempo-input';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { api, ApiError } from '@/lib/api';
import type { Cores } from '@/lib/theme';
import { ESTILOS, ESTILO_LABEL, type BlocoTreino, type Estilo, type RegistroTempo } from '@/lib/types';

// Um "tiro" pode ter mais de um tempo (ex: "4x50" com 4 execuções) -- cada um
// com seu próprio id estável, pelo mesmo motivo do id da linha (ver comentário
// de novoId abaixo): sem isso, remover um tempo do meio faria o React
// reaproveitar o TempoInput errado pros que ficaram depois dele na lista.
type TempoLinha = { id: string; centesimos: number | null };
type Linha = { id: string; distancia: string; tempos: TempoLinha[]; estilo: Estilo | null };

// Um id estável (não o índice do array) é necessário porque TempoInput só lê
// o valor inicial uma vez -- se um item do meio da lista for removido com
// "×", os itens seguintes deslizam pra trás no array, e sem um id próprio o
// React reaproveitaria o TempoInput errado, mostrando um tempo desatualizado.
let proximoId = 0;
function novoId(prefixo: string): string {
  proximoId += 1;
  return `${prefixo}-${proximoId}`;
}

function linhasIniciais(tempos: RegistroTempo[]): Linha[] {
  if (tempos.length === 0) {
    return [{ id: novoId('linha'), distancia: '', tempos: [{ id: novoId('tempo'), centesimos: null }], estilo: null }];
  }

  // Registros salvos vêm "achatados" (um por tempo, repetindo distância/estilo
  // quando é o caso de múltiplos tempos no mesmo tiro) -- agrupa de volta por
  // distância+estilo consecutivos pra reconstruir a mesma linha com vários tempos.
  const linhas: Linha[] = [];
  for (const t of tempos) {
    const ultima = linhas[linhas.length - 1];
    if (ultima && ultima.distancia === t.distancia && ultima.estilo === t.estilo) {
      ultima.tempos.push({ id: novoId('tempo'), centesimos: t.tempoCentesimos });
    } else {
      linhas.push({
        id: novoId('linha'),
        distancia: t.distancia,
        tempos: [{ id: novoId('tempo'), centesimos: t.tempoCentesimos }],
        estilo: t.estilo,
      });
    }
  }
  return linhas;
}

type Props = {
  treinoId: string;
  bloco: BlocoTreino;
  label: string;
  tempos: RegistroTempo[];
};

export function TempoCronometradoForm({ treinoId, bloco, label, tempos }: Props) {
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const [linhas, setLinhas] = useState<Linha[]>(() => linhasIniciais(tempos));
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(tempos.length > 0);

  function atualizarDistancia(index: number, valor: string) {
    setSalvo(false);
    setLinhas((atual) => atual.map((linha, i) => (i === index ? { ...linha, distancia: valor } : linha)));
  }

  function atualizarTempo(indexLinha: number, indexTempo: number, centesimos: number | null) {
    setSalvo(false);
    setLinhas((atual) =>
      atual.map((linha, i) =>
        i === indexLinha
          ? { ...linha, tempos: linha.tempos.map((t, j) => (j === indexTempo ? { ...t, centesimos } : t)) }
          : linha,
      ),
    );
  }

  function selecionarEstilo(index: number, estilo: Estilo) {
    setSalvo(false);
    setLinhas((atual) =>
      atual.map((linha, i) => (i === index ? { ...linha, estilo: linha.estilo === estilo ? null : estilo } : linha)),
    );
  }

  function adicionarLinha() {
    setSalvo(false);
    setLinhas((atual) => [
      ...atual,
      { id: novoId('linha'), distancia: '', tempos: [{ id: novoId('tempo'), centesimos: null }], estilo: null },
    ]);
  }

  function removerLinha(index: number) {
    setSalvo(false);
    setLinhas((atual) => (atual.length > 1 ? atual.filter((_, i) => i !== index) : atual));
  }

  // Adiciona mais um tempo dentro do MESMO tiro (mesma distância/estilo) --
  // pra casos como "4x50", onde um tiro só tem várias execuções cronometradas.
  function adicionarTempo(indexLinha: number) {
    setSalvo(false);
    setLinhas((atual) =>
      atual.map((linha, i) =>
        i === indexLinha ? { ...linha, tempos: [...linha.tempos, { id: novoId('tempo'), centesimos: null }] } : linha,
      ),
    );
  }

  function removerTempo(indexLinha: number, indexTempo: number) {
    setSalvo(false);
    setLinhas((atual) =>
      atual.map((linha, i) =>
        i === indexLinha && linha.tempos.length > 1
          ? { ...linha, tempos: linha.tempos.filter((_, j) => j !== indexTempo) }
          : linha,
      ),
    );
  }

  async function handleSalvar() {
    setErro(null);

    const tiros: { distancia: string; tempoCentesimos: number; estilo: Estilo | null }[] = [];
    for (const linha of linhas) {
      const distancia = linha.distancia.trim();
      const temposPreenchidos = linha.tempos.filter((t) => t.centesimos != null);

      if (!distancia && temposPreenchidos.length === 0) continue; // linha em branco, ignora
      if (!distancia) {
        setErro('Falta o tiro de um dos registros.');
        return;
      }
      if (temposPreenchidos.length === 0) {
        setErro('Falta o tempo de um dos tiros.');
        return;
      }

      // um tiro com N tempos vira N registros com a mesma distância/estilo --
      // é assim que a API já espera (um item por tempo, sem conceito de "grupo").
      for (const t of temposPreenchidos) {
        tiros.push({ distancia, tempoCentesimos: t.centesimos!, estilo: linha.estilo });
      }
    }

    if (tiros.length === 0) {
      setErro('Adicione ao menos um tiro.');
      return;
    }

    setSalvando(true);
    try {
      await api.registrarTempos(token!, { treinoId, bloco, tiros });
      setSalvo(true);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível salvar os tempos.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>⏱ {label} — tempos</Text>
        {salvo ? <Text style={styles.salvo}>salvo</Text> : null}
      </View>

      {linhas.map((linha, indexLinha) => (
        <View key={linha.id} style={styles.linhaContainer}>
          <View style={styles.linha}>
            <TextInput
              style={[styles.input, styles.inputDistancia]}
              placeholder="Ex: 100 ou 4x50"
              placeholderTextColor={colors.placeholder}
              value={linha.distancia}
              onChangeText={(v) => atualizarDistancia(indexLinha, v)}
            />
            <Pressable onPress={() => removerLinha(indexLinha)} hitSlop={8} style={styles.removerBotao}>
              <Text style={styles.removerTexto}>×</Text>
            </Pressable>
          </View>

          {/* Um tiro (ex: "4x50") pode ter mais de um tempo -- cada execução na sua própria linha. */}
          <View style={styles.temposContainer}>
            {linha.tempos.map((tempo, indexTempo) => (
              <View key={tempo.id} style={styles.tempoLinha}>
                <Text style={styles.tempoNumero}>{indexTempo + 1}.</Text>
                <TempoInput
                  inicial={tempo.centesimos}
                  onChange={(v) => atualizarTempo(indexLinha, indexTempo, v)}
                />
                {linha.tempos.length > 1 ? (
                  <Pressable onPress={() => removerTempo(indexLinha, indexTempo)} hitSlop={8} style={styles.removerBotao}>
                    <Text style={styles.removerTexto}>×</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
            <Pressable onPress={() => adicionarTempo(indexLinha)} style={styles.adicionarTempoBotao}>
              <Text style={styles.adicionarTexto}>+ tempo</Text>
            </Pressable>
          </View>

          <View style={styles.estiloChips}>
            {ESTILOS.map((e) => (
              <Pressable
                key={e}
                style={[styles.estiloChip, linha.estilo === e && styles.estiloChipAtivo]}
                onPress={() => selecionarEstilo(indexLinha, e)}
              >
                <Text style={[styles.estiloChipTexto, linha.estilo === e && styles.estiloChipTextoAtivo]}>
                  {ESTILO_LABEL[e]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <Pressable onPress={adicionarLinha} style={styles.adicionarBotao}>
        <Text style={styles.adicionarTexto}>+ adicionar tiro</Text>
      </Pressable>

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <Pressable style={styles.salvarBotao} onPress={handleSalvar} disabled={salvando}>
        {salvando ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.salvarTexto}>Salvar tempos</Text>
        )}
      </Pressable>
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    container: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      gap: 8,
      backgroundColor: c.surface,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    titulo: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
    },
    salvo: {
      fontSize: 12,
      color: c.success,
      fontWeight: '600',
    },
    linhaContainer: {
      gap: 6,
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    linha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    temposContainer: {
      gap: 6,
    },
    tempoLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    tempoNumero: {
      fontSize: 12,
      color: c.textMuted,
      width: 16,
    },
    estiloChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    estiloChip: {
      borderWidth: 1,
      borderColor: c.borderInput,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    estiloChipAtivo: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    estiloChipTexto: {
      fontSize: 12,
      color: c.textMuted,
    },
    estiloChipTextoAtivo: {
      color: c.onPrimary,
    },
    input: {
      borderWidth: 1,
      borderColor: c.borderInput,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      backgroundColor: c.surface,
      color: c.text,
    },
    // minWidth: 0 é o pulo do gato aqui — na web, um item de flexbox por
    // padrão não encolhe além do tamanho do próprio conteúdo (o texto do
    // placeholder incluído), então "flex: 1" sozinho não impedia esse input
    // de estourar a largura da tela no celular. No nativo isso não faz
    // diferença (o Yoga já encolhe direito), então é seguro nos dois.
    inputDistancia: {
      flex: 1,
      minWidth: 0,
    },
    removerBotao: {
      width: 28,
      height: 28,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removerTexto: {
      fontSize: 20,
      color: c.placeholder,
      lineHeight: 20,
    },
    adicionarBotao: {
      alignSelf: 'flex-start',
    },
    adicionarTempoBotao: {
      alignSelf: 'flex-start',
    },
    adicionarTexto: {
      color: c.primary,
      fontWeight: '600',
      fontSize: 13,
    },
    erro: {
      color: c.danger,
      fontSize: 13,
    },
    salvarBotao: {
      backgroundColor: c.primary,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
      marginTop: 4,
    },
    salvarTexto: {
      color: c.onPrimary,
      fontWeight: '600',
      fontSize: 14,
    },
  });
}
