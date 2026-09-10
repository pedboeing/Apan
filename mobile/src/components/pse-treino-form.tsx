import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { api, ApiError } from '@/lib/api';
import type { Cores } from '@/lib/theme';
import { QUALIDADES_SONO, QUALIDADE_SONO_LABEL, type QualidadeSono, type RegistroPSE } from '@/lib/types';

const ESCALA_PSE = Array.from({ length: 11 }, (_, i) => i);

type Props = {
  treinoId: string;
  pseInicial: RegistroPSE | null;
};

export function PseTreinoForm({ treinoId, pseInicial }: Props) {
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const [pse, setPse] = useState<number | null>(pseInicial?.pse ?? null);
  const [qualidadeSono, setQualidadeSono] = useState<QualidadeSono | null>(pseInicial?.qualidadeSono ?? null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(pseInicial != null);

  async function handleSalvar() {
    setErro(null);
    if (pse === null) {
      setErro('Selecione uma nota de PSE.');
      return;
    }

    setSalvando(true);
    try {
      await api.registrarPSE(token!, { treinoId, pse, qualidadeSono });
      setSalvo(true);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível salvar o registro.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Como foi o treino?</Text>
        {salvo ? <Text style={styles.salvo}>salvo</Text> : null}
      </View>

      <Text style={styles.label}>PSE — percepção de esforço (0 a 10)</Text>
      <View style={styles.escala}>
        {ESCALA_PSE.map((n) => (
          <Pressable
            key={n}
            style={[styles.pseBotao, pse === n && styles.pseBotaoAtivo]}
            onPress={() => {
              setSalvo(false);
              setPse(n);
            }}
          >
            <Text style={[styles.pseTexto, pse === n && styles.pseTextoAtivo]}>{n}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Qualidade do sono (opcional)</Text>
      <View style={styles.chips}>
        {QUALIDADES_SONO.map((q) => (
          <Pressable
            key={q}
            style={[styles.chip, qualidadeSono === q && styles.chipAtivo]}
            onPress={() => {
              setSalvo(false);
              setQualidadeSono(qualidadeSono === q ? null : q);
            }}
          >
            <Text style={[styles.chipTexto, qualidadeSono === q && styles.chipTextoAtivo]}>
              {QUALIDADE_SONO_LABEL[q]}
            </Text>
          </Pressable>
        ))}
      </View>

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <Pressable style={styles.salvarBotao} onPress={handleSalvar} disabled={salvando}>
        {salvando ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.salvarTexto}>Salvar</Text>}
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
      gap: 10,
      backgroundColor: c.surface,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    titulo: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    salvo: {
      fontSize: 12,
      color: c.success,
      fontWeight: '600',
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textMuted,
    },
    escala: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    pseBotao: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: c.borderInput,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pseBotaoAtivo: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    pseTexto: {
      fontSize: 14,
      color: c.textMuted,
      fontWeight: '600',
    },
    pseTextoAtivo: {
      color: c.onPrimary,
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
    erro: {
      color: c.danger,
      fontSize: 13,
    },
    salvarBotao: {
      backgroundColor: c.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 4,
    },
    salvarTexto: {
      color: c.onPrimary,
      fontWeight: '600',
      fontSize: 15,
    },
  });
}
