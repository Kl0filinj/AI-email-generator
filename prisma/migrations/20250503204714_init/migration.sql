/*
  Warnings:

  - The primary key for the `file` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[storedId]` on the table `file` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `file` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "file" DROP CONSTRAINT "file_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "file_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "file_storedId_key" ON "file"("storedId");
