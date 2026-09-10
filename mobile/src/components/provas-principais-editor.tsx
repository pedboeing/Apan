import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/context/theme-context';
import type { Cores } from '@/lib/theme';
import { ESTILOS, ESTILO_LABEL, formatarProva, type Estilo } from '@/lib/types';

export type ProvaEmEdicao = { estilo: Estilo; distancia: string };

type Props = {
  provas: ProvaEmEdicao[];
  onChange: (provas: ProvaEmEdicao[]) => void;
  max?: number;
};

// Lista + formulário de adicionar prova principal, sem botão de salvar — quem
// usa (perfil, cadastro) decide quando/como persistir a lista final. Usado
// tanto na edição de perfil (salva na hora) quanto no cadastro (salva junto
// com o resto da conta, ver cadastro.tsx).
export function ProvasPrincipaisEditor({ provas, onChange, max = 4 }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  const [novoEstilo, setNovoEstilo] = useState<Estilo>('LIVRE');
  const [novaDistancia, setNovaDistancia] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  function handleAdicionar() {
    setErro(null);

    if (provas.length >= max) {
      setErro(`Você já escolheu ${max} provas principais. Remova uma para adicionar outra.`);
      return;
    }
    const distanciaTrim = novaDistancia.trim();
    const distanciaNum = Number(distanciaTrim);
    if (!Number.isInteger(distanciaNum) || distanciaNum <= 0) {
      setErro('Informe uma distância válida (em metros).');
      return;
    }
    if (provas.some((p) => p.estilo === novoEstilo && p.distancia === distanciaTrim)) {
      setErro('Essa prova já está na lista.');
      return;
    }

    onChange([...provas, { estilo: novoEstilo, distancia: distanciaTrim }]);
    setNovaDistancia('');
  }

  function handleRemover(index: number) {
    onChange(provas.filter((_, i) => i !== index));
  }

  return (
    <View style={styles.container}>
      {provas.length > 0 ? (
        <View style={styles.lista}>
          {provas.map((p, index) => (
            <View key={`${p.estilo}-${p.distancia}-${index}`} style={styles.chip}>
              <Text style={styles.chipTexto}>{formatarProva(p.estilo, Number(p.distancia) || 0)}</Text>
              <Pressable onPress={() => handleRemover(index)} hitSlop={8}>
                <Text style={styles.chipRemover}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.vazioTexto}>Nenhuma prova escolhida ainda.</Text>
      )}

      {provas.length < max ? (
        <View style={styles.novaProva}>
          <View style={styles.estilos}>
            {ESTILOS.map((e) => (
              <Pressable
                key={e}
                style={[styles.estilo, novoEstilo === e && styles.estiloAtivo]}
                onPress={() => setNovoEstilo(e)}
              >
                <Text style={[styles.estiloTexto, novoEstilo === e && styles.estiloTextoAtivo]}>
                  {ESTILO_LABEL[e]}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.novaProvaLinha}>
            <TextInput
              style={styles.input}
              placeholder="Distância (m)"
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
              value={novaDistancia}
              onChangeText={setNovaDistancia}
            />
            <Pressable style={styles.botaoAdicionar} onPress={handleAdicionar}>
              <Text style={styles.botaoAdicionarTexto}>Adicionar</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    container: {
      gap: 8,
    },
    lista: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.primarySoft,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    chipTexto: {
      fontSize: 13,
      fontWeight: '600',
      color: c.primary,
    },
    chipRemover: {
      fontSize: 13,
      fontWeight: '700',
      color: c.primary,
    },
    vazioTexto: {
      fontSize: 13,
      color: c.textMuted,
    },
    novaProva: {
      gap: 8,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      padding: 12,
    },
    novaProvaLinha: {
      flexDirection: 'row',
      gap: 8,
    },
    input: {
      flex: 1,
      minWidth: 0,
      borderWidth: 1,
      borderColor: c.borderInput,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: c.surface,
      color: c.text,
    },
    botaoAdicionar: {
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: 8,
      paddingHorizontal: 16,
      flexShrink: 0,
      justifyContent: 'center',
    },
    botaoAdicionarTexto: {
      color: c.primary,
      fontWeight: '600',
      fontSize: 14,
    },
    estilos: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    estilo: {
      borderWidth: 1,
      borderColor: c.borderInput,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    estiloAtivo: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    estiloTexto: {
      fontSize: 13,
      color: c.textMuted,
    },
    estiloTextoAtivo: {
      color: c.onPrimary,
    },
    erro: {
      color: c.danger,
      fontSize: 14,
    },
  });
}
