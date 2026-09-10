import { router } from 'expo-router';

import { TreinoForm } from '@/components/treino-form';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { alertar } from '@/lib/alerta';

export default function NovoTreinoScreen() {
  const { token } = useAuth();

  return (
    <TreinoForm
      submitLabel="Criar treino"
      onSubmit={async (dados) => {
        await api.criarTreino(token!, dados);
        alertar('Treino criado com sucesso!', 'O treino já está disponível para os atletas do grupo selecionado.');
        router.back();
      }}
    />
  );
}
