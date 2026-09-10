import { router } from 'expo-router';

import { MenuMais } from '@/components/menu-mais';

export default function MaisScreen() {
  return (
    <MenuMais
      itens={[
        {
          label: 'Frequência',
          descricao: 'Presença dos atletas por grupo e período',
          onPress: () => router.push('/frequencia'),
        },
        {
          label: 'Recordes',
          descricao: 'Recordes da APAN — gerenciar e importar',
          onPress: () => router.push('/recordes'),
        },
        {
          label: 'Educativos',
          descricao: 'Biblioteca e fila de aprovação',
          onPress: () => router.push('/educativos'),
        },
      ]}
    />
  );
}
