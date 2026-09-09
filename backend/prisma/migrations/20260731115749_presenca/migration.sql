-- CreateEnum
CREATE TYPE "OrigemPresenca" AS ENUM ('AUTOMATICA', 'MANUAL');

-- CreateTable
CREATE TABLE "presencas" (
    "id" TEXT NOT NULL,
    "atletaId" TEXT NOT NULL,
    "treinoId" TEXT NOT NULL,
    "presente" BOOLEAN NOT NULL DEFAULT true,
    "origem" "OrigemPresenca" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presencas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "presencas_atletaId_treinoId_key" ON "presencas"("atletaId", "treinoId");

-- AddForeignKey
ALTER TABLE "presencas" ADD CONSTRAINT "presencas_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "atletas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presencas" ADD CONSTRAINT "presencas_treinoId_fkey" FOREIGN KEY ("treinoId") REFERENCES "treinos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
