import { router } from 'expo-router';

import { EducativoForm } from '@/components/educativo-form';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { alertar } from '@/lib/alerta';

export default function SugerirEducativoScreen() {
  const { token } = useAuth();

  return (
    <EducativoForm
      submitLabel="Enviar sugestão"
      onSubmit={async (dados) => {
        await api.sugerirEducativo(token!, dados);
        alertar('Sugestão enviada', 'Seu educativo foi enviado para avaliação do técnico.');
        router.back();
      }}
    />
  );
}
