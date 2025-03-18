-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Mudanca" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idUser" TEXT NOT NULL,
    "cofreId" TEXT,
    "name" TEXT NOT NULL,
    "tipo" BOOLEAN NOT NULL,
    "valor" BIGINT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Mudanca_idUser_fkey" FOREIGN KEY ("idUser") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Mudanca_cofreId_fkey" FOREIGN KEY ("cofreId") REFERENCES "Cofre" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Mudanca" ("createdAt", "id", "idUser", "name", "tipo", "valor") SELECT "createdAt", "id", "idUser", "name", "tipo", "valor" FROM "Mudanca";
DROP TABLE "Mudanca";
ALTER TABLE "new_Mudanca" RENAME TO "Mudanca";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
