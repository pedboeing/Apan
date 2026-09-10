import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { secureStorage } from '@/lib/storage';
import { PALETAS, type Cores, type EsquemaCor } from '@/lib/theme';

const TEMA_KEY = 'apan.tema';

type ThemeContextValue = {
  scheme: EsquemaCor;
  colors: Cores;
  toggleScheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const value = use(ThemeContext);
  if (!value) {
    throw new Error('useTheme precisa estar dentro de <ThemeProvider />');
  }
  return value;
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const sistemaScheme = useColorScheme();
  const [scheme, setScheme] = useState<EsquemaCor>(sistemaScheme === 'dark' ? 'dark' : 'light');

  // Sobrescreve o padrão do sistema assim que a preferência salva localmente
  // termina de carregar (se o usuário já escolheu um modo antes).
  useEffect(() => {
    secureStorage.getItem(TEMA_KEY).then((salvo) => {
      if (salvo === 'light' || salvo === 'dark') {
        setScheme(salvo);
      }
    });
  }, []);

  function toggleScheme() {
    setScheme((atual) => {
      const novo: EsquemaCor = atual === 'dark' ? 'light' : 'dark';
      secureStorage.setItem(TEMA_KEY, novo);
      return novo;
    });
  }

  return (
    <ThemeContext.Provider value={{ scheme, colors: PALETAS[scheme], toggleScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
