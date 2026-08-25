import { prisma } from "@/lib/db";

export type SuspensionScope = "classic" | "h2h" | "both";

export async function getSuspendedEntryIds(
  league: "classic" | "h2h",
): Promise<Set<number>> {
  const rows = await prisma.suspension.findMany({
    where: {
      active: true,
      OR: [{ scope: league }, { scope: "both" }],
    },
    select: { entryId: true },
  });
  return new Set(rows.map((r) => r.entryId));
}

export function filterOutSuspended<T extends { entry: number }>(
  rows: T[],
  suspended: Set<number>,
): T[] {
  return rows.filter((r) => !suspended.has(r.entry));
}

export async function listActiveSuspensions() {
  return prisma.suspension.findMany({
    where: { active: true },
    orderBy: [{ scope: "asc" }, { managerName: "asc" }],
  });
}
