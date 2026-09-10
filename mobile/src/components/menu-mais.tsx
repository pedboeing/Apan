import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/theme-context';
import type { Cores } from '@/lib/theme';

export type ItemMenuMais = {
  label: string;
  descricao: string;
  onPress: () => void;
  // Funcionalidade ainda não disponível — item fica visível (pra dar
  // contexto do que vem por aí) mas sem navegação, com um selo "Em breve"
  // no lugar da seta.
  bloqueado?: boolean;
};

type Props = {
  itens: ItemMenuMais[];
};

export function MenuMais({ itens }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  return (
    <View style={styles.tela}>
      {itens.map((item) => (
        <Pressable
          key={item.label}
          style={[styles.item, item.bloqueado && styles.itemBloqueado]}
          onPress={item.bloqueado ? undefined : item.onPress}
          disabled={item.bloqueado}
        >
          <View style={styles.itemTextos}>
            <Text style={[styles.itemLabel, item.bloqueado && styles.itemLabelBloqueado]}>{item.label}</Text>
            <Text style={styles.itemDescricao}>{item.descricao}</Text>
          </View>
          {item.bloqueado ? (
            <Text style={styles.emBreve}>Em breve</Text>
          ) : (
            <Text style={styles.seta}>›</Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    tela: {
      flex: 1,
      backgroundColor: c.background,
      padding: 16,
      gap: 10,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 16,
      backgroundColor: c.surface,
    },
    itemBloqueado: {
      opacity: 0.6,
    },
    itemTextos: {
      gap: 2,
      flex: 1,
    },
    itemLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
    },
    itemLabelBloqueado: {
      color: c.textMuted,
    },
    itemDescricao: {
      fontSize: 13,
      color: c.textMuted,
    },
    seta: {
      fontSize: 22,
      color: c.placeholder,
      marginLeft: 8,
    },
    emBreve: {
      fontSize: 11,
      fontWeight: '700',
      color: c.textMuted,
      backgroundColor: c.border,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      marginLeft: 8,
      overflow: 'hidden',
    },
  });
}
