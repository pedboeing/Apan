import { router, Stack } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AccountMenuButton } from '@/components/account-menu-button';
import { useTheme } from '@/context/theme-context';

export default function AtletaLayout() {
  const { colors } = useTheme();

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="treino/[id]" options={{ title: 'Treino' }} />
      <Stack.Screen name="educativo/[id]" options={{ title: 'Educativo' }} />
      <Stack.Screen name="educativo/sugerir" options={{ title: 'Sugerir educativo' }} />
      <Stack.Screen name="educativo/minhas-sugestoes" options={{ title: 'Minhas sugestões' }} />
      <Stack.Screen name="competicao/novo" options={{ title: 'Novo resultado' }} />
      <Stack.Screen name="competicao/[id]" options={{ title: 'Editar resultado' }} />
      <Stack.Screen name="marca/novo" options={{ title: 'Nova marca' }} />
      <Stack.Screen name="marca/[id]" options={{ title: 'Editar marca' }} />
      <Stack.Screen name="perfil" options={{ title: 'Perfil' }} />

      {/* Alcançadas a partir da aba "Mais" — empilhadas como qualquer outra
          tela (não são mais abas), então dá pra sair delas com o gesto
          nativo de deslizar da esquerda pra direita. */}
      <Stack.Screen
        name="referencia"
        options={{ title: 'Referência', headerRight: () => <AccountMenuButton /> }}
      />
      <Stack.Screen
        name="recordes"
        options={{ title: 'Recordes', headerRight: () => <AccountMenuButton /> }}
      />
      <Stack.Screen
        name="educativos"
        options={{
          title: 'Educativos',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable
                onPress={() => router.push('/educativo/minhas-sugestoes')}
                hitSlop={12}
                style={{ marginRight: 16 }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>Minhas sugestões</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/educativo/sugerir')} hitSlop={12} style={{ marginRight: 16 }}>
                <Text style={{ fontSize: 28, color: colors.primary, lineHeight: 28 }}>+</Text>
              </Pressable>
              <AccountMenuButton />
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="competicoes"
        options={{
          title: 'Competições',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable onPress={() => router.push('/competicao/novo')} hitSlop={12} style={{ marginRight: 16 }}>
                <Text style={{ fontSize: 28, color: colors.primary, lineHeight: 28 }}>+</Text>
              </Pressable>
              <AccountMenuButton />
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="marcas"
        options={{
          title: 'Melhores marcas',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable onPress={() => router.push('/marca/novo')} hitSlop={12} style={{ marginRight: 16 }}>
                <Text style={{ fontSize: 28, color: colors.primary, lineHeight: 28 }}>+</Text>
              </Pressable>
              <AccountMenuButton />
            </View>
          ),
        }}
      />
    </Stack>
  );
}
