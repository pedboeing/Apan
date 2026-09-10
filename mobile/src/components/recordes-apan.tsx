import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EstadoErro } from '@/components/estado-erro';
import { PainelFiltros } from '@/components/painel-filtros';
import { RecordeCard } from '@/components/recorde-card';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { api, ApiError } from '@/lib/api';
import type { Cores } from '@/lib/theme';
import {
  CATEGORIAS,
  CATEGORIA_LABEL,
  ESTILOS,
  ESTILO_LABEL,
  formatarProva,
  PISCINAS,
  PISCINA_LABEL,
  SEXOS,
  SEXO_LABEL,
  type Categoria,
  type Estilo,
  type RecordeInterno,
  type Sexo,
  type TamanhoPiscina,
} from '@/lib/types';

type Grupo = { estilo: Estilo; distancia: number; recordes: RecordeInterno[] };

function agrupar(recordes: RecordeInterno[]): Grupo[] {
  const mapa = new Map<string, Grupo>();
  for (const r of recordes) {
    const chave = `${r.estilo}|${r.distancia}`;
    let grupo = mapa.get(chave);
    if (!grupo) {
      grupo = { estilo: r.estilo, distancia: r.distancia, recordes: [] };
      mapa.set(chave, grupo);
    }
    grupo.recordes.push(r);
  }
  const grupos = Array.from(mapa.values());
  const ordemCategoria = new Map(CATEGORIAS.map((c, i) => [c, i]));
  for (const g of grupos) {
    g.recordes.sort((a, b) => (ordemCategoria.get(a.categoria) ?? 0) - (ordemCategoria.get(b.categoria) ?? 0));
  }
  const ordemEstilo = new Map(ESTILOS.map((e, i) => [e, i]));
  grupos.sort((a, b) => {
    const diff = (ordemEstilo.get(a.estilo) ?? 0) - (ordemEstilo.get(b.estilo) ?? 0);
    if (diff !== 0) return diff;
    return a.distancia - b.distancia;
  });
  return grupos;
}

export function RecordesApan() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  const [estilo, setEstilo] = useState<Estilo | null>(null);
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [sexo, setSexo] = useState<Sexo | null>(null);
  const [piscina, setPiscina] = useState<TamanhoPiscina | null>(null);
  const [recordes, setRecordes] = useState<RecordeInterno[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.listarRecordes(token, {
        estilo: estilo ?? undefined,
        categoria: categoria ?? undefined,
        sexo: sexo ?? undefined,
        piscina: piscina ?? undefined,
      });
      setRecordes(res.recordes);
      setErro(null);
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível carregar os recordes.');
    }
  }, [token, estilo, categoria, sexo, piscina]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  const grupos = useMemo(() => agrupar(recordes ?? []), [recordes]);

  const filtrosAtivos = [
    estilo ? ESTILO_LABEL[estilo] : null,
    categoria ? CATEGORIA_LABEL[categoria] : null,
    sexo ? SEXO_LABEL[sexo] : null,
    piscina ? `Piscina ${PISCINA_LABEL[piscina]}` : null,
  ].filter((v): v is string => v !== null);

  return (
    <View style={styles.tela}>
      <PainelFiltros
        titulo="Filtros"
        resumo={filtrosAtivos.length > 0 ? filtrosAtivos.join(' · ') : 'Todos os recordes'}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chips}>
            <Pressable style={[styles.chip, estilo === null && styles.chipAtivo]} onPress={() => setEstilo(null)}>
              <Text style={[styles.chipTexto, estilo === null && styles.chipTextoAtivo]}>Todos os estilos</Text>
            </Pressable>
            {ESTILOS.map((e) => (
              <Pressable
                key={e}
                style={[styles.chip, estilo === e && styles.chipAtivo]}
                onPress={() => setEstilo(estilo === e ? null : e)}
              >
                <Text style={[styles.chipTexto, estilo === e && styles.chipTextoAtivo]}>{ESTILO_LABEL[e]}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chips}>
            <Pressable
              style={[styles.chip, categoria === null && styles.chipAtivo]}
              onPress={() => setCategoria(null)}
            >
              <Text style={[styles.chipTexto, categoria === null && styles.chipTextoAtivo]}>Todas categorias</Text>
            </Pressable>
            {CATEGORIAS.map((c) => (
              <Pressable
                key={c}
                style={[styles.chip, categoria === c && styles.chipAtivo]}
                onPress={() => setCategoria(categoria === c ? null : c)}
              >
                <Text style={[styles.chipTexto, categoria === c && styles.chipTextoAtivo]}>{CATEGORIA_LABEL[c]}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chips}>
            <Pressable style={[styles.chip, sexo === null && styles.chipAtivo]} onPress={() => setSexo(null)}>
              <Text style={[styles.chipTexto, sexo === null && styles.chipTextoAtivo]}>Todos</Text>
            </Pressable>
            {SEXOS.map((s) => (
              <Pressable
                key={s}
                style={[styles.chip, sexo === s && styles.chipAtivo]}
                onPress={() => setSexo(sexo === s ? null : s)}
              >
                <Text style={[styles.chipTexto, sexo === s && styles.chipTextoAtivo]}>{SEXO_LABEL[s]}</Text>
              </Pressable>
            ))}
            <Pressable style={[styles.chip, piscina === null && styles.chipAtivo]} onPress={() => setPiscina(null)}>
              <Text style={[styles.chipTexto, piscina === null && styles.chipTextoAtivo]}>Todas piscinas</Text>
            </Pressable>
            {PISCINAS.map((p) => (
              <Pressable
                key={p}
                style={[styles.chip, piscina === p && styles.chipAtivo]}
                onPress={() => setPiscina(piscina === p ? null : p)}
              >
                <Text style={[styles.chipTexto, piscina === p && styles.chipTextoAtivo]}>{PISCINA_LABEL[p]}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </PainelFiltros>

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
              <Text style={styles.vazioTexto}>Nenhum recorde cadastrado ainda para esse filtro.</Text>
            </View>
          ) : (
            grupos.map((g) => (
              <View key={`${g.estilo}-${g.distancia}`} style={styles.grupo}>
                <Text style={styles.grupoTitulo}>{formatarProva(g.estilo, g.distancia)}</Text>
                {g.recordes.map((r) => (
                  <RecordeCard key={r.id} recorde={r} />
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
    chips: {
      flexDirection: 'row',
      gap: 8,
    },
    chip: {
      borderWidth: 1,
      borderColor: c.borderInput,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    chipAtivo: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    chipTexto: {
      fontSize: 13,
      color: c.textMuted,
    },
    chipTextoAtivo: {
      color: c.onPrimary,
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
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
      marginBottom: 4,
    },
  });
}
