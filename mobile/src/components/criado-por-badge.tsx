import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/theme-context';
import type { Cores } from '@/lib/theme';

type Props = {
  nome: string;
  souCriador: boolean;
};

// Quem criou o treino é sempre puxado automaticamente do perfil de quem
// estava logado na hora de criar (ver criadoPorNome/criadoPorUsuarioId em
// treinos.routes.ts) — não existe campo pra digitar/editar isso em lugar
// nenhum do app, é só exibição.
export function CriadoPorBadge({ nome, souCriador }: Props) {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  return (
    <View style={[styles.badge, souCriador && styles.badgeProprio]}>
      <View style={[styles.avatar, souCriador && styles.avatarProprio]}>
        <Text style={styles.avatarTexto}>{nome.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.texto}>
        {souCriador ? 'Criado por você' : (
          <>
            Criado por <Text style={styles.nomeDestaque}>{nome}</Text>
          </>
        )}
      </Text>
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      alignSelf: 'flex-start',
      backgroundColor: c.primarySoft,
      borderRadius: 20,
      paddingVertical: 6,
      paddingRight: 14,
      paddingLeft: 6,
      marginHorizontal: 24,
      marginTop: 12,
    },
    badgeProprio: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    avatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary,
    },
    avatarProprio: {
      backgroundColor: c.textMuted,
    },
    avatarTexto: {
      color: c.onPrimary,
      fontSize: 12,
      fontWeight: '700',
    },
    texto: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textMuted,
    },
    nomeDestaque: {
      fontWeight: '800',
      color: c.primary,
    },
  });
}
