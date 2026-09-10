import { Tabs } from 'expo-router';
import { useWindowDimensions } from 'react-native';

import { AccountMenuButton } from '@/components/account-menu-button';

// Abaixo disso continua abas embaixo (like um celular); a partir daqui vira
// uma barra lateral — o expo-router já faz essa troca sozinho, só precisa
// dizer a partir de que largura.
const LARGURA_QUEBRA_SIDEBAR = 768;

export default function AtletaTabsLayout() {
  const { width } = useWindowDimensions();
  const comSidebar = width >= LARGURA_QUEBRA_SIDEBAR;

  return (
    <Tabs screenOptions={{ tabBarPosition: comSidebar ? 'left' : 'bottom' }}>
      <Tabs.Screen name="index" options={{ title: 'Meu treino', headerRight: () => <AccountMenuButton /> }} />
      <Tabs.Screen
        name="meu-historico"
        options={{ title: 'Meu histórico', headerRight: () => <AccountMenuButton /> }}
      />
      <Tabs.Screen name="mais" options={{ title: 'Mais', headerRight: () => <AccountMenuButton /> }} />
    </Tabs>
  );
}
