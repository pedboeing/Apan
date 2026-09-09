-- Sexo (atleta, opcional pra não quebrar contas já existentes — exigido a
-- partir de agora no cadastro/edição de perfil) e sexo + tamanho de piscina
-- em recordes internos (obrigatórios: tabela ainda vazia nesse momento, e
-- um tempo de 25m não é comparável com um de 50m).

CREATE TYPE "Sexo" AS ENUM ('MASCULINO', 'FEMININO');
CREATE TYPE "TamanhoPiscina" AS ENUM ('M25', 'M50');

ALTER TABLE "atletas" ADD COLUMN "sexo" "Sexo";

ALTER TABLE "recordes_internos" ADD COLUMN "sexo" "Sexo" NOT NULL,
                                 ADD COLUMN "piscina" "TamanhoPiscina" NOT NULL;

DROP INDEX IF EXISTS "recordes_internos_estilo_distancia_categoria_idx";
CREATE INDEX "recordes_internos_estilo_distancia_categoria_sexo_piscina_idx"
  ON "recordes_internos" ("estilo", "distancia", "categoria", "sexo", "piscina");
