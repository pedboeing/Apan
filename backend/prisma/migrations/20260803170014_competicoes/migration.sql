-- CreateEnum
CREATE TYPE "Medalha" AS ENUM ('OURO', 'PRATA', 'BRONZE');

-- CreateEnum
CREATE TYPE "OrigemResultado" AS ENUM ('MANUAL', 'API');

-- CreateTable
CREATE TABLE "competicoes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "local" TEXT NOT NULL,
    "externoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resultados_competicao" (
    "id" TEXT NOT NULL,
    "atletaId" TEXT NOT NULL,
    "competicaoId" TEXT NOT NULL,
    "estilo" "EstiloNado" NOT NULL,
    "distancia" INTEGER NOT NULL,
    "tempoCentesimos" INTEGER NOT NULL,
    "colocacao" INTEGER,
    "medalha" "Medalha",
    "origem" "OrigemResultado" NOT NULL DEFAULT 'MANUAL',
    "externoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resultados_competicao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "competicoes_externoId_key" ON "competicoes"("externoId");

-- CreateIndex
CREATE INDEX "competicoes_data_idx" ON "competicoes"("data");

-- CreateIndex
CREATE UNIQUE INDEX "resultados_competicao_externoId_key" ON "resultados_competicao"("externoId");

-- CreateIndex
CREATE INDEX "resultados_competicao_atletaId_estilo_distancia_idx" ON "resultados_competicao"("atletaId", "estilo", "distancia");

-- AddForeignKey
ALTER TABLE "resultados_competicao" ADD CONSTRAINT "resultados_competicao_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "atletas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resultados_competicao" ADD CONSTRAINT "resultados_competicao_competicaoId_fkey" FOREIGN KEY ("competicaoId") REFERENCES "competicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
