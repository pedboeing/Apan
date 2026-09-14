import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import { api, ApiError, definirTratamentoDeSessaoExpirada } from '@/lib/api';
import { secureStorage } from '@/lib/storage';
import type { CadastroInput, Usuario } from '@/lib/types';

type AuthContextValue = {
  usuario: Usuario | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  // Retorna o token recém-criado — quem chama pode precisar dele na hora
  // (ex: cadastro.tsx salvando provas principais logo depois de criar a
  // conta), sem esperar o próximo render pra ler de useAuth().token.
  cadastrar: (dados: CadastroInput) => Promise<{ token: string; usuario: Usuario }>;
  logout: () => Promise<void>;
  atualizarUsuarioLocal: (usuario: Usuario) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'apan.token';
const USUARIO_KEY = 'apan.usuario';

// Usado pela tela de carregamento inicial pra saber, antes mesmo do
// AuthProvider terminar de restaurar a sessão, qual usuário (e portanto qual
// foto de perfil) mostrar na splash personalizada.
export async function lerUsuarioSalvo(): Promise<Usuario | null> {
  const salvo = await secureStorage.getItem(USUARIO_KEY);
  return salvo ? (JSON.parse(salvo) as Usuario) : null;
}

export function useAuth() {
  const value = use(AuthContext);
  if (!value) {
    throw new Error('useAuth precisa estar dentro de <AuthProvider />');
  }
  return value;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Qualquer 401 vindo de requisição autenticada cai aqui: derruba a
  // sessão morta e o <Stack.Protected> do layout raiz leva pro login
  // sozinho, em vez de deixar a pessoa presa numa tela de erro.
  useEffect(() => {
    definirTratamentoDeSessaoExpirada(() => {
      void logout();
    });
    return () => definirTratamentoDeSessaoExpirada(null);
  }, []);

  // Sessão persistida: ao abrir o app, restaura token + usuário salvos
  // localmente, sem precisar logar de novo.
  useEffect(() => {
    (async () => {
      const [storedToken, storedUsuario] = await Promise.all([
        secureStorage.getItem(TOKEN_KEY),
        secureStorage.getItem(USUARIO_KEY),
      ]);

      if (!storedToken || !storedUsuario) {
        setIsLoading(false);
        return;
      }

      // Confere o token com o servidor antes de entrar. Restaurar às cegas
      // fazia o app abrir "logado" com token vencido e só então quebrar tela
      // por tela. Aqui a checagem acontece ainda sob a TelaCarregamento:
      // token válido entra direto, token vencido vai pro login sem erro
      // nenhum aparecer.
      try {
        const { usuario: atual, token: renovado } = await api.me(storedToken);
        // Sessão rolante: se o backend mandou token novo, ele passa a ser o
        // válido — é o que evita o logout em massa quando o prazo vence.
        const tokenEmUso = renovado ?? storedToken;
        setToken(tokenEmUso);
        if (renovado) {
          await secureStorage.setItem(TOKEN_KEY, renovado);
        }
        // Guarda só os campos de Usuario: o /auth/me devolve o perfil
        // inteiro junto, e o SecureStore tem limite de tamanho por chave.
        const basico: Usuario = {
          id: atual.id,
          nome: atual.nome,
          email: atual.email,
          tipo: atual.tipo,
          admin: atual.admin,
        };
        setUsuario(basico);
        await secureStorage.setItem(USUARIO_KEY, JSON.stringify(basico));
      } catch (erro) {
        if (erro instanceof ApiError && erro.status === 401) {
          // Recusa explícita do servidor: sessão acabou mesmo, limpa.
          await Promise.all([secureStorage.removeItem(TOKEN_KEY), secureStorage.removeItem(USUARIO_KEY)]);
        } else {
          // Sem internet ou servidor fora do ar não é sessão inválida —
          // deslogar aqui puniria quem abriu o app no vestiário sem sinal.
          // Segue com o que está salvo; a próxima chamada revalida.
          setToken(storedToken);
          setUsuario(JSON.parse(storedUsuario) as Usuario);
        }
      }

      setIsLoading(false);
    })();
  }, []);

  async function persistSession(novoToken: string, novoUsuario: Usuario) {
    setToken(novoToken);
    setUsuario(novoUsuario);
    await Promise.all([
      secureStorage.setItem(TOKEN_KEY, novoToken),
      secureStorage.setItem(USUARIO_KEY, JSON.stringify(novoUsuario)),
    ]);
  }

  async function login(email: string, senha: string) {
    const data = await api.login(email, senha);
    await persistSession(data.token, data.usuario);
  }

  async function cadastrar(dados: CadastroInput) {
    const data = await api.cadastro(dados);
    await persistSession(data.token, data.usuario);
    return data;
  }

  async function logout() {
    setToken(null);
    setUsuario(null);
    await Promise.all([secureStorage.removeItem(TOKEN_KEY), secureStorage.removeItem(USUARIO_KEY)]);
  }

  // Usado depois de editar o perfil: atualiza nome/e-mail já refletidos no
  // menu/cabeçalho sem precisar logar de novo.
  async function atualizarUsuarioLocal(novoUsuario: Usuario) {
    setUsuario(novoUsuario);
    await secureStorage.setItem(USUARIO_KEY, JSON.stringify(novoUsuario));
  }

  return (
    <AuthContext.Provider
      value={{ usuario, token, isLoading, login, cadastrar, logout, atualizarUsuarioLocal }}
    >
      {children}
    </AuthContext.Provider>
  );
}
