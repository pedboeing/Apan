import { router, Tabs } from 'expo-router';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import { AccountMenuButton } from '@/components/account-menu-button';
import { useTheme } from '@/context/theme-context';

// Abaixo disso continua abas embaixo (like um celular); a partir daqui vira
// uma barra lateral — o expo-router já faz essa troca sozinho, só precisa
// dizer a partir de que largura.
const LARGURA_QUEBRA_SIDEBAR = 768;

export default function TecnicoTabsLayout() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const comSidebar = width >= LARGURA_QUEBRA_SIDEBAR;

  return (
    <Tabs screenOptions={{ tabBarPosition: comSidebar ? 'left' : 'bottom' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Treinos',
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable onPress={() => router.push('/treino/novo')} hitSlop={12} style={{ marginRight: 16 }}>
                <Text style={{ fontSize: 28, color: colors.primary, lineHeight: 28 }}>+</Text>
              </Pressable>
              <AccountMenuButton />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="atletas" options={{ title: 'Atletas', headerRight: () => <AccountMenuButton /> }} />
      <Tabs.Screen name="mais" options={{ title: 'Mais', headerRight: () => <AccountMenuButton /> }} />
    </Tabs>
  );
}
