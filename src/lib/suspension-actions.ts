"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const suspendSchema = z.object({
  entryId: z.coerce.number().int().positive(),
  managerName: z.string().trim().min(1).max(120),
  teamName: z.string().trim().max(120).optional().default(""),
  scope: z.enum(["classic", "h2h", "both"]),
  reason: z.string().trim().max(300).optional().default(""),
});

function revalidateSuspensionPaths() {
  revalidatePath("/admin/suspensions");
  revalidatePath("/classic");
  revalidatePath("/h2h");
  revalidatePath("/winners");
  revalidatePath("/motm");
  revalidatePath("/admin/gameweek");
  revalidatePath("/admin/eos");
  revalidatePath("/");
  revalidatePath("/earnings");
  revalidatePath("/stats");
}

export type SuspendActionState = { ok: boolean; message: string };

export async function suspendEntry(
  _prev: SuspendActionState,
  formData: FormData,
): Promise<SuspendActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "You must be signed in." };
  }

  const parsed = suspendSchema.safeParse({
    entryId: formData.get("entryId"),
    managerName: formData.get("managerName"),
    teamName: formData.get("teamName") || "",
    scope: formData.get("scope"),
    reason: formData.get("reason") || "",
  });

  if (!parsed.success) {
    return { ok: false, message: "Check the form fields." };
  }

  const data = parsed.data;

  // Prefer a single "both" row over split classic/h2h rows for the same entry.
  if (data.scope === "both") {
    await prisma.suspension.updateMany({
      where: {
        entryId: data.entryId,
        scope: { in: ["classic", "h2h"] },
        active: true,
      },
      data: { active: false },
    });
  }

  await prisma.suspension.upsert({
    where: {
      entryId_scope: { entryId: data.entryId, scope: data.scope },
    },
    create: {
      entryId: data.entryId,
      managerName: data.managerName,
      teamName: data.teamName,
      scope: data.scope,
      reason: data.reason,
      active: true,
      createdById: session.user.id,
    },
    update: {
      managerName: data.managerName,
      teamName: data.teamName,
      reason: data.reason,
      active: true,
      createdById: session.user.id,
    },
  });

  revalidateSuspensionPaths();
  return {
    ok: true,
    message: `Suspended ${data.managerName} from ${data.scope === "both" ? "Classic + H2H" : data.scope}. They are now excluded from MOTM, standings, and cash previews.`,
  };
}

export async function unsuspendEntry(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.suspension.update({
    where: { id },
    data: { active: false },
  });
  revalidateSuspensionPaths();
}
