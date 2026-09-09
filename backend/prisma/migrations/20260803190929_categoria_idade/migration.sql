-- Troca a tabela de categorias de 6 faixas amplas para as 12 faixas por
-- idade da CBDA usadas pela APAN. A idade é sempre "ano de referência (hoje)
-- menos ano de nascimento" — a mesma regra usada pelo backend em
-- src/lib/categoria.ts, pra manter migração e aplicação em sincronia.

ALTER TYPE "Categoria" RENAME TO "Categoria_old";

CREATE TYPE "Categoria" AS ENUM (
  'PRE_MIRIM',
  'MIRIM_1',
  'MIRIM_2',
  'PETIZ_1',
  'PETIZ_2',
  'INFANTIL_1',
  'INFANTIL_2',
  'JUVENIL_1',
  'JUVENIL_2',
  'JUNIOR_1',
  'JUNIOR_2',
  'SENIOR'
);

-- atletas.categoria: recalculada a partir da data de nascimento de verdade
-- (é a única tabela que tem essa informação) em vez de mapear o valor antigo.
ALTER TABLE "atletas" ALTER COLUMN "categoria" TYPE "Categoria" USING (
  (CASE
    WHEN (EXTRACT(YEAR FROM now()) - EXTRACT(YEAR FROM "dataNascimento")) >= 20 THEN 'SENIOR'
    WHEN (EXTRACT(YEAR FROM now()) - EXTRACT(YEAR FROM "dataNascimento")) >= 18 THEN 'JUNIOR_2'
    WHEN (EXTRACT(YEAR FROM now()) - EXTRACT(YEAR FROM "dataNascimento")) >= 17 THEN 'JUNIOR_1'
    WHEN (EXTRACT(YEAR FROM now()) - EXTRACT(YEAR FROM "dataNascimento")) >= 16 THEN 'JUVENIL_2'
    WHEN (EXTRACT(YEAR FROM now()) - EXTRACT(YEAR FROM "dataNascimento")) >= 15 THEN 'JUVENIL_1'
    WHEN (EXTRACT(YEAR FROM now()) - EXTRACT(YEAR FROM "dataNascimento")) >= 14 THEN 'INFANTIL_2'
    WHEN (EXTRACT(YEAR FROM now()) - EXTRACT(YEAR FROM "dataNascimento")) >= 13 THEN 'INFANTIL_1'
    WHEN (EXTRACT(YEAR FROM now()) - EXTRACT(YEAR FROM "dataNascimento")) >= 12 THEN 'PETIZ_2'
    WHEN (EXTRACT(YEAR FROM now()) - EXTRACT(YEAR FROM "dataNascimento")) >= 11 THEN 'PETIZ_1'
    WHEN (EXTRACT(YEAR FROM now()) - EXTRACT(YEAR FROM "dataNascimento")) >= 10 THEN 'MIRIM_2'
    WHEN (EXTRACT(YEAR FROM now()) - EXTRACT(YEAR FROM "dataNascimento")) >= 9 THEN 'MIRIM_1'
    ELSE 'PRE_MIRIM'
  END)::"Categoria"
);

-- treinos.categorias e recordes_internos.categoria não têm data de
-- nascimento associada (são grupos escolhidos manualmente pelo técnico) —
-- mapeadas pro equivalente "I" mais próximo como ponto de partida; o
-- técnico pode reajustar cada uma depois se quiser mais precisão.
-- Postgres não aceita subconsulta numa expressão USING de ALTER COLUMN,
-- então o remapeamento do array é feito com array_replace encadeado em vez
-- de unnest + SELECT (SENIOR não precisa de replace: o nome é igual nos
-- dois enums).
ALTER TABLE "treinos" ALTER COLUMN "categorias" TYPE "Categoria"[] USING (
  array_replace(
    array_replace(
      array_replace(
        array_replace(
          array_replace(
            "categorias"::text[],
            'PETIZ', 'PETIZ_1'
          ),
          'MIRIM', 'MIRIM_1'
        ),
        'INFANTIL', 'INFANTIL_1'
      ),
      'JUVENIL', 'JUVENIL_1'
    ),
    'JUNIOR', 'JUNIOR_1'
  )::"Categoria"[]
);

ALTER TABLE "recordes_internos" ALTER COLUMN "categoria" TYPE "Categoria" USING (
  (CASE "categoria"::text
    WHEN 'PETIZ' THEN 'PETIZ_1'
    WHEN 'MIRIM' THEN 'MIRIM_1'
    WHEN 'INFANTIL' THEN 'INFANTIL_1'
    WHEN 'JUVENIL' THEN 'JUVENIL_1'
    WHEN 'JUNIOR' THEN 'JUNIOR_1'
    WHEN 'SENIOR' THEN 'SENIOR'
    ELSE 'PRE_MIRIM'
  END)::"Categoria"
);

DROP TYPE "Categoria_old";
