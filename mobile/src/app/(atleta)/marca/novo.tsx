import { router } from 'expo-router';

import { MelhorMarcaForm } from '@/components/melhor-marca-form';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';

export default function NovaMarcaScreen() {
  const { token } = useAuth();

  return (
    <MelhorMarcaForm
      submitLabel="Salvar marca"
      onSubmit={async (dados) => {
        await api.criarMelhorMarca(token!, dados);
        router.back();
      }}
    />
  );
}
