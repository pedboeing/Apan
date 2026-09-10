import { useReducer, useState } from 'react';
import { NativeSyntheticEvent, Pressable, StyleSheet, Text, TextInput, TextInputSelectionChangeEventData, View } from 'react-native';

import { useTheme } from '@/context/theme-context';
import type { Cores } from '@/lib/theme';
import { apagarDoBuffer, bufferParaCentesimos, bufferParaTexto, centesimosParaBuffer, digitarNoBuffer } from '@/lib/tempo';

type Props = {
  // Só usado pra preencher o campo na primeira renderização (ex: editando
  // um tempo já salvo) — depois disso o campo cuida do próprio estado
  // sozinho, igual um TextInput comum controlado localmente.
  inicial: number | null;
  onChange: (centesimos: number | null) => void;
};

// Campo de tempo "digitando da direita pra esquerda": só aceita número, e a
// pontuação (":" e ".") aparece sozinha conforme o atleta digita — ver a
// explicação completa da regra em lib/tempo.ts.
export function TempoInput({ inicial, onChange }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const [buffer, setBuffer] = useState(() => centesimosParaBuffer(inicial));
  // Truque padrão do React pra forçar um re-render sem precisar de um valor de
  // estado de verdade (mesmo com texto/buffer iguais) -- ver handleSelectionChange
  // logo abaixo pra entender por que isso é necessário.
  const [, forcarRerender] = useReducer((contagem: number) => contagem + 1, 0);

  function aplicar(novoBuffer: string) {
    setBuffer(novoBuffer);
    onChange(bufferParaCentesimos(novoBuffer));
  }

  // Esse campo não tem conceito de "editar no meio do texto" -- só digitar
  // mais um dígito no fim ou apagar o último. Por isso o cursor precisa ficar
  // sempre travado no fim; se o atleta tocar no meio do texto (ex: reabrindo
  // um tempo já preenchido pra corrigir) e um backspace ali apagar um ":" ou
  // "." em vez de um dígito, a contagem de dígitos não muda (handleChangeText
  // só olha a DIFERENÇA na quantidade de dígitos) e o campo dessincroniza do
  // que está digitado de verdade, silenciosamente, até travar. A prop
  // `selection` abaixo só é reaplicada quando o texto muda -- um toque sozinho
  // não muda o texto, então não bastava sozinha; esse handler cobre esse caso.
  function handleSelectionChange(event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) {
    const { start, end } = event.nativeEvent.selection;
    if (start !== texto.length || end !== texto.length) {
      forcarRerender();
    }
  }

  // O TextInput é totalmente controlado pelo buffer (o texto exibido nunca
  // é digitado "de verdade" pelo campo, é sempre recalculado por nós) — por
  // isso, ao receber onChangeText, o que importa não é o texto em si, é só
  // quantos dígitos existem a mais ou a menos comparado ao buffer atual.
  function handleChangeText(textoDoCampo: string) {
    const digitos = textoDoCampo.replace(/\D/g, '');

    if (digitos.length > buffer.length) {
      const novosDigitos = digitos.slice(buffer.length);
      let atual = buffer;
      for (const d of novosDigitos) atual = digitarNoBuffer(atual, d);
      aplicar(atual);
    } else if (digitos.length < buffer.length) {
      aplicar(apagarDoBuffer(buffer));
    } else if (textoDoCampo !== texto) {
      // A quantidade de dígitos não mudou, mas o texto do campo é diferente
      // do que devíamos estar mostrando -- ex: o toque caiu no meio do texto
      // (não no fim, onde o cursor devia estar travado) e um backspace ali
      // apagou um ":" ou "." em vez de um dígito. Não é uma edição válida
      // pra esse campo (só existe "apaga o último dígito" ou "digita mais"),
      // então desfaz: força o campo de volta pro texto correto, sem alterar
      // o buffer. Sem isso, o campo na tela ficava dessincronizado do nosso
      // estado (silenciosamente) até travar de vez.
      forcarRerender();
    }
  }

  const texto = bufferParaTexto(buffer);

  return (
    <View style={styles.linha}>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        placeholderTextColor={colors.placeholder}
        keyboardType="numeric"
        value={texto}
        onChangeText={handleChangeText}
        onSelectionChange={handleSelectionChange}
        selection={{ start: texto.length, end: texto.length }}
      />
      {buffer.length > 0 ? (
        <Pressable onPress={() => aplicar(apagarDoBuffer(buffer))} hitSlop={8} style={styles.apagarBotao}>
          <Text style={styles.apagarTexto}>⌫</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    linha: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minWidth: 0,
    },
    input: {
      flex: 1,
      minWidth: 0,
      borderWidth: 1,
      borderColor: c.borderInput,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      backgroundColor: c.surface,
      color: c.text,
    },
    apagarBotao: {
      width: 32,
      height: 32,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.borderInput,
      borderRadius: 8,
    },
    apagarTexto: {
      fontSize: 15,
      color: c.textMuted,
    },
  });
}
