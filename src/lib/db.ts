import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** Drop a hot-reload client that predates a schema model (e.g. Suspension). */
function isClientCurrent(client: PrismaClient): boolean {
  return typeof (client as { suspension?: { findMany?: unknown } }).suspension
    ?.findMany === "function";
}

const cached = globalForPrisma.prisma;
export const prisma =
  cached && isClientCurrent(cached) ? cached : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
