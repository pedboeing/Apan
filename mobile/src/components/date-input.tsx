import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/context/theme-context';
import { brParaIso, formatarDataEnquantoDigita, isoParaBr } from '@/lib/data';
import type { Cores } from '@/lib/theme';

type Props = {
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
};

export function DateInput({ value, onChange, placeholder }: Props) {
  const { scheme, colors } = useTheme();
  const styles = criarEstilos(colors);
  const [texto, setTexto] = useState(() => isoParaBr(value));
  const [mostrarPicker, setMostrarPicker] = useState(false);

  useEffect(() => {
    setTexto(isoParaBr(value));
  }, [value]);

  function handleChangeText(novoTexto: string) {
    const formatado = formatarDataEnquantoDigita(novoTexto);
    setTexto(formatado);
    const iso = brParaIso(formatado);
    if (iso) {
      onChange(iso);
    }
  }

  function handlePickerChange(event: DateTimePickerEvent, data?: Date) {
    if (Platform.OS === 'android') {
      setMostrarPicker(false);
    }
    if (event.type === 'set' && data) {
      const iso = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
      onChange(iso);
      setTexto(isoParaBr(iso));
    }
  }

  const dataParaPicker = brParaIso(texto);

  return (
    <View>
      <View style={styles.linha}>
        <TextInput
          style={styles.input}
          placeholder={placeholder ?? 'DD/MM/AAAA'}
          placeholderTextColor={colors.placeholder}
          keyboardType="numeric"
          value={texto}
          onChangeText={handleChangeText}
          maxLength={10}
        />
        {Platform.OS !== 'web' ? (
          <Pressable style={styles.botaoCalendario} onPress={() => setMostrarPicker((v) => !v)} hitSlop={8}>
            <Text style={styles.botaoCalendarioTexto}>📅</Text>
          </Pressable>
        ) : null}
      </View>

      {mostrarPicker ? (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={dataParaPicker ? new Date(`${dataParaPicker}T00:00:00`) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            themeVariant={scheme}
            onChange={handlePickerChange}
          />
          {Platform.OS === 'ios' ? (
            <Pressable style={styles.fecharBotao} onPress={() => setMostrarPicker(false)}>
              <Text style={styles.fecharTexto}>Fechar</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    linha: {
      flexDirection: 'row',
      alignItems: 'center',
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
    botaoCalendario: {
      width: 44,
      height: 44,
      flexShrink: 0,
      borderWidth: 1,
      borderColor: c.borderInput,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
    },
    botaoCalendarioTexto: {
      fontSize: 20,
    },
    pickerContainer: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 8,
      backgroundColor: c.surface,
    },
    fecharBotao: {
      alignSelf: 'flex-end',
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    fecharTexto: {
      color: c.primary,
      fontWeight: '600',
    },
  });
}
