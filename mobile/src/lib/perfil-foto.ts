import { Directory, File, Paths } from 'expo-file-system';

import { secureStorage } from './storage';

// Foto de perfil é só local: fica salva no dispositivo, uma por usuário (pra
// dar pra trocar de conta no mesmo aparelho sem misturar fotos). Guardamos o
// arquivo em si na pasta de documentos do app e só a URI no SecureStore.
const PASTA_FOTOS = 'perfil-fotos';

function chaveFoto(usuarioId: string): string {
  return `apan.foto.${usuarioId}`;
}

function pastaFotos(): Directory {
  const dir = new Directory(Paths.document, PASTA_FOTOS);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
}

export async function salvarFotoPerfil(usuarioId: string, uriOrigem: string): Promise<string> {
  const destino = new File(pastaFotos(), `${usuarioId}.jpg`);
  if (destino.exists) {
    destino.delete();
  }

  const origem = new File(uriOrigem);
  origem.copy(destino);

  await secureStorage.setItem(chaveFoto(usuarioId), destino.uri);
  return destino.uri;
}

export async function obterFotoPerfil(usuarioId: string): Promise<string | null> {
  const uri = await secureStorage.getItem(chaveFoto(usuarioId));
  if (!uri) return null;
  if (!new File(uri).exists) return null;
  return uri;
}

export async function removerFotoPerfil(usuarioId: string): Promise<void> {
  const uri = await secureStorage.getItem(chaveFoto(usuarioId));
  if (uri) {
    try {
      const arquivo = new File(uri);
      if (arquivo.exists) arquivo.delete();
    } catch {
      // arquivo já pode não existir — sem problema, seguimos removendo a referência
    }
  }
  await secureStorage.removeItem(chaveFoto(usuarioId));
}
