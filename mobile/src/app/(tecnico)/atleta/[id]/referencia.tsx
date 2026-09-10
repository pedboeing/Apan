import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ExportarTabelaReferenciaPdfButton } from '@/components/exportar-tabela-referencia-pdf-button';
import { ZonaTreinamentoCard } from '@/components/zona-treinamento-card';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { api, ApiError } from '@/lib/api';
import type { Cores } from '@/lib/theme';
import { CATEGORIA_LABEL, type Categoria, type ProvaComZonas } from '@/lib/types';

type Piscina = 'M50' | 'M25';

type Dados = {
  atleta: { id: string; nome: string; categoria: Categoria };
  m25: ProvaComZonas[];
  m50: ProvaComZonas[];
};

export default function AtletaReferenciaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [piscina, setPiscina] = useState<Piscina>('M50');

  useEffect(() => {
    let ativo = true;
    api
      .tabelaReferenciaAtleta(token!, id)
      .then((res) => {
        if (ativo) setDados(res);
      })
      .catch((error: unknown) => {
        if (ativo) setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar a tabela.');
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

  if (!dados) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const provas = piscina === 'M50' ? dados.m50 : dados.m25;
  const corAtiva = piscina === 'M50' ? colors.primary : colors.accent;
  const semProvasPrincipais = dados.m50.length === 0;

  return (
    <ScrollView contentContainerStyle={styles.lista}>
      <View style={styles.headerContainer}>
        <Text style={styles.nome}>{dados.atleta.nome}</Text>
        <Text style={styles.categoria}>{CATEGORIA_LABEL[dados.atleta.categoria]}</Text>
      </View>

      {semProvasPrincipais ? (
        <Text style={styles.vazioTexto}>Esse atleta ainda não escolheu provas principais.</Text>
      ) : (
        <>
          <View style={styles.abas}>
            <Pressable
              style={[styles.aba, piscina === 'M50' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setPiscina('M50')}
            >
              <Text style={[styles.abaTexto, piscina === 'M50' && styles.abaTextoAtiva]}>🏊 Piscina 50m</Text>
            </Pressable>
            <Pressable
              style={[styles.aba, piscina === 'M25' && { backgroundColor: colors.accent, borderColor: colors.accent }]}
              onPress={() => setPiscina('M25')}
            >
              <Text style={[styles.abaTexto, piscina === 'M25' && styles.abaTextoAtiva]}>🏊 Piscina 25m</Text>
            </Pressable>
          </View>

          {provas.map((p) => (
            <ZonaTreinamentoCard key={`${p.estilo}-${p.distancia}`} prova={p} cor={corAtiva} />
          ))}

          <ExportarTabelaReferenciaPdfButton atletaNome={dados.atleta.nome} m25={dados.m25} m50={dados.m50} />
        </>
      )}
    </ScrollView>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    erro: {
      color: c.danger,
      fontSize: 14,
      textAlign: 'center',
    },
    vazioTexto: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: 'center',
    },
    lista: {
      padding: 16,
      gap: 12,
      flexGrow: 1,
    },
    headerContainer: {
      gap: 6,
      marginBottom: 8,
    },
    nome: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
    },
    categoria: {
      fontSize: 12,
      fontWeight: '600',
      color: c.primary,
      alignSelf: 'flex-start',
      backgroundColor: c.primarySoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      overflow: 'hidden',
    },
    abas: {
      flexDirection: 'row',
      gap: 8,
    },
    aba: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.borderInput,
      borderRadius: 16,
      paddingVertical: 10,
      alignItems: 'center',
    },
    abaTexto: {
      fontSize: 13,
      fontWeight: '700',
      color: c.textMuted,
    },
    abaTextoAtiva: {
      color: c.onPrimary,
    },
  });
}
