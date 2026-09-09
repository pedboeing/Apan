import { Categoria } from '../generated/prisma/enums';
import { prisma } from '../prisma';

// Tabela de categoria por idade da CBDA. A "idade" usada é a que o atleta
// completa NO ANO de referência (ano de referência − ano de nascimento) —
// não a idade exata contando o dia do aniversário. Por isso a categoria
// muda quando o ano vira (1º de janeiro), não no aniversário do atleta.
// Faixas em ordem crescente; a idade mínima cobre "e daí pra cima" até a
// próxima faixa.
const FAIXAS_POR_IDADE: { idadeMinima: number; categoria: Categoria }[] = [
  { idadeMinima: 0, categoria: Categoria.PRE_MIRIM }, // cobre também <7 (não há faixa mais nova)
  { idadeMinima: 9, categoria: Categoria.MIRIM_1 },
  { idadeMinima: 10, categoria: Categoria.MIRIM_2 },
  { idadeMinima: 11, categoria: Categoria.PETIZ_1 },
  { idadeMinima: 12, categoria: Categoria.PETIZ_2 },
  { idadeMinima: 13, categoria: Categoria.INFANTIL_1 },
  { idadeMinima: 14, categoria: Categoria.INFANTIL_2 },
  { idadeMinima: 15, categoria: Categoria.JUVENIL_1 },
  { idadeMinima: 16, categoria: Categoria.JUVENIL_2 },
  { idadeMinima: 17, categoria: Categoria.JUNIOR_1 },
  { idadeMinima: 18, categoria: Categoria.JUNIOR_2 }, // cobre 18 e 19
  { idadeMinima: 20, categoria: Categoria.SENIOR },
];

export function calcularCategoria(dataNascimento: Date, anoReferencia = new Date().getUTCFullYear()): Categoria {
  const idadeNoAno = anoReferencia - dataNascimento.getUTCFullYear();

  let categoria = FAIXAS_POR_IDADE[0].categoria;
  for (const faixa of FAIXAS_POR_IDADE) {
    if (idadeNoAno >= faixa.idadeMinima) {
      categoria = faixa.categoria;
    }
  }
  return categoria;
}

// A categoria muda quando o ano vira, não no aniversário — então um valor
// salvo em dezembro fica desatualizado em janeiro até alguém olhar de novo.
// Chamada nos pontos de leitura de atleta (não em background), corrige o
// registro na hora se detectar que a virada de ano já aconteceu.
export async function garantirCategoriaAtualizada<T extends { id: string; categoria: Categoria; dataNascimento: Date }>(
  atleta: T,
): Promise<T> {
  const categoriaAtual = calcularCategoria(atleta.dataNascimento);
  if (categoriaAtual === atleta.categoria) {
    return atleta;
  }
  await prisma.atleta.update({ where: { id: atleta.id }, data: { categoria: categoriaAtual } });
  return { ...atleta, categoria: categoriaAtual };
}
