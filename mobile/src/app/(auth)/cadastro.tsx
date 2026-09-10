import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DateInput } from '@/components/date-input';
import { ProvasPrincipaisEditor, type ProvaEmEdicao } from '@/components/provas-principais-editor';
import { WebCenteredForm } from '@/components/web-centered-form';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { api, ApiError } from '@/lib/api';
import type { Cores } from '@/lib/theme';
import { CATEGORIA_LABEL, calcularCategoriaPrevia, SEXOS, SEXO_LABEL, type Sexo, type TipoUsuario } from '@/lib/types';

export default function CadastroScreen() {
  const { cadastrar } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  const [tipo, setTipo] = useState<TipoUsuario>('ATLETA');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState<Sexo | null>(null);
  const [codigoConvite, setCodigoConvite] = useState('');
  const [provas, setProvas] = useState<ProvaEmEdicao[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const categoriaPrevia = tipo === 'ATLETA' ? calcularCategoriaPrevia(dataNascimento) : null;

  async function handleSubmit() {
    setErro(null);

    if (!nome.trim() || !email.trim() || !senha) {
      setErro('Preencha nome, e-mail e senha.');
      return;
    }
    if (senha.length < 6) {
      setErro('Senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (tipo === 'ATLETA' && !dataNascimento.trim()) {
      setErro('Informe a data de nascimento (DD/MM/AAAA).');
      return;
    }
    if (tipo === 'ATLETA' && !sexo) {
      setErro('Selecione o sexo.');
      return;
    }
    if (tipo === 'TECNICO' && !codigoConvite.trim()) {
      setErro('Informe o código de convite de técnico.');
      return;
    }

    setCarregando(true);
    try {
      if (tipo === 'ATLETA') {
        const { token } = await cadastrar({
          tipo: 'ATLETA',
          nome: nome.trim(),
          email: email.trim(),
          senha,
          dataNascimento: dataNascimento.trim(),
          sexo: sexo!,
        });

        // Provas principais são opcionais — se o técnico já criou a conta
        // mas isso falhar por algum motivo, não faz sentido barrar o
        // cadastro por causa disso. Dá pra escolher depois em Perfil.
        if (provas.length > 0) {
          try {
            await api.salvarProvasPrincipais(token, {
              provas: provas.map((p) => ({ estilo: p.estilo, distancia: Number(p.distancia) })),
            });
          } catch {
            // silencioso de propósito, ver comentário acima
          }
        }
      } else {
        await cadastrar({
          tipo: 'TECNICO',
          nome: nome.trim(),
          email: email.trim(),
          senha,
          codigoConvite: codigoConvite.trim(),
        });
      }
    } catch (error) {
      setErro(error instanceof ApiError ? error.message : 'Não foi possível concluir o cadastro.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <WebCenteredForm>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Criar conta</Text>

        <View style={styles.segmentedControl}>
          <Pressable
            style={[styles.segment, tipo === 'ATLETA' && styles.segmentAtivo]}
            onPress={() => setTipo('ATLETA')}
          >
            <Text style={[styles.segmentTexto, tipo === 'ATLETA' && styles.segmentTextoAtivo]}>Sou atleta</Text>
          </Pressable>
          <Pressable
            style={[styles.segment, tipo === 'TECNICO' && styles.segmentAtivo]}
            onPress={() => setTipo('TECNICO')}
          >
            <Text style={[styles.segmentTexto, tipo === 'TECNICO' && styles.segmentTextoAtivo]}>Sou técnico</Text>
          </Pressable>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Nome completo"
          placeholderTextColor={colors.placeholder}
          value={nome}
          onChangeText={setNome}
        />
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha (mín. 6 caracteres)"
          placeholderTextColor={colors.placeholder}
          secureTextEntry
          value={senha}
          onChangeText={setSenha}
        />

        {tipo === 'ATLETA' ? (
          <>
            <DateInput value={dataNascimento} onChange={setDataNascimento} placeholder="Data de nascimento" />
            {categoriaPrevia ? (
              <Text style={styles.categoriaPrevia}>
                Categoria: <Text style={styles.categoriaPreviaValor}>{CATEGORIA_LABEL[categoriaPrevia]}</Text> (calculada
                automaticamente pela idade)
              </Text>
            ) : null}

            <Text style={styles.label}>Sexo</Text>
            <View style={styles.segmentedControl}>
              {SEXOS.map((s) => (
                <Pressable
                  key={s}
                  style={[styles.segment, sexo === s && styles.segmentAtivo]}
                  onPress={() => setSexo(s)}
                >
                  <Text style={[styles.segmentTexto, sexo === s && styles.segmentTextoAtivo]}>{SEXO_LABEL[s]}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, styles.secaoComEspaco]}>Provas principais (opcional)</Text>
            <Text style={styles.secaoDescricao}>
              Escolha até 4 provas pra destacar no seu perfil — se preferir, dá pra fazer isso depois.
            </Text>
            <ProvasPrincipaisEditor provas={provas} onChange={setProvas} />
          </>
        ) : (
          <TextInput
            style={styles.input}
            placeholder="Código de convite de técnico"
            placeholderTextColor={colors.placeholder}
            value={codigoConvite}
            onChangeText={setCodigoConvite}
          />
        )}

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <Pressable style={styles.botao} onPress={handleSubmit} disabled={carregando}>
          {carregando ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.botaoTexto}>Criar conta</Text>
          )}
        </Pressable>

        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <Text style={styles.link}>Já tem conta? Entrar</Text>
        </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </WebCenteredForm>
  );
}

function criarEstilos(c: Cores) {
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
      paddingBottom: 60,
      gap: 12,
      backgroundColor: c.background,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 8,
      color: c.text,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textMuted,
    },
    secaoComEspaco: {
      marginTop: 8,
    },
    secaoDescricao: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: -4,
    },
    input: {
      borderWidth: 1,
      borderColor: c.borderInput,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: c.surface,
      color: c.text,
    },
    segmentedControl: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 4,
    },
    segment: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
    },
    segmentAtivo: {
      backgroundColor: c.primary,
    },
    segmentTexto: {
      color: c.primary,
      fontWeight: '600',
    },
    segmentTextoAtivo: {
      color: c.onPrimary,
    },
    categoriaPrevia: {
      fontSize: 13,
      color: c.textMuted,
    },
    categoriaPreviaValor: {
      fontWeight: '700',
      color: c.primary,
    },
    botao: {
      backgroundColor: c.primary,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    botaoTexto: {
      color: c.onPrimary,
      fontWeight: '600',
      fontSize: 16,
    },
    erro: {
      color: c.danger,
      fontSize: 14,
    },
    link: {
      textAlign: 'center',
      marginTop: 16,
      color: c.primary,
    },
  });
}
