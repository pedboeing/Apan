-- CreateEnum
CREATE TYPE "EstiloNado" AS ENUM ('LIVRE', 'COSTAS', 'PEITO', 'BORBOLETA', 'MEDLEY');

-- AlterTable
ALTER TABLE "registros_tempo" ADD COLUMN     "estilo" "EstiloNado";

-- CreateTable
CREATE TABLE "recordes_internos" (
    "id" TEXT NOT NULL,
    "estilo" "EstiloNado" NOT NULL,
    "distancia" INTEGER NOT NULL,
    "categoria" "Categoria" NOT NULL,
    "tempoCentesimos" INTEGER NOT NULL,
    "nomeAtleta" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recordes_internos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recordes_internos_estilo_distancia_categoria_idx" ON "recordes_internos"("estilo", "distancia", "categoria");
