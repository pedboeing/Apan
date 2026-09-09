-- CreateEnum
CREATE TYPE "StatusEducativo" AS ENUM ('PENDENTE', 'PUBLICADO', 'REJEITADO');

-- CreateTable
CREATE TABLE "educativos" (
    "id" TEXT NOT NULL,
    "estilo" "EstiloNado" NOT NULL,
    "nome" TEXT NOT NULL,
    "descricaoObjetivo" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "status" "StatusEducativo" NOT NULL DEFAULT 'PENDENTE',
    "autorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "educativos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "educativos_estilo_status_idx" ON "educativos"("estilo", "status");

-- AddForeignKey
ALTER TABLE "educativos" ADD CONSTRAINT "educativos_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
