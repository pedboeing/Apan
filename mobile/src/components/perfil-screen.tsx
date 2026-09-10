import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { EstadoErro } from '@/components/estado-erro';
import { ProvasPrincipaisEditor } from '@/components/provas-principais-editor';
import { WebCenteredForm } from '@/components/web-centered-form';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { api, ApiError } from '@/lib/api';
import { alertar } from '@/lib/alerta';
import { obterFotoPerfil, removerFotoPerfil, salvarFotoPerfil } from '@/lib/perfil-foto';
import type { Cores } from '@/lib/theme';
import {
  CATEGORIA_LABEL,
  calcularCategoriaPrevia,
  SEXOS,
  SEXO_LABEL,
  type Estilo,
  type Sexo,
  type UsuarioComPerfil,
} from '@/lib/types';

// Igual ao AccountMenuButton: foto de perfil só faz sentido fora da web,
// mas vale pros dois perfis.
const PODE_TROCAR_FOTO = Platform.OS !== 'web';

export function PerfilScreen() {
  const { usuario, token, atualizarUsuarioLocal } = useAuth();
  const { colors } = useTheme();
  const styles = criarEstilos(colors);

  const [perfil, setPerfil] = useState<UsuarioComPerfil | null>(null);
  const [erroCarregar, setErroCarregar] = useState<string | null>(null);
  const [foto, setFoto] = useState<string | null>(null);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState<Sexo | null>(null);

  const [erroPerfil, setErroPerfil] = useState<string | null>(null);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [salvoPerfil, setSalvoPerfil] = useState(false);

  const [provas, setProvas] = useState<{ estilo: Estilo; distancia: string }[]>([]);
  const [erroProvas, setErroProvas] = useState<string | null>(null);
  const [salvandoProvas, setSalvandoProvas] = useState(false);
  const [salvoProvas, setSalvoProvas] = useState(false);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [senhaAlterada, setSenhaAlterada] = useState(false);

  const mostrarFoto = PODE_TROCAR_FOTO && !!usuario;

  // Prévia ao vivo enquanto edita a data de nascimento; cai pro valor salvo
  // (vindo do servidor) assim que a tela carrega, antes de qualquer edição.
  const categoriaExibida = dataNascimento ? calcularCategoriaPrevia(dataNascimento) : (perfil?.atleta?.categoria ?? null);

  const carregar = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.me(token);
      setPerfil(res.usuario);
      setNome(res.usuario.nome);
      setEmail(res.usuario.email);
      if (res.usuario.atleta) {
        setDataNascimento(res.usuario.atleta.dataNascimento.slice(0, 10));
        setSexo(res.usuario.atleta.sexo);
        setProvas(
          res.usuario.atleta.provasPrincipais.map((p) => ({ estilo: p.estilo, distancia: String(p.distancia) })),
        );
      }
      setErroCarregar(null);
    } catch (error) {
      setErroCarregar(error instanceof ApiError ? error.message : 'Não foi possível carregar seu perfil.');
    }
  }, [token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!mostrarFoto || !usuario) return;
    obterFotoPerfil(usuario.id).then(setFoto);
  }, [mostrarFoto, usuario]);

  async function handleEscolherDaGaleria() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      alertar('Permissão necessária', 'Precisamos de acesso às suas fotos para definir a foto de perfil.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (resultado.canceled || !resultado.assets[0] || !usuario) return;
    const uri = await salvarFotoPerfil(usuario.id, resultado.assets[0].uri);
    setFoto(uri);
  }

  async function handleTirarFoto() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      alertar('Permissão necessária', 'Precisamos de acesso à câmera para tirar a foto de perfil.');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.6 });
    if (resultado.canceled || !resultado.assets[0] || !usuario) return;
    const uri = await salvarFotoPerfil(usuario.id, resultado.assets[0].uri);
    setFoto(uri);
  }

  async function handleRemoverFoto() {
    if (!usuario) return;
    await removerFotoPerfil(usuario.id);
    setFoto(null);
  }

  async function handleSalvarPerfil() {
    setErroPerfil(null);
    setSalvoPerfil(false);

    if (!nome.trim() || !email.trim()) {
      setErroPerfil('Preencha nome e e-mail.');
      return;
    }
    if (usuario?.tipo === 'ATLETA' && !dataNascimento.trim()) {
      setErroPerfil('Informe a data de nascimento.');
      return;
    }
    if (usuario?.tipo === 'ATLETA' && !sexo) {
      setErroPerfil('Selecione o sexo.');
      return;
    }

    setSalvandoPerfil(true);
    try {
      const res = await api.atualizarPerfil(token!, {
        nome: nome.trim(),
        email: email.trim(),
        ...(usuario?.tipo === 'ATLETA' ? { dataNascimento, sexo: sexo! } : {}),
      });
      setPerfil(res.usuario);
      await atualizarUsuarioLocal({
        id: res.usuario.id,
        nome: res.usuario.nome,
        email: res.usuario.email,
        tipo: res.usuario.tipo,
        admin: res.usuario.admin,
      });
      setSalvoPerfil(true);
    } catch (error) {
      setErroPerfil(error instanceof ApiError ? error.message : 'Não foi possível salvar as alterações.');
    } finally {
      setSalvandoPerfil(false);
    }
  }

  async function handleSalvarProvas() {
    setErroProvas(null);
    setSalvoProvas(false);

    setSalvandoProvas(true);
    try {
      const res = await api.salvarProvasPrincipais(token!, {
        provas: provas.map((p) => ({ estilo: p.estilo, distancia: Number(p.distancia) })),
      });
      setProvas(res.provas.map((p) => ({ estilo: p.estilo, distancia: String(p.distancia) })));
      setSalvoProvas(true);
    } catch (error) {
      setErroProvas(error instanceof ApiError ? error.message : 'Não foi possível salvar suas provas principais.');
    } finally {
      setSalvandoProvas(false);
    }
  }

  async function handleAlterarSenha() {
    setErroSenha(null);
    setSenhaAlterada(false);

    if (!senhaAtual || !novaSenha) {
      setErroSenha('Preencha a senha atual e a nova senha.');
      return;
    }
    if (novaSenha.length < 6) {
      setErroSenha('Nova senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErroSenha('As senhas não coincidem.');
      return;
    }

    setSalvandoSenha(true);
    try {
      await api.alterarSenha(token!, { senhaAtual, novaSenha });
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setSenhaAlterada(true);
    } catch (error) {
      setErroSenha(error instanceof ApiError ? error.message : 'Não foi possível alterar a senha.');
    } finally {
      setSalvandoSenha(false);
    }
  }

  if (!perfil && !erroCarregar) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (erroCarregar && !perfil) {
    return <EstadoErro mensagem={erroCarregar} aoTentarNovamente={carregar} />;
  }

  return (
    <WebCenteredForm>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
        {mostrarFoto ? (
          <View style={styles.fotoSecao}>
            {foto ? (
              <Image source={{ uri: foto }} style={styles.fotoGrande} />
            ) : (
              <View style={styles.fotoVazia}>
                <Text style={styles.fotoVazioTexto}>{(usuario?.nome ?? '?').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.fotoBotoes}>
              <Pressable style={styles.fotoBotao} onPress={handleTirarFoto}>
                <Text style={styles.fotoBotaoTexto}>Tirar foto</Text>
              </Pressable>
              <Pressable style={styles.fotoBotao} onPress={handleEscolherDaGaleria}>
                <Text style={styles.fotoBotaoTexto}>Escolher da galeria</Text>
              </Pressable>
              {foto ? (
                <Pressable style={styles.fotoBotao} onPress={handleRemoverFoto}>
                  <Text style={[styles.fotoBotaoTexto, styles.fotoBotaoTextoPerigo]}>Remover</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}

        <Text style={styles.secaoTitulo}>Dados pessoais</Text>

        <Text style={styles.label}>Nome</Text>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholderTextColor={colors.placeholder} />

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={colors.placeholder}
        />

        {usuario?.tipo === 'ATLETA' ? (
          <>
            <Text style={styles.label}>Data de nascimento</Text>
            <DateInput value={dataNascimento} onChange={setDataNascimento} />

            {categoriaExibida ? (
              <View style={styles.categoriaBadge}>
                <Text style={styles.categoriaBadgeTexto}>Categoria: {CATEGORIA_LABEL[categoriaExibida]}</Text>
                <Text style={styles.categoriaBadgeNota}>
                  Calculada automaticamente pela data de nascimento — não pode ser alterada diretamente.
                </Text>
              </View>
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
          </>
        ) : null}

        {erroPerfil ? <Text style={styles.erro}>{erroPerfil}</Text> : null}
        {salvoPerfil ? <Text style={styles.sucesso}>Perfil atualizado.</Text> : null}

        <Pressable style={styles.botao} onPress={handleSalvarPerfil} disabled={salvandoPerfil}>
          {salvandoPerfil ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.botaoTexto}>Salvar alterações</Text>
          )}
        </Pressable>

        {usuario?.tipo === 'ATLETA' ? (
          <>
            <Text style={[styles.secaoTitulo, styles.secaoComEspaco]}>Provas principais</Text>
            <Text style={styles.secaoDescricao}>Escolha até 4 provas para destacar no seu perfil.</Text>

            <ProvasPrincipaisEditor
              provas={provas}
              onChange={(p) => {
                setProvas(p);
                setSalvoProvas(false);
              }}
            />

            {erroProvas ? <Text style={styles.erro}>{erroProvas}</Text> : null}
            {salvoProvas ? <Text style={styles.sucesso}>Provas principais atualizadas.</Text> : null}

            <Pressable style={styles.botao} onPress={handleSalvarProvas} disabled={salvandoProvas}>
              {salvandoProvas ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.botaoTexto}>Salvar provas principais</Text>
              )}
            </Pressable>
          </>
        ) : null}

        <Text style={[styles.secaoTitulo, styles.secaoComEspaco]}>Alterar senha</Text>

        <Text style={styles.label}>Senha atual</Text>
        <TextInput
          style={styles.input}
          value={senhaAtual}
          onChangeText={setSenhaAtual}
          secureTextEntry
          placeholderTextColor={colors.placeholder}
        />

        <Text style={styles.label}>Nova senha</Text>
        <TextInput
          style={styles.input}
          value={novaSenha}
          onChangeText={setNovaSenha}
          secureTextEntry
          placeholderTextColor={colors.placeholder}
        />

        <Text style={styles.label}>Confirmar nova senha</Text>
        <TextInput
          style={styles.input}
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
          secureTextEntry
          placeholderTextColor={colors.placeholder}
        />

        {erroSenha ? <Text style={styles.erro}>{erroSenha}</Text> : null}
        {senhaAlterada ? <Text style={styles.sucesso}>Senha alterada.</Text> : null}

        <Pressable style={styles.botao} onPress={handleAlterarSenha} disabled={salvandoSenha}>
          {salvandoSenha ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.botaoTexto}>Alterar senha</Text>
          )}
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
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: c.background,
    },
    container: {
      flexGrow: 1,
      padding: 24,
      paddingBottom: 60,
      gap: 10,
      backgroundColor: c.background,
    },
    fotoSecao: {
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    fotoGrande: {
      width: 96,
      height: 96,
      borderRadius: 48,
    },
    fotoVazia: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fotoVazioTexto: {
      fontSize: 36,
      fontWeight: '700',
      color: c.primary,
    },
    fotoBotoes: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'center',
    },
    fotoBotao: {
      borderWidth: 1,
      borderColor: c.borderInput,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    fotoBotaoTexto: {
      fontSize: 13,
      fontWeight: '600',
      color: c.primary,
    },
    fotoBotaoTextoPerigo: {
      color: c.danger,
    },
    secaoTitulo: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
    },
    secaoComEspaco: {
      marginTop: 20,
    },
    secaoDescricao: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: -4,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textMuted,
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
    categoriaBadge: {
      backgroundColor: c.primarySoft,
      borderRadius: 8,
      padding: 12,
      gap: 2,
    },
    categoriaBadgeTexto: {
      fontSize: 14,
      fontWeight: '700',
      color: c.primary,
    },
    categoriaBadgeNota: {
      fontSize: 12,
      color: c.textMuted,
    },
    segmentedControl: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: 8,
      overflow: 'hidden',
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
      marginTop: 4,
    },
    sucesso: {
      color: c.success,
      fontSize: 14,
      marginTop: 4,
    },
  });
}
