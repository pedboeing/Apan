import { router } from 'expo-router';

import { EducativoForm } from '@/components/educativo-form';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';

export default function NovoEducativoScreen() {
  const { token } = useAuth();

  return (
    <EducativoForm
      submitLabel="Publicar educativo"
      onSubmit={async (dados) => {
        await api.criarEducativo(token!, dados);
        router.back();
      }}
    />
  );
}
