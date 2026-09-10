import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EstadoErro } from '@/components/estado-erro';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { alertar } from '@/lib/alerta';
import { api, ApiError } from '@/lib/api';
import { formatarTempo } from '@/lib/tempo';
import type { Cores } from '@/lib/theme';
import {
  CATEGORIAS,
  CATEGORIA_LABEL,
  ESTILOS,
  formatarProva,
  PISCINA_LABEL,
  SEXO_LABEL,
  type Categoria,
  type Estilo,
  type RecordeHistorico,
  type Sexo,
  type TamanhoPiscina,
} from '@/lib/types';

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

type Grupo = { chave: string; titulo: string; recordes: RecordeHistorico[] };

function agrupar(recordes: RecordeHistorico[]): Grupo[] {
  const mapa = new Map<string, Grupo>();
  for (const r of recordes) {
    const chave = `${r.estilo}|${r.distancia}|${r.categoria}|${r.sexo}|${r.piscina}`;
    let grupo = mapa.get(chave);
    if (!grupo) {
      grupo = {
        chave,
        titulo: `${formatarProva(r.estilo, r.distancia)} — ${CATEGORIA_LABEL[r.categoria]} · ${SEXO_LABEL[r.sexo]} · Piscina ${PISCINA_LABEL[r.piscina]}`,
        recordes: [],
      };
      mapa.set(chave, grupo);
    }
    grupo.recordes.push(r);
  }
  const ordemEstilo = new Map(ESTILOS.map((e, i) => [e, i]));
  const ordemCategoria = new Map(CATEGORIAS.map((c, i) => [c, i]));
  const grupos = Array.from(mapa.values());
  for (const g of grupos) {
    g.recordes.sort((a, b) => b.tempoCentesimos - a.tempoCentesimos);
  }
  grupos.sort((a, b) => {
    const [ea, da, ca, sa, pa] = a.chave.split('|') as [Estilo, string, Categoria, Sexo, TamanhoPiscina];
    const [eb, db, cb, sb, pb] = b.chave.split('|') as [Estilo, string, Categoria, Sexo, TamanhoPiscina];
    const diffEstilo = (ordemEstilo.get(ea) ?? 0) - (ordemEstilo.get(eb) ?? 0);
    if (diffEstilo !== 0) return diffEstilo;
    const diffDistancia = Number(da) - Number(db);
    if (diffDistancia !== 0) return diffDistancia;
    const diffCategoria = (ordemCategoria.get(ca) ?? 0) - (ordemCategoria.get(cb) ?? 0);
    if (diffCategoria !== 0) return diffCategoria;
    if (sa !== sb) return sa.localeCompare(sb);
    return pa.localeCompare(pb);
  });
  return grupos;
}

export default function GerenciarRecordesScreen() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  const [recordes, setRecordes] = useState<RecordeHistorico[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [importando, setImportando] = useState(false);

  const carregar = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.listarRecordesHistorico(token);
      setRecordes(res.recordes);
      setErro(null);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar os recordes.');
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  const grupos = useMemo(() => agrupar(recordes ?? []), [recordes]);

  async function handleImportar() {
    if (!token || importando) return;

    const resultado = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', '*/*'],
      copyToCacheDirectory: true,
    });
    if (resultado.canceled || resultado.assets.length === 0) return;

    setImportando(true);
    try {
      const asset = resultado.assets[0];
      // Na web, expo-file-system não funciona de verdade (é só um stub que
      // avisa e não faz nada) — o próprio DocumentPicker já devolve o
      // arquivo como um File do navegador nesse caso, que sabe ler seu
      // próprio conteúdo. No nativo (iOS/Android) esse campo não vem, e aí
      // sim usamos o expo-file-system pra ler pela uri.
      const csv = asset.file ? await asset.file.text() : await new File(asset.uri).text();
      const res = await api.importarRecordes(token, csv);

      const resumo = `${res.criados} recorde(s) importado(s), ${res.ignorados} linha(s) ignorada(s).`;
      const detalhes = res.erros.slice(0, 8).join('\n');
      alertar('Importação concluída', detalhes ? `${resumo}\n\n${detalhes}` : resumo);

      await carregar();
    } catch (error) {
      alertar('Erro na importação', error instanceof ApiError ? error.message : 'Não foi possível importar o CSV.');
    } finally {
      setImportando(false);
    }
  }

  return (
    <View style={styles.tela}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerBotoes}>
              <Pressable onPress={handleImportar} hitSlop={10} disabled={importando} style={{ marginRight: 14 }}>
                {importando ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.headerBotaoTexto}>Importar CSV</Text>
                )}
              </Pressable>
              <Pressable onPress={() => router.push('/recorde/novo')} hitSlop={10}>
                <Text style={[styles.headerBotaoTexto, { fontSize: 24, lineHeight: 24 }]}>+</Text>
              </Pressable>
            </View>
          ),
        }}
      />

      <Text style={styles.dica}>
        CSV ou planilha colada com colunas: estilo, distancia, categoria (ex: Infantil 1), sexo (M/F), piscina (25 ou
        50), tempo (ex: 00.28.89 ou 28,89), nomeAtleta, data (dd/mm/aaaa).
      </Text>

      {!recordes && !erro ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : null}

      {erro && !recordes ? <EstadoErro mensagem={erro} aoTentarNovamente={carregar} /> : null}

      {recordes ? (
        <ScrollView contentContainerStyle={styles.lista}>
          {erro ? (
            <View style={styles.avisoBanner}>
              <Text style={styles.avisoBannerTexto}>{erro}</Text>
            </View>
          ) : null}
          {grupos.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.vazioTexto}>Nenhum recorde cadastrado ainda.</Text>
            </View>
          ) : (
            grupos.map((g) => (
              <View key={g.chave} style={styles.grupo}>
                <Text style={styles.grupoTitulo}>{g.titulo}</Text>
                {g.recordes.map((r) => (
                  <Pressable
                    key={r.id}
                    style={styles.linha}
                    onPress={() => router.push({ pathname: '/recorde/[id]', params: { id: r.id } })}
                  >
                    <View style={styles.info}>
                      <Text style={styles.tempo}>{formatarTempo(r.tempoCentesimos)}</Text>
                      <Text style={styles.nome}>
                        {r.nomeAtleta} · {formatarData(r.data)}
                      </Text>
                    </View>
                    {r.atual ? (
                      <View style={styles.atualBadge}>
                        <Text style={styles.atualTexto}>atual</Text>
                      </View>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      ) : null}
    </View>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    tela: {
      flex: 1,
      backgroundColor: c.background,
    },
    headerBotoes: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerBotaoTexto: {
      fontSize: 14,
      fontWeight: '600',
      color: c.primary,
    },
    dica: {
      fontSize: 12,
      color: c.textMuted,
      padding: 16,
      paddingBottom: 4,
    },
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
    avisoBanner: {
      backgroundColor: c.dangerSoft,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      marginBottom: 12,
    },
    avisoBannerTexto: {
      color: c.danger,
      fontSize: 13,
      textAlign: 'center',
    },
    vazioTexto: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: 'center',
    },
    lista: {
      padding: 16,
      gap: 16,
      flexGrow: 1,
    },
    grupo: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      padding: 14,
      backgroundColor: c.surface,
    },
    grupoTitulo: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
      marginBottom: 4,
    },
    linha: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    info: {
      gap: 1,
    },
    tempo: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    nome: {
      fontSize: 12,
      color: c.textMuted,
    },
    atualBadge: {
      backgroundColor: c.successSoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    atualTexto: {
      fontSize: 11,
      fontWeight: '700',
      color: c.success,
    },
  });
}
