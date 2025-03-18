/*
  Warnings:

  - You are about to alter the column `saldo` on the `Cofre` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `valor` on the `Mudanca` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cofre" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "saldo" INTEGER NOT NULL,
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
    "valor" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Mudanca_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Mudanca_idCofre_fkey" FOREIGN KEY ("idCofre") REFERENCES "Cofre" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Mudanca" ("createdAt", "id", "idCofre", "idUser", "name", "tipo", "valor") SELECT "createdAt", "id", "idCofre", "idUser", "name", "tipo", "valor" FROM "Mudanca";
DROP TABLE "Mudanca";
ALTER TABLE "new_Mudanca" RENAME TO "Mudanca";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
