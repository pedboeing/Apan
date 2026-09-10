import { router } from 'expo-router';

import { RecordeForm } from '@/components/recorde-form';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';

export default function NovoRecordeScreen() {
  const { token } = useAuth();

  return (
    <RecordeForm
      submitLabel="Criar recorde"
      onSubmit={async (dados) => {
        await api.criarRecorde(token!, dados);
        router.back();
      }}
    />
  );
}
