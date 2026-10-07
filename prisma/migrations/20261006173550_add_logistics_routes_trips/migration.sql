-- CreateEnum
CREATE TYPE "EstadoViaje" AS ENUM ('PLANIFICADO', 'EN_RUTA', 'CERRADO');

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "cantidadUnidades" INTEGER,
ADD COLUMN     "destinatarioDireccion" TEXT,
ADD COLUMN     "destinatarioNombre" TEXT,
ADD COLUMN     "destinatarioTelefono" TEXT,
ADD COLUMN     "pesoKg" DOUBLE PRECISION,
ADD COLUMN     "viajeId" INTEGER;

-- CreateTable
CREATE TABLE "Ruta" (
    "id" SERIAL NOT NULL,
    "origenId" INTEGER NOT NULL,
    "destinoId" INTEGER NOT NULL,
    "distanciaKm" DOUBLE PRECISION NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ruta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Viaje" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "unidadId" INTEGER NOT NULL,
    "conductor" TEXT,
    "estado" "EstadoViaje" NOT NULL DEFAULT 'PLANIFICADO',
    "fechaInicio" TIMESTAMP(3),
    "fechaCierre" TIMESTAMP(3),
    "distanciaTotal" DOUBLE PRECISION,
    "factorEmisionAplicado" DOUBLE PRECISION,
    "co2Total" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Viaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViajeTramo" (
    "id" SERIAL NOT NULL,
    "viajeId" INTEGER NOT NULL,
    "orden" INTEGER NOT NULL,
    "origenId" INTEGER NOT NULL,
    "destinoId" INTEGER NOT NULL,
    "distanciaKm" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ViajeTramo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ruta_origenId_destinoId_key" ON "Ruta"("origenId", "destinoId");

-- CreateIndex
CREATE UNIQUE INDEX "Viaje_codigo_key" ON "Viaje"("codigo");

-- CreateIndex
CREATE INDEX "Viaje_unidadId_idx" ON "Viaje"("unidadId");

-- CreateIndex
CREATE INDEX "ViajeTramo_viajeId_idx" ON "ViajeTramo"("viajeId");

-- CreateIndex
CREATE UNIQUE INDEX "ViajeTramo_viajeId_orden_key" ON "ViajeTramo"("viajeId", "orden");

-- CreateIndex
CREATE INDEX "Pedido_viajeId_idx" ON "Pedido"("viajeId");

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_viajeId_fkey" FOREIGN KEY ("viajeId") REFERENCES "Viaje"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ruta" ADD CONSTRAINT "Ruta_origenId_fkey" FOREIGN KEY ("origenId") REFERENCES "Parametro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ruta" ADD CONSTRAINT "Ruta_destinoId_fkey" FOREIGN KEY ("destinoId") REFERENCES "Parametro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Viaje" ADD CONSTRAINT "Viaje_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "Unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViajeTramo" ADD CONSTRAINT "ViajeTramo_viajeId_fkey" FOREIGN KEY ("viajeId") REFERENCES "Viaje"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViajeTramo" ADD CONSTRAINT "ViajeTramo_origenId_fkey" FOREIGN KEY ("origenId") REFERENCES "Parametro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViajeTramo" ADD CONSTRAINT "ViajeTramo_destinoId_fkey" FOREIGN KEY ("destinoId") REFERENCES "Parametro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
