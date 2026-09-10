import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DateInput } from '@/components/date-input';
import { WebCenteredForm } from '@/components/web-centered-form';
import { useTheme } from '@/context/theme-context';
import { ApiError } from '@/lib/api';
import { confirmarExclusao } from '@/lib/alerta';
import type { Cores } from '@/lib/theme';
import {
  FASES_CICLO,
  FASE_CICLO_LABEL,
  GRUPOS_TREINO,
  type Categoria,
  type FaseCiclo,
  type Treino,
  type TreinoInput,
} from '@/lib/types';

function hoje(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function seriesIniciais(series?: string[]): string[] {
  return series && series.length > 0 ? series : [''];
}

function limparSeries(series: string[]): string[] {
  return series.map((s) => s.trim()).filter((s) => s.length > 0);
}

type Props = {
  inicial?: Treino;
  submitLabel: string;
  onSubmit: (dados: TreinoInput) => Promise<void>;
  onExcluir?: () => Promise<void>;
};

export function TreinoForm({ inicial, submitLabel, onSubmit, onExcluir }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  const [data, setData] = useState(inicial ? inicial.data.slice(0, 10) : hoje());
  const [categorias, setCategorias] = useState<Categoria[]>(inicial?.categorias ?? ['JUVENIL_1', 'JUVENIL_2']);
  const [faseCiclo, setFaseCiclo] = useState<FaseCiclo>(inicial?.faseCiclo ?? 'BASE');
  const [objetivoSemana, setObjetivoSemana] = useState(inicial?.objetivoSemana ?? '');
  const [pseEsperada, setPseEsperada] = useState(inicial?.pseEsperada != null ? String(inicial.pseEsperada) : '');

  const [aquecimento, setAquecimento] = useState<string[]>(() => seriesIniciais(inicial?.aquecimento));
  const [aquecimentoCronometrado, setAquecimentoCronometrado] = useState(inicial?.aquecimentoCronometrado ?? false);
  const [seriePreparatoria, setSeriePreparatoria] = useState<string[]>(() =>
    seriesIniciais(inicial?.seriePreparatoria),
  );
  const [seriePreparatoriaCronometrada, setSeriePreparatoriaCronometrada] = useState(
    inicial?.seriePreparatoriaCronometrada ?? false,
  );
  const [seriePrincipal, setSeriePrincipal] = useState<string[]>(() => seriesIniciais(inicial?.seriePrincipal));
  const [seriePrincipalCronometrada, setSeriePrincipalCronometrada] = useState(
    inicial?.seriePrincipalCronometrada ?? false,
  );
  const [soltura, setSoltura] = useState<string[]>(() => seriesIniciais(inicial?.soltura));
  const [solturaCronometrada, setSolturaCronometrada] = useState(inicial?.solturaCronometrada ?? false);
  const [liberado, setLiberado] = useState(inicial?.liberado ?? true);

  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  // O grupo (ex: "Juvenil") representa I+II juntos — ativa/desativa as duas
  // categorias de uma vez. Se o treino já tinha só uma das duas (dado
  // antigo, de antes dessa mudança), o chip aparece marcado mesmo assim, e
  // tocar nele completa pras duas.
  function alternarGrupo(grupo: (typeof GRUPOS_TREINO)[number]) {
    const algumaPresente = grupo.categorias.some((c) => categorias.includes(c));
    setCategorias((atual) =>
      algumaPresente
        ? atual.filter((c) => !grupo.categorias.includes(c))
        : [...atual.filter((c) => !grupo.categorias.includes(c)), ...grupo.categorias],
    );
  }

  async function handleSubmit() {
    setErro(null);

    if (!data.trim() || !objetivoSemana.trim()) {
      setErro('Preencha data e objetivo do treino.');
      return;
    }
    if (categorias.length === 0) {
      setErro('Selecione ao menos um grupo.');
      return;
    }
    const blocosLimpos = {
      aquecimento: limparSeries(aquecimento),
      seriePreparatoria: limparSeries(seriePreparatoria),
      seriePrincipal: limparSeries(seriePrincipal),
      soltura: limparSeries(soltura),
    };
    if (!Object.values(blocosLimpos).some((arr) => arr.length > 0)) {
      setErro('Preencha ao menos uma série em algum dos blocos.');
      return;
    }
    let pse: number | null = null;
    if (pseEsperada.trim()) {
      pse = Number(pseEsperada.trim().replace(',', '.'));
      if (Number.isNaN(pse) || pse < 0 || pse > 10) {
        setErro('PSE esperada deve ser um número entre 0 e 10.');
        return;
      }
    }

    setSalvando(true);
    try {
      await onSubmit({
        data,
        categorias,
        objetivoSemana: objetivoSemana.trim(),
        faseCiclo,
        pseEsperada: pse,
        aquecimento: blocosLimpos.aquecimento,
        aquecimentoCronometrado,
        seriePreparatoria: blocosLimpos.seriePreparatoria,
        seriePreparatoriaCronometrada,
        seriePrincipal: blocosLimpos.seriePrincipal,
        seriePrincipalCronometrada,
        soltura: blocosLimpos.soltura,
        solturaCronometrada,
        liberado,
      });
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível salvar o treino.');
    } finally {
      setSalvando(false);
    }
  }

  function handleExcluir() {
    if (!onExcluir) return;
    confirmarExclusao('Excluir treino', 'Tem certeza? Essa ação não pode ser desfeita.', async () => {
      setErro(null);
      setExcluindo(true);
      try {
        await onExcluir();
      } catch (error) {
        setErro(error instanceof ApiError ? error.message : 'Não foi possível excluir o treino.');
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
          <Text style={styles.label}>Data</Text>
        <DateInput value={data} onChange={setData} />

        <Text style={styles.label}>Grupo (pode escolher mais de um)</Text>
        <View style={styles.chips}>
          {GRUPOS_TREINO.map((grupo) => {
            const ativo = grupo.categorias.some((c) => categorias.includes(c));
            return (
              <Pressable
                key={grupo.label}
                style={[styles.chip, ativo && styles.chipAtivo]}
                onPress={() => alternarGrupo(grupo)}
              >
                <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{grupo.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Fase do ciclo</Text>
        <View style={styles.chips}>
          {FASES_CICLO.map((f) => (
            <Pressable
              key={f}
              style={[styles.chip, faseCiclo === f && styles.chipAtivo]}
              onPress={() => setFaseCiclo(f)}
            >
              <Text style={[styles.chipTexto, faseCiclo === f && styles.chipTextoAtivo]}>{FASE_CICLO_LABEL[f]}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Objetivo do treino</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: treino progressivo"
          placeholderTextColor={colors.placeholder}
          value={objetivoSemana}
          onChangeText={setObjetivoSemana}
        />

        <Text style={styles.label}>PSE esperada (opcional, 0 a 10)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 7"
          placeholderTextColor={colors.placeholder}
          keyboardType="numeric"
          value={pseEsperada}
          onChangeText={setPseEsperada}
        />

        <Bloco
          titulo="Aquecimento"
          series={aquecimento}
          onChangeSeries={setAquecimento}
          cronometrado={aquecimentoCronometrado}
          onToggleCronometrado={setAquecimentoCronometrado}
        />
        <Bloco
          titulo="Série preparatória"
          series={seriePreparatoria}
          onChangeSeries={setSeriePreparatoria}
          cronometrado={seriePreparatoriaCronometrada}
          onToggleCronometrado={setSeriePreparatoriaCronometrada}
        />
        <Bloco
          titulo="Série principal"
          series={seriePrincipal}
          onChangeSeries={setSeriePrincipal}
          cronometrado={seriePrincipalCronometrada}
          onToggleCronometrado={setSeriePrincipalCronometrada}
        />
        <Bloco
          titulo="Soltura"
          series={soltura}
          onChangeSeries={setSoltura}
          cronometrado={solturaCronometrada}
          onToggleCronometrado={setSolturaCronometrada}
        />

        <View style={styles.liberadoLinha}>
          <View style={styles.liberadoTextos}>
            <Text style={styles.label}>Liberar treino para os atletas</Text>
            <Text style={styles.liberadoDescricao}>
              {liberado
                ? 'Os atletas do grupo já conseguem ver e responder este treino.'
                : 'Os atletas veem que existe um treino, mas o conteúdo fica bloqueado até você liberar.'}
            </Text>
          </View>
          <Switch value={liberado} onValueChange={setLiberado} trackColor={{ true: colors.primary }} />
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
              <Text style={styles.botaoExcluirTexto}>Excluir treino</Text>
            )}
          </Pressable>
        ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </WebCenteredForm>
  );
}

type BlocoProps = {
  titulo: string;
  series: string[];
  onChangeSeries: (v: string[]) => void;
  cronometrado: boolean;
  onToggleCronometrado: (v: boolean) => void;
};

function Bloco({ titulo, series, onChangeSeries, cronometrado, onToggleCronometrado }: BlocoProps) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  function atualizarSerie(index: number, valor: string) {
    onChangeSeries(series.map((s, i) => (i === index ? valor : s)));
  }

  function adicionarSerie() {
    onChangeSeries([...series, '']);
  }

  function removerSerie(index: number) {
    onChangeSeries(series.length > 1 ? series.filter((_, i) => i !== index) : ['']);
  }

  return (
    <View style={styles.bloco}>
      <View style={styles.blocoHeader}>
        <Text style={styles.label}>{titulo}</Text>
        <View style={styles.blocoToggle}>
          <Text style={styles.blocoToggleTexto}>Anotar tempo</Text>
          <Switch value={cronometrado} onValueChange={onToggleCronometrado} trackColor={{ true: colors.primary }} />
        </View>
      </View>

      {series.map((serie, index) => (
        <View key={index} style={styles.serieLinha}>
          <TextInput
            style={[styles.input, styles.inputMultiline, styles.serieInput]}
            placeholder="Descreva a série: exercícios, distâncias, intervalos..."
            placeholderTextColor={colors.placeholder}
            multiline
            textAlignVertical="top"
            value={serie}
            onChangeText={(v) => atualizarSerie(index, v)}
          />
          {series.length > 1 ? (
            <Pressable onPress={() => removerSerie(index)} hitSlop={8} style={styles.removerBotao}>
              <Text style={styles.removerTexto}>×</Text>
            </Pressable>
          ) : null}
        </View>
      ))}

      <Pressable onPress={adicionarSerie} style={styles.adicionarBotao}>
        <Text style={styles.adicionarTexto}>+ adicionar série</Text>
      </Pressable>
    </View>
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
      minHeight: 80,
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
    bloco: {
      gap: 8,
      marginTop: 8,
    },
    blocoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    blocoToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    blocoToggleTexto: {
      fontSize: 12,
      color: c.textMuted,
    },
    liberadoLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 16,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      padding: 12,
    },
    liberadoTextos: {
      flex: 1,
      gap: 2,
    },
    liberadoDescricao: {
      fontSize: 12,
      color: c.textMuted,
    },
    serieLinha: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
    },
    serieInput: {
      flex: 1,
      minWidth: 0,
    },
    removerBotao: {
      width: 28,
      height: 40,
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
    adicionarTexto: {
      color: c.primary,
      fontWeight: '600',
      fontSize: 13,
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
