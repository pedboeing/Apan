-- DropForeignKey
ALTER TABLE "treinos" DROP CONSTRAINT "treinos_tecnicoId_fkey";

-- AddForeignKey
ALTER TABLE "treinos" ADD CONSTRAINT "treinos_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "tecnicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
