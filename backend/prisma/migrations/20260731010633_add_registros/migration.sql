-- CreateEnum
CREATE TYPE "BlocoTreino" AS ENUM ('AQUECIMENTO', 'SERIE_PREPARATORIA', 'SERIE_PRINCIPAL', 'SOLTURA');

-- CreateEnum
CREATE TYPE "QualidadeSono" AS ENUM ('RUIM', 'REGULAR', 'BOM', 'OTIMO');

-- CreateTable
CREATE TABLE "registros_tempo" (
    "id" TEXT NOT NULL,
    "atletaId" TEXT NOT NULL,
    "treinoId" TEXT NOT NULL,
    "bloco" "BlocoTreino" NOT NULL,
    "distancia" INTEGER NOT NULL,
    "tempoCentesimos" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_tempo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_pse" (
    "id" TEXT NOT NULL,
    "atletaId" TEXT NOT NULL,
    "treinoId" TEXT NOT NULL,
    "pse" INTEGER NOT NULL,
    "qualidadeSono" "QualidadeSono",
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_pse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registros_tempo_atletaId_treinoId_idx" ON "registros_tempo"("atletaId", "treinoId");

-- CreateIndex
CREATE UNIQUE INDEX "registros_pse_atletaId_treinoId_key" ON "registros_pse"("atletaId", "treinoId");

-- AddForeignKey
ALTER TABLE "registros_tempo" ADD CONSTRAINT "registros_tempo_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "atletas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_tempo" ADD CONSTRAINT "registros_tempo_treinoId_fkey" FOREIGN KEY ("treinoId") REFERENCES "treinos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_pse" ADD CONSTRAINT "registros_pse_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "atletas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_pse" ADD CONSTRAINT "registros_pse_treinoId_fkey" FOREIGN KEY ("treinoId") REFERENCES "treinos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
