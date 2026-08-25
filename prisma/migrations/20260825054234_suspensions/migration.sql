-- CreateTable
CREATE TABLE "Suspension" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryId" INTEGER NOT NULL,
    "managerName" TEXT NOT NULL,
    "teamName" TEXT NOT NULL DEFAULT '',
    "scope" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT
);

-- CreateIndex
CREATE INDEX "Suspension_active_scope_idx" ON "Suspension"("active", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "Suspension_entryId_scope_key" ON "Suspension"("entryId", "scope");
