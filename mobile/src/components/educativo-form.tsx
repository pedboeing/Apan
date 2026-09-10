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

import { WebCenteredForm } from '@/components/web-centered-form';
import { useTheme } from '@/context/theme-context';
import { ApiError } from '@/lib/api';
import { confirmarExclusao } from '@/lib/alerta';
import type { Cores } from '@/lib/theme';
import { ESTILOS_EDUCATIVO, ESTILO_LABEL, type Educativo, type EducativoInput, type Estilo } from '@/lib/types';

type Props = {
  inicial?: Educativo;
  submitLabel: string;
  onSubmit: (dados: EducativoInput) => Promise<void>;
  onExcluir?: () => Promise<void>;
};

export function EducativoForm({ inicial, submitLabel, onSubmit, onExcluir }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  const [estilo, setEstilo] = useState<Estilo>(inicial?.estilo ?? 'LIVRE');
  const [nome, setNome] = useState(inicial?.nome ?? '');
  const [descricaoObjetivo, setDescricaoObjetivo] = useState(inicial?.descricaoObjetivo ?? '');
  const [videoUrl, setVideoUrl] = useState(inicial?.videoUrl ?? '');

  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function handleSubmit() {
    setErro(null);

    if (!nome.trim()) {
      setErro('Informe o nome do educativo.');
      return;
    }
    if (!descricaoObjetivo.trim()) {
      setErro('Descreva o objetivo do exercício.');
      return;
    }
    if (!/^https?:\/\//.test(videoUrl.trim())) {
      setErro('Informe uma URL de vídeo válida (começando com http:// ou https://).');
      return;
    }

    setSalvando(true);
    try {
      await onSubmit({
        estilo,
        nome: nome.trim(),
        descricaoObjetivo: descricaoObjetivo.trim(),
        videoUrl: videoUrl.trim(),
      });
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível salvar o educativo.');
    } finally {
      setSalvando(false);
    }
  }

  function handleExcluir() {
    if (!onExcluir) return;
    confirmarExclusao('Excluir educativo', 'Tem certeza? Essa ação não pode ser desfeita.', async () => {
      setErro(null);
      setExcluindo(true);
      try {
        await onExcluir();
      } catch (error) {
        setErro(error instanceof ApiError ? error.message : 'Não foi possível excluir o educativo.');
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
          {ESTILOS_EDUCATIVO.map((e) => (
            <Pressable key={e} style={[styles.chip, estilo === e && styles.chipAtivo]} onPress={() => setEstilo(e)}>
              <Text style={[styles.chipTexto, estilo === e && styles.chipTextoAtivo]}>{ESTILO_LABEL[e]}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Nome do educativo</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Duas pernadas"
          placeholderTextColor={colors.placeholder}
          value={nome}
          onChangeText={setNome}
        />

        <Text style={styles.label}>Objetivo do exercício</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder="O que esse educativo desenvolve e como executar"
          placeholderTextColor={colors.placeholder}
          multiline
          textAlignVertical="top"
          value={descricaoObjetivo}
          onChangeText={setDescricaoObjetivo}
        />

        <Text style={styles.label}>Link do vídeo (YouTube ou Vimeo)</Text>
        <TextInput
          style={styles.input}
          placeholder="https://youtube.com/watch?v=..."
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          value={videoUrl}
          onChangeText={setVideoUrl}
        />

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
              <Text style={styles.botaoExcluirTexto}>Excluir educativo</Text>
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
    inputMultiline: {
      minHeight: 100,
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
