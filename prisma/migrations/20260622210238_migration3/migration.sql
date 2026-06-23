-- AlterTable
ALTER TABLE "Incidencia" ALTER COLUMN "ubicacion" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "impactoCo2" DOUBLE PRECISION,
ADD COLUMN     "margenNeto" DOUBLE PRECISION,
ADD COLUMN     "rentabilidad" DOUBLE PRECISION;
