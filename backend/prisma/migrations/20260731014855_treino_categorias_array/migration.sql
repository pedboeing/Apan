-- Treino agora aceita mais de um grupo/categoria por sessão.
-- Adiciona a coluna nova como array, migra os dados existentes de
-- "categoria" (escalar) para "categorias" (array com um item), e então
-- remove a coluna antiga e seu índice.

-- AlterTable: add categorias array column (nullable at first, to backfill)
ALTER TABLE "treinos" ADD COLUMN "categorias" "Categoria"[];

-- Backfill: cada treino existente passa a ter um array com sua categoria única
UPDATE "treinos" SET "categorias" = ARRAY["categoria"]::"Categoria"[];

-- Agora que todo mundo tem valor, torna a coluna obrigatória
ALTER TABLE "treinos" ALTER COLUMN "categorias" SET NOT NULL;

-- DropIndex
DROP INDEX "treinos_categoria_data_idx";

-- AlterTable: remove a coluna antiga
ALTER TABLE "treinos" DROP COLUMN "categoria";

-- CreateIndex
CREATE INDEX "treinos_data_idx" ON "treinos"("data");
