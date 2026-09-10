import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import { api } from '@/lib/api';
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

  // Sessão persistida: ao abrir o app, restaura token + usuário salvos
  // localmente, sem precisar logar de novo.
  useEffect(() => {
    (async () => {
      const [storedToken, storedUsuario] = await Promise.all([
        secureStorage.getItem(TOKEN_KEY),
        secureStorage.getItem(USUARIO_KEY),
      ]);
      if (storedToken && storedUsuario) {
        setToken(storedToken);
        setUsuario(JSON.parse(storedUsuario) as Usuario);
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
