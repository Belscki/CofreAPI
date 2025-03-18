/*
  Warnings:

  - The primary key for the `Cofre` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Cofre` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `Mudanca` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `cofreId` on the `Mudanca` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `Mudanca` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `idUser` on the `Mudanca` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `User` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - Added the required column `idCofre` to the `Mudanca` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cofre" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "saldo" BIGINT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Cofre" ("id", "name", "saldo", "updatedAt") SELECT "id", "name", "saldo", "updatedAt" FROM "Cofre";
DROP TABLE "Cofre";
ALTER TABLE "new_Cofre" RENAME TO "Cofre";
CREATE TABLE "new_Mudanca" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idUser" INTEGER NOT NULL,
    "idCofre" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "tipo" BOOLEAN NOT NULL,
    "valor" BIGINT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Mudanca_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Mudanca_idCofre_fkey" FOREIGN KEY ("idCofre") REFERENCES "Cofre" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Mudanca" ("createdAt", "id", "idUser", "name", "tipo", "valor") SELECT "createdAt", "id", "idUser", "name", "tipo", "valor" FROM "Mudanca";
DROP TABLE "Mudanca";
ALTER TABLE "new_Mudanca" RENAME TO "Mudanca";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "password") SELECT "createdAt", "email", "id", "name", "password" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
