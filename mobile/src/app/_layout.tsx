import { ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { TelaCarregamento } from '@/components/tela-carregamento';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { ThemeProvider, useTheme } from '@/context/theme-context';
import { NAV_TEMAS } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SplashScreenController />
        <StatusBarController />
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

// A splash nativa some assim que a árvore JS monta — dali em diante quem
// cobre a restauração da sessão é a TelaCarregamento (que já personaliza com
// a foto do atleta, se houver), evitando duas telas de carregamento em
// sequência.
function SplashScreenController() {
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  return null;
}

function StatusBarController() {
  const { scheme } = useTheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

function RootNavigator() {
  const { usuario, isLoading } = useAuth();
  const { scheme, colors } = useTheme();

  return (
    <NavigationThemeProvider value={NAV_TEMAS[scheme]}>
      {isLoading ? (
        <TelaCarregamento />
      ) : (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Protected guard={!usuario}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>

          <Stack.Protected guard={usuario?.tipo === 'TECNICO'}>
            <Stack.Screen name="(tecnico)" />
          </Stack.Protected>

          <Stack.Protected guard={usuario?.tipo === 'ATLETA'}>
            <Stack.Screen name="(atleta)" />
          </Stack.Protected>
        </Stack>
      )}
    </NavigationThemeProvider>
  );
}
