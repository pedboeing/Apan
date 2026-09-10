import { router, Stack } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AccountMenuButton } from '@/components/account-menu-button';
import { useTheme } from '@/context/theme-context';

export default function TecnicoLayout() {
  const { colors } = useTheme();

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="treino/novo" options={{ title: 'Novo treino' }} />
      <Stack.Screen name="treino/[id]" options={{ title: 'Editar treino' }} />
      <Stack.Screen name="registros/[id]" options={{ title: 'Registros do treino' }} />
      <Stack.Screen name="atleta/[id]/index" options={{ title: 'Intensidade' }} />
      <Stack.Screen name="atleta/[id]/competicoes" options={{ title: 'Histórico de competições' }} />
      <Stack.Screen name="atleta/[id]/marcas" options={{ title: 'Melhores marcas' }} />
      <Stack.Screen name="atleta/[id]/referencia" options={{ title: 'Tabela de referência' }} />
      <Stack.Screen name="recorde/gerenciar" options={{ title: 'Gerenciar recordes' }} />
      <Stack.Screen name="recorde/novo" options={{ title: 'Novo recorde' }} />
      <Stack.Screen name="recorde/[id]" options={{ title: 'Editar recorde' }} />
      <Stack.Screen name="educativo/novo" options={{ title: 'Novo educativo' }} />
      <Stack.Screen name="educativo/pendentes" options={{ title: 'Fila de aprovação' }} />
      <Stack.Screen name="educativo/[id]" options={{ title: 'Educativo' }} />
      <Stack.Screen name="educativo/editar/[id]" options={{ title: 'Editar educativo' }} />
      <Stack.Screen name="perfil" options={{ title: 'Perfil' }} />

      {/* Alcançadas a partir da aba "Mais" — empilhadas como qualquer outra
          tela (não são mais abas), então dá pra sair delas com o gesto
          nativo de deslizar da esquerda pra direita. */}
      <Stack.Screen
        name="frequencia"
        options={{ title: 'Frequência', headerRight: () => <AccountMenuButton /> }}
      />
      <Stack.Screen
        name="recordes"
        options={{
          title: 'Recordes',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable onPress={() => router.push('/recorde/gerenciar')} hitSlop={12} style={{ marginRight: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>Gerenciar</Text>
              </Pressable>
              <AccountMenuButton />
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="educativos"
        options={{
          title: 'Educativos',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable onPress={() => router.push('/educativo/pendentes')} hitSlop={12} style={{ marginRight: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>Fila</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/educativo/novo')} hitSlop={12} style={{ marginRight: 16 }}>
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
