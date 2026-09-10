import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { lerUsuarioSalvo } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { obterFotoPerfil } from '@/lib/perfil-foto';
import type { Cores } from '@/lib/theme';
import type { Usuario } from '@/lib/types';

// Mostrada enquanto a sessão salva é restaurada do dispositivo (bem rápido,
// mas evita o flash da tela de login antes de cair na área certa). Se o
// atleta já configurou uma foto de perfil neste aparelho, é a chance de
// personalizar esse momento em vez de só um spinner genérico.
export function TelaCarregamento() {
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [foto, setFoto] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    lerUsuarioSalvo().then(async (salvo) => {
      if (!ativo) return;
      setUsuario(salvo);
      if (salvo?.tipo === 'ATLETA') {
        const fotoSalva = await obterFotoPerfil(salvo.id);
        if (ativo) setFoto(fotoSalva);
      }
    });
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      {foto ? (
        <Image source={{ uri: foto }} style={styles.foto} />
      ) : (
        <Text style={styles.titulo}>APAN</Text>
      )}
      {usuario ? <Text style={styles.saudacao}>Bem-vindo de volta, {usuario.nome.split(' ')[0]}</Text> : null}
      <ActivityIndicator color={colors.primary} style={styles.spinner} />
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.background,
      gap: 12,
      padding: 24,
    },
    foto: {
      width: 96,
      height: 96,
      borderRadius: 48,
      marginBottom: 4,
    },
    titulo: {
      fontSize: 32,
      fontWeight: '700',
      color: c.primary,
      letterSpacing: 1,
    },
    saudacao: {
      fontSize: 15,
      color: c.textMuted,
      textAlign: 'center',
    },
    spinner: {
      marginTop: 8,
    },
  });
}
