import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { CriadoPorBadge } from '@/components/criado-por-badge';
import { ExportarTreinoPdfButton } from '@/components/exportar-treino-pdf-button';
import { TreinoForm } from '@/components/treino-form';
import { TreinoSomenteLeitura } from '@/components/treino-somente-leitura';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { api, ApiError } from '@/lib/api';
import type { Cores } from '@/lib/theme';
import type { Treino } from '@/lib/types';

export default function EditarTreinoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, usuario } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const [treino, setTreino] = useState<Treino | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    api
      .obterTreino(token!, id)
      .then((res) => {
        if (ativo) setTreino(res.treino);
      })
      .catch((error: unknown) => {
        if (ativo) setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar o treino.');
      });
    return () => {
      ativo = false;
    };
  }, [id, token]);

  if (erro) {
    return (
      <View style={styles.center}>
        <Text style={styles.erro}>{erro}</Text>
      </View>
    );
  }

  if (!treino) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const souCriador = treino.criadoPorUsuarioId === usuario?.id;
  // Admin pode editar/excluir o treino de qualquer um, não só o próprio —
  // ver Usuario.admin e obterTreinoParaEditar no backend. O selo continua
  // mostrando o criador de verdade (souCriador), só quem pode mexer muda.
  const podeEditar = souCriador || usuario?.admin === true;

  return (
    <View style={styles.container}>
      <CriadoPorBadge nome={treino.criadoPorNome ?? '—'} souCriador={souCriador} />
      {podeEditar && !souCriador ? (
        <Text style={styles.avisoAdmin}>Editando como administrador — este treino não é seu.</Text>
      ) : null}

      <Pressable
        style={styles.verRegistros}
        onPress={() => router.push({ pathname: '/registros/[id]', params: { id } })}
      >
        <Text style={styles.verRegistrosTexto}>Ver registros dos atletas →</Text>
      </Pressable>

      <ExportarTreinoPdfButton treino={treino} />

      {podeEditar ? (
        <TreinoForm
          inicial={treino}
          submitLabel="Salvar alterações"
          onSubmit={async (dados) => {
            await api.atualizarTreino(token!, id, dados);
            router.back();
          }}
          onExcluir={async () => {
            await api.excluirTreino(token!, id);
            router.back();
          }}
        />
      ) : (
        <TreinoSomenteLeitura treino={treino} />
      )}
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: c.background,
    },
    erro: {
      color: c.danger,
      fontSize: 14,
      textAlign: 'center',
    },
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    verRegistros: {
      paddingHorizontal: 24,
      paddingTop: 16,
    },
    verRegistrosTexto: {
      color: c.primary,
      fontWeight: '600',
      fontSize: 14,
    },
    avisoAdmin: {
      marginHorizontal: 24,
      marginTop: 8,
      fontSize: 12,
      fontWeight: '600',
      color: c.warning,
    },
  });
}
