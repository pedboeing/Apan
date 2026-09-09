-- Cada bloco do treino (aquecimento, série preparatória, série principal,
-- soltura) passa de um texto único para uma lista de séries (String[]),
-- permitindo o técnico adicionar mais de uma série dentro do mesmo bloco.
-- Os dados existentes são preservados como um array de um item (ou vazio).

ALTER TABLE "treinos" ADD COLUMN "aquecimento_new" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "treinos" ADD COLUMN "seriePreparatoria_new" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "treinos" ADD COLUMN "seriePrincipal_new" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "treinos" ADD COLUMN "soltura_new" TEXT[] NOT NULL DEFAULT '{}';

UPDATE "treinos" SET
  "aquecimento_new" = CASE WHEN "aquecimento" = '' THEN '{}'::TEXT[] ELSE ARRAY["aquecimento"] END,
  "seriePreparatoria_new" = CASE WHEN "seriePreparatoria" = '' THEN '{}'::TEXT[] ELSE ARRAY["seriePreparatoria"] END,
  "seriePrincipal_new" = CASE WHEN "seriePrincipal" = '' THEN '{}'::TEXT[] ELSE ARRAY["seriePrincipal"] END,
  "soltura_new" = CASE WHEN "soltura" = '' THEN '{}'::TEXT[] ELSE ARRAY["soltura"] END;

ALTER TABLE "treinos" DROP COLUMN "aquecimento";
ALTER TABLE "treinos" DROP COLUMN "seriePreparatoria";
ALTER TABLE "treinos" DROP COLUMN "seriePrincipal";
ALTER TABLE "treinos" DROP COLUMN "soltura";

ALTER TABLE "treinos" RENAME COLUMN "aquecimento_new" TO "aquecimento";
ALTER TABLE "treinos" RENAME COLUMN "seriePreparatoria_new" TO "seriePreparatoria";
ALTER TABLE "treinos" RENAME COLUMN "seriePrincipal_new" TO "seriePrincipal";
ALTER TABLE "treinos" RENAME COLUMN "soltura_new" TO "soltura";
