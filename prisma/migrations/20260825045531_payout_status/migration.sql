-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameweek" INTEGER,
    "category" TEXT NOT NULL,
    "placeLabel" TEXT NOT NULL,
    "managerName" TEXT NOT NULL,
    "entryId" INTEGER,
    "amountNgn" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'announced',
    "paidAt" DATETIME,
    "transfersUsed" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    CONSTRAINT "Payout_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Payout" ("amountNgn", "category", "createdAt", "createdById", "entryId", "gameweek", "id", "managerName", "placeLabel") SELECT "amountNgn", "category", "createdAt", "createdById", "entryId", "gameweek", "id", "managerName", "placeLabel" FROM "Payout";
DROP TABLE "Payout";
ALTER TABLE "new_Payout" RENAME TO "Payout";
CREATE INDEX "Payout_category_gameweek_idx" ON "Payout"("category", "gameweek");
CREATE INDEX "Payout_status_idx" ON "Payout"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
