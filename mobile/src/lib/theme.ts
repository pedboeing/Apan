import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

export type EsquemaCor = 'light' | 'dark';

export type Cores = {
  background: string;
  surface: string;
  border: string;
  borderInput: string;
  text: string;
  textMuted: string;
  placeholder: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  // Roxo usado só pra distinguir piscina de 25m de piscina de 50m (que usa
  // "primary") em telas que mostram as duas lado a lado — não carrega
  // nenhum significado de status como as outras cores.
  accent: string;
  accentSoft: string;
};

// Paleta "água de piscina": azul profundo como cor principal (bordas de
// raia, água em dia nublado), verde-água para estados positivos, mantendo
// vermelho/âmbar convencionais para erro/aviso (não vale a pena sacrificar
// reconhecimento universal desses dois por tema). Usada em todo o app via
// useTheme() — mudar aqui já propaga pra tudo.
export const PALETAS: Record<EsquemaCor, Cores> = {
  light: {
    background: '#F3F8FA',
    surface: '#FFFFFF',
    border: '#DCE6EA',
    borderInput: '#C3D2D8',
    text: '#0B1F2A',
    textMuted: '#5B7480',
    placeholder: '#94A8AF',
    primary: '#0077B6',
    primarySoft: '#DFF1FA',
    onPrimary: '#FFFFFF',
    danger: '#D93B3B',
    dangerSoft: '#FBE4E4',
    success: '#12977E',
    successSoft: '#DEF4EF',
    warning: '#C97A0A',
    warningSoft: '#FDF0D9',
    accent: '#6B5CA5',
    accentSoft: '#EDE9F7',
  },
  dark: {
    background: '#081720',
    surface: '#102530',
    border: '#1E3A46',
    borderInput: '#2C4C59',
    text: '#EAF4F7',
    textMuted: '#8FA9B3',
    placeholder: '#6C8792',
    primary: '#4FC3E8',
    primarySoft: '#123B4A',
    onPrimary: '#06222C',
    danger: '#FF6B6B',
    dangerSoft: '#3A1517',
    success: '#3ADCC0',
    successSoft: '#0F2E2A',
    warning: '#F0B93D',
    warningSoft: '#3A2C0F',
    accent: '#B79FEA',
    accentSoft: '#2A2140',
  },
};

export const NAV_TEMAS: Record<EsquemaCor, Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: PALETAS.light.primary,
      background: PALETAS.light.background,
      card: PALETAS.light.surface,
      text: PALETAS.light.text,
      border: PALETAS.light.border,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: PALETAS.dark.primary,
      background: PALETAS.dark.background,
      card: PALETAS.dark.surface,
      text: PALETAS.dark.text,
      border: PALETAS.dark.border,
    },
  },
};
