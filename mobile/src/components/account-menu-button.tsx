import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { obterFotoPerfil } from '@/lib/perfil-foto';
import type { Cores } from '@/lib/theme';

// Foto de perfil não tem suporte na web (câmera/galeria via
// expo-image-picker não funcionam do mesmo jeito lá) — fora isso, vale pros
// dois perfis, técnico e atleta.
const PODE_TER_FOTO = Platform.OS !== 'web';

export function AccountMenuButton() {
  const { usuario, logout } = useAuth();
  const { scheme, colors, toggleScheme } = useTheme();
  const styles = criarEstilos(colors);
  const [aberto, setAberto] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);

  const mostrarFoto = PODE_TER_FOTO && !!usuario;

  // Recarrega ao focar a tela (não só no mount) pra refletir uma troca de
  // foto feita na tela de Perfil assim que o usuário volta pra cá.
  useFocusEffect(
    useCallback(() => {
      if (!mostrarFoto || !usuario) return;
      obterFotoPerfil(usuario.id).then(setFoto);
    }, [mostrarFoto, usuario]),
  );

  function handleAlternarTema() {
    setAberto(false);
    toggleScheme();
  }

  function handleSair() {
    setAberto(false);
    logout();
  }

  function handlePerfil() {
    setAberto(false);
    router.push('/perfil');
  }

  return (
    <>
      <Pressable onPress={() => setAberto(true)} hitSlop={12} style={styles.botao}>
        {mostrarFoto && foto ? (
          <Image source={{ uri: foto }} style={styles.avatar} />
        ) : mostrarFoto ? (
          <View style={styles.avatarVazio}>
            <Text style={styles.avatarVazioTexto}>{(usuario?.nome ?? '?').charAt(0).toUpperCase()}</Text>
          </View>
        ) : (
          <Text style={styles.botaoTexto}>⋯</Text>
        )}
      </Pressable>

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <Pressable style={styles.backdrop} onPress={() => setAberto(false)}>
          <View style={styles.menu}>
            <Pressable style={styles.item} onPress={handlePerfil}>
              <Text style={styles.itemTexto}>👤  Perfil</Text>
            </Pressable>
            <View style={styles.separador} />
            <Pressable style={styles.item} onPress={handleAlternarTema}>
              <Text style={styles.itemTexto}>{scheme === 'dark' ? '☀️  Modo claro' : '🌙  Modo escuro'}</Text>
            </Pressable>
            <View style={styles.separador} />
            <Pressable style={styles.item} onPress={handleSair}>
              <Text style={[styles.itemTexto, styles.itemTextoPerigo]}>Sair</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    botao: {
      marginRight: 16,
      paddingHorizontal: 4,
    },
    botaoTexto: {
      fontSize: 20,
      fontWeight: '700',
      color: c.primary,
    },
    avatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
    },
    avatarVazio: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarVazioTexto: {
      fontSize: 14,
      fontWeight: '700',
      color: c.primary,
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.15)',
    },
    menu: {
      position: 'absolute',
      top: Platform.select({ ios: 100, android: 64, default: 64 }),
      right: 16,
      minWidth: 200,
      backgroundColor: c.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 4,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    item: {
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    itemTexto: {
      fontSize: 15,
      color: c.text,
    },
    itemTextoPerigo: {
      color: c.danger,
    },
    separador: {
      height: 1,
      backgroundColor: c.border,
      marginHorizontal: 8,
    },
  });
}
