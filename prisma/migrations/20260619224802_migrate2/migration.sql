/*
  Warnings:

  - Added the required column `anio` to the `Unidad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `marca` to the `Unidad` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Unidad" ADD COLUMN     "anio" INTEGER NOT NULL,
ADD COLUMN     "marca" TEXT NOT NULL;
