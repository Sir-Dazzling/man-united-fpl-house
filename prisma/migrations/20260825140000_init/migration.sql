-- CreateSchema
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "gameweek" INTEGER,
    "category" TEXT NOT NULL,
    "placeLabel" TEXT NOT NULL,
    "managerName" TEXT NOT NULL,
    "entryId" INTEGER,
    "amountNgn" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'announced',
    "paidAt" TIMESTAMP(3),
    "transfersUsed" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suspension" (
    "id" TEXT NOT NULL,
    "entryId" INTEGER NOT NULL,
    "managerName" TEXT NOT NULL,
    "teamName" TEXT NOT NULL DEFAULT '',
    "scope" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "Suspension_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Payout_category_gameweek_idx" ON "Payout"("category", "gameweek");

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "Payout"("status");

-- CreateIndex
CREATE INDEX "Suspension_active_scope_idx" ON "Suspension"("active", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "Suspension_entryId_scope_key" ON "Suspension"("entryId", "scope");

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
