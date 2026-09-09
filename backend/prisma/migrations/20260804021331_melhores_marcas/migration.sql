-- CreateTable
CREATE TABLE "melhores_marcas" (
    "id" TEXT NOT NULL,
    "atletaId" TEXT NOT NULL,
    "estilo" "EstiloNado" NOT NULL,
    "distancia" INTEGER NOT NULL,
    "piscina" "TamanhoPiscina" NOT NULL,
    "tempoCentesimos" INTEGER NOT NULL,
    "data" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "melhores_marcas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "melhores_marcas_atletaId_estilo_distancia_piscina_key" ON "melhores_marcas"("atletaId", "estilo", "distancia", "piscina");

-- AddForeignKey
ALTER TABLE "melhores_marcas" ADD CONSTRAINT "melhores_marcas_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "atletas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
