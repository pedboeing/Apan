import { router } from 'expo-router';

import { ResultadoCompeticaoForm } from '@/components/resultado-competicao-form';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';

export default function NovoResultadoCompeticaoScreen() {
  const { token } = useAuth();

  return (
    <ResultadoCompeticaoForm
      submitLabel="Salvar resultado"
      onSubmit={async (dados) => {
        await api.criarResultadoCompeticao(token!, dados);
        router.back();
      }}
    />
  );
}
