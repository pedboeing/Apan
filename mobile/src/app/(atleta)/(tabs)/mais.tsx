import { router } from 'expo-router';

import { MenuMais } from '@/components/menu-mais';

export default function MaisScreen() {
  return (
    <MenuMais
      itens={[
        {
          label: 'Referência',
          descricao: 'Zonas de treinamento baseadas nas suas provas principais',
          onPress: () => router.push('/referencia'),
        },
        {
          label: 'Recordes',
          descricao: 'Recordes da APAN por prova e categoria',
          onPress: () => router.push('/recordes'),
        },
        {
          label: 'Educativos',
          descricao: 'Biblioteca de educativos por estilo',
          onPress: () => router.push('/educativos'),
        },
        {
          label: 'Competições',
          descricao: 'Meus melhores tempos e histórico completo',
          onPress: () => {},
          bloqueado: true,
        },
        {
          label: 'Melhores marcas',
          descricao: 'Meus melhores tempos por prova',
          onPress: () => router.push('/marcas'),
        },
      ]}
    />
  );
}
