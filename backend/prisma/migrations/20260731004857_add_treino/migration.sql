-- CreateEnum
CREATE TYPE "FaseCiclo" AS ENUM ('BASE', 'FORCA', 'POTENCIA', 'POLIMENTO');

-- CreateTable
CREATE TABLE "treinos" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "categoria" "Categoria" NOT NULL,
    "objetivoSemana" TEXT NOT NULL,
    "faseCiclo" "FaseCiclo" NOT NULL,
    "pseEsperada" INTEGER,
    "aquecimento" TEXT NOT NULL DEFAULT '',
    "aquecimentoCronometrado" BOOLEAN NOT NULL DEFAULT false,
    "seriePreparatoria" TEXT NOT NULL DEFAULT '',
    "seriePreparatoriaCronometrada" BOOLEAN NOT NULL DEFAULT false,
    "seriePrincipal" TEXT NOT NULL DEFAULT '',
    "seriePrincipalCronometrada" BOOLEAN NOT NULL DEFAULT false,
    "soltura" TEXT NOT NULL DEFAULT '',
    "solturaCronometrada" BOOLEAN NOT NULL DEFAULT false,
    "tecnicoId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treinos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "treinos_categoria_data_idx" ON "treinos"("categoria", "data");

-- AddForeignKey
ALTER TABLE "treinos" ADD CONSTRAINT "treinos_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "tecnicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
