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
  PISCINAS,
  PISCINA_LABEL,
  type Estilo,
  type MelhorMarca,
  type MelhorMarcaInput,
  type TamanhoPiscina,
} from '@/lib/types';

type Props = {
  inicial?: MelhorMarca;
  submitLabel: string;
  onSubmit: (dados: MelhorMarcaInput) => Promise<void>;
  onExcluir?: () => Promise<void>;
};

export function MelhorMarcaForm({ inicial, submitLabel, onSubmit, onExcluir }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  const [estilo, setEstilo] = useState<Estilo>(inicial?.estilo ?? 'LIVRE');
  const [distancia, setDistancia] = useState(inicial ? String(inicial.distancia) : '');
  const [piscina, setPiscina] = useState<TamanhoPiscina>(inicial?.piscina ?? 'M50');
  const [tempoCentesimos, setTempoCentesimos] = useState<number | null>(inicial?.tempoCentesimos ?? null);
  const [data, setData] = useState(inicial?.data ? inicial.data.slice(0, 10) : '');

  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function handleSubmit() {
    setErro(null);

    const distanciaNum = Number(distancia.trim());
    if (!Number.isInteger(distanciaNum) || distanciaNum <= 0) {
      setErro('Informe uma distância válida (em metros).');
      return;
    }
    if (tempoCentesimos === null) {
      setErro('Informe o tempo.');
      return;
    }

    setSalvando(true);
    try {
      await onSubmit({
        estilo,
        distancia: distanciaNum,
        piscina,
        tempoCentesimos,
        data: data.trim() || null,
      });
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível salvar a marca.');
    } finally {
      setSalvando(false);
    }
  }

  function handleExcluir() {
    if (!onExcluir) return;
    confirmarExclusao('Excluir marca', 'Tem certeza? Essa ação não pode ser desfeita.', async () => {
      setErro(null);
      setExcluindo(true);
      try {
        await onExcluir();
      } catch (error) {
        setErro(error instanceof ApiError ? error.message : 'Não foi possível excluir a marca.');
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

        <Text style={styles.label}>Piscina</Text>
        <View style={styles.chips}>
          {PISCINAS.map((p) => (
            <Pressable key={p} style={[styles.chip, piscina === p && styles.chipAtivo]} onPress={() => setPiscina(p)}>
              <Text style={[styles.chipTexto, piscina === p && styles.chipTextoAtivo]}>{PISCINA_LABEL[p]}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Tempo</Text>
        <TempoInput inicial={tempoCentesimos} onChange={setTempoCentesimos} />

        <Text style={styles.label}>Data (opcional)</Text>
        <DateInput value={data} onChange={setData} />

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
              <Text style={styles.botaoExcluirTexto}>Excluir marca</Text>
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
