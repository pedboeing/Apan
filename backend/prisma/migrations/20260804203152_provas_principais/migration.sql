-- CreateTable
CREATE TABLE "provas_principais" (
    "id" TEXT NOT NULL,
    "atletaId" TEXT NOT NULL,
    "estilo" "EstiloNado" NOT NULL,
    "distancia" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provas_principais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "provas_principais_atletaId_ordem_key" ON "provas_principais"("atletaId", "ordem");

-- AddForeignKey
ALTER TABLE "provas_principais" ADD CONSTRAINT "provas_principais_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "atletas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
