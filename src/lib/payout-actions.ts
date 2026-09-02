"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { PayoutCategory } from "@/lib/league-config";
import type { ResolvedWinner } from "@/lib/winners";

const createSchema = z.object({
  gameweek: z.coerce.number().int().min(1).max(38).optional().nullable(),
  category: z.enum([
    "classic_weekly",
    "h2h_weekly",
    "classic_monthly",
    "h2h_monthly",
    "motm_classic",
    "motm_h2h",
    "classic_eos",
    "h2h_eos",
    "eos",
    "h2h_special",
  ]),
  placeLabel: z.string().trim().min(1).max(80),
  managerName: z.string().trim().min(1).max(120),
  entryId: z.coerce.number().int().positive().optional().nullable(),
  amountNgn: z.coerce.number().int().positive(),
  transfersUsed: z.coerce.number().int().min(0).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type ActionState = {
  ok: boolean;
  message: string;
};

function revalidatePayoutPaths() {
  revalidatePath("/admin/payouts");
  revalidatePath("/admin/gameweek");
  revalidatePath("/earnings");
  revalidatePath("/winners");
  revalidatePath("/motm");
}

export async function createPayout(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "You must be signed in." };
  }

  const parsed = createSchema.safeParse({
    gameweek: formData.get("gameweek") || null,
    category: formData.get("category"),
    placeLabel: formData.get("placeLabel"),
    managerName: formData.get("managerName"),
    entryId: formData.get("entryId") || null,
    amountNgn: formData.get("amountNgn"),
    transfersUsed: formData.get("transfersUsed") || null,
    notes: formData.get("notes") || null,
  });

  if (!parsed.success) {
    return { ok: false, message: "Check the form fields and try again." };
  }

  const data = parsed.data;
  await prisma.payout.create({
    data: {
      gameweek: data.gameweek ?? null,
      category: data.category as PayoutCategory,
      placeLabel: data.placeLabel,
      managerName: data.managerName,
      entryId: data.entryId ?? null,
      amountNgn: data.amountNgn,
      transfersUsed: data.transfersUsed ?? null,
      notes: data.notes ?? null,
      status: "announced",
      createdById: session.user.id,
    },
  });

  revalidatePayoutPaths();
  return { ok: true, message: "Payout saved." };
}

export async function deletePayout(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.payout.delete({ where: { id } });
  revalidatePayoutPaths();
}

export async function markPayoutPaid(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.payout.update({
    where: { id },
    data: { status: "paid", paidAt: new Date() },
  });
  revalidatePayoutPaths();
}

export async function markPayoutAnnounced(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.payout.update({
    where: { id },
    data: { status: "announced", paidAt: null },
  });
  revalidatePayoutPaths();
}

export async function confirmResolvedWinners(input: {
  gameweek: number | null;
  category: PayoutCategory;
  winners: ResolvedWinner[];
}): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "You must be signed in." };
  }

  if (input.winners.length === 0) {
    return { ok: false, message: "No winners to confirm." };
  }

  let created = 0;
  let skipped = 0;

  for (const winner of input.winners) {
    const existing = await prisma.payout.findFirst({
      where: {
        category: input.category,
        gameweek: input.gameweek,
        entryId: winner.entryId,
        placeLabel: winner.placeLabel,
      },
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.payout.create({
      data: {
        gameweek: input.gameweek,
        category: input.category,
        placeLabel: winner.placeLabel,
        managerName: winner.managerName,
        entryId: winner.entryId,
        amountNgn: winner.amountNgn,
        transfersUsed: winner.transfersUsed,
        notes: winner.notes,
        status: "announced",
        createdById: session.user.id,
      },
    });
    created += 1;
  }

  revalidatePayoutPaths();
  return {
    ok: true,
    message: `Confirmed ${created} payout(s)${skipped ? `, skipped ${skipped} existing` : ""}.`,
  };
}

export async function markGameweekPaid(formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "You must be signed in." };
  }

  const gameweek = Number(formData.get("gameweek"));
  const category = String(formData.get("category") ?? "");
  if (!gameweek || !category) {
    return { ok: false, message: "Missing gameweek or category." };
  }

  const result = await prisma.payout.updateMany({
    where: {
      gameweek,
      category,
      status: "announced",
    },
    data: { status: "paid", paidAt: new Date() },
  });

  revalidatePayoutPaths();
  return {
    ok: true,
    message: `Marked ${result.count} payout(s) as paid.`,
  };
}
