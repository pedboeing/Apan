import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DateInput } from '@/components/date-input';
import { TempoInput } from '@/components/tempo-input';
import { WebCenteredForm } from '@/components/web-centered-form';
import { useTheme } from '@/context/theme-context';
import { ApiError } from '@/lib/api';
import { confirmarExclusao } from '@/lib/alerta';
import type { Cores } from '@/lib/theme';
import {
  ESTILOS,
  ESTILO_LABEL,
  MEDALHAS,
  MEDALHA_LABEL,
  type Estilo,
  type Medalha,
  type ResultadoCompeticao,
  type ResultadoCompeticaoInput,
} from '@/lib/types';

function hoje(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

type Props = {
  inicial?: ResultadoCompeticao;
  submitLabel: string;
  onSubmit: (dados: ResultadoCompeticaoInput) => Promise<void>;
  onExcluir?: () => Promise<void>;
};

export function ResultadoCompeticaoForm({ inicial, submitLabel, onSubmit, onExcluir }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  const [nomeCompeticao, setNomeCompeticao] = useState(inicial?.competicao.nome ?? '');
  const [data, setData] = useState(inicial ? inicial.competicao.data.slice(0, 10) : hoje());
  const [local, setLocal] = useState(inicial?.competicao.local ?? '');
  const [estilo, setEstilo] = useState<Estilo>(inicial?.estilo ?? 'LIVRE');
  const [distancia, setDistancia] = useState(inicial ? String(inicial.distancia) : '');
  const [tempoCentesimos, setTempoCentesimos] = useState<number | null>(inicial?.tempoCentesimos ?? null);
  const [colocacao, setColocacao] = useState(inicial?.colocacao != null ? String(inicial.colocacao) : '');
  const [medalha, setMedalha] = useState<Medalha | null>(inicial?.medalha ?? null);

  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function handleSubmit() {
    setErro(null);

    if (!nomeCompeticao.trim()) {
      setErro('Informe o nome da competição.');
      return;
    }
    if (!data.trim()) {
      setErro('Informe a data da competição.');
      return;
    }
    if (!local.trim()) {
      setErro('Informe o local da competição.');
      return;
    }
    const distanciaNum = Number(distancia.trim());
    if (!Number.isInteger(distanciaNum) || distanciaNum <= 0) {
      setErro('Informe uma distância válida (em metros).');
      return;
    }
    if (tempoCentesimos === null) {
      setErro('Informe o tempo.');
      return;
    }
    let colocacaoNum: number | null = null;
    if (colocacao.trim()) {
      colocacaoNum = Number(colocacao.trim());
      if (!Number.isInteger(colocacaoNum) || colocacaoNum <= 0) {
        setErro('Colocação deve ser um número inteiro maior que zero.');
        return;
      }
    }

    setSalvando(true);
    try {
      await onSubmit({
        competicao: { nome: nomeCompeticao.trim(), data, local: local.trim() },
        estilo,
        distancia: distanciaNum,
        tempoCentesimos,
        colocacao: colocacaoNum,
        medalha,
      });
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível salvar o resultado.');
    } finally {
      setSalvando(false);
    }
  }

  function handleExcluir() {
    if (!onExcluir) return;
    confirmarExclusao('Excluir resultado', 'Tem certeza? Essa ação não pode ser desfeita.', async () => {
      setErro(null);
      setExcluindo(true);
      try {
        await onExcluir();
      } catch (error) {
        setErro(error instanceof ApiError ? error.message : 'Não foi possível excluir o resultado.');
        setExcluindo(false);
      }
    });
  }

  return (
    <WebCenteredForm>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <Text style={styles.label}>Nome da competição</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Campeonato Estadual"
          placeholderTextColor={colors.placeholder}
          value={nomeCompeticao}
          onChangeText={setNomeCompeticao}
        />

        <Text style={styles.label}>Data</Text>
        <DateInput value={data} onChange={setData} />

        <Text style={styles.label}>Local</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Clube Tal, Cidade"
          placeholderTextColor={colors.placeholder}
          value={local}
          onChangeText={setLocal}
        />

        <Text style={styles.label}>Estilo</Text>
        <View style={styles.chips}>
          {ESTILOS.map((e) => (
            <Pressable key={e} style={[styles.chip, estilo === e && styles.chipAtivo]} onPress={() => setEstilo(e)}>
              <Text style={[styles.chipTexto, estilo === e && styles.chipTextoAtivo]}>{ESTILO_LABEL[e]}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Distância (metros)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 100"
          placeholderTextColor={colors.placeholder}
          keyboardType="numeric"
          value={distancia}
          onChangeText={setDistancia}
        />

        <Text style={styles.label}>Tempo</Text>
        <TempoInput inicial={tempoCentesimos} onChange={setTempoCentesimos} />

        <Text style={styles.label}>Colocação (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 3"
          placeholderTextColor={colors.placeholder}
          keyboardType="numeric"
          value={colocacao}
          onChangeText={setColocacao}
        />

        <Text style={styles.label}>Medalha (opcional)</Text>
        <View style={styles.chips}>
          <Pressable style={[styles.chip, medalha === null && styles.chipAtivo]} onPress={() => setMedalha(null)}>
            <Text style={[styles.chipTexto, medalha === null && styles.chipTextoAtivo]}>Nenhuma</Text>
          </Pressable>
          {MEDALHAS.map((m) => (
            <Pressable key={m} style={[styles.chip, medalha === m && styles.chipAtivo]} onPress={() => setMedalha(m)}>
              <Text style={[styles.chipTexto, medalha === m && styles.chipTextoAtivo]}>{MEDALHA_LABEL[m]}</Text>
            </Pressable>
          ))}
        </View>

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <Pressable style={styles.botao} onPress={handleSubmit} disabled={salvando || excluindo}>
          {salvando ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.botaoTexto}>{submitLabel}</Text>
          )}
        </Pressable>

        {onExcluir ? (
          <Pressable style={styles.botaoExcluir} onPress={handleExcluir} disabled={salvando || excluindo}>
            {excluindo ? (
              <ActivityIndicator color={colors.danger} />
            ) : (
              <Text style={styles.botaoExcluirTexto}>Excluir resultado</Text>
            )}
          </Pressable>
        ) : null}
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
    container: {
      flexGrow: 1,
      padding: 24,
      paddingBottom: 60,
      gap: 10,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textMuted,
    },
    input: {
      borderWidth: 1,
      borderColor: c.borderInput,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: c.surface,
      color: c.text,
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
    botao: {
      backgroundColor: c.primary,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 16,
    },
    botaoTexto: {
      color: c.onPrimary,
      fontWeight: '600',
      fontSize: 16,
    },
    botaoExcluir: {
      borderWidth: 1,
      borderColor: c.danger,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 10,
    },
    botaoExcluirTexto: {
      color: c.danger,
      fontWeight: '600',
      fontSize: 16,
    },
    erro: {
      color: c.danger,
      fontSize: 14,
      marginTop: 8,
    },
  });
}
