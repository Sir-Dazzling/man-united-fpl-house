import { auth, signOut } from "@/auth";
import { PayoutForm } from "@/components/PayoutForm";
import { MarkPayoutPaidButton } from "@/components/MarkPayoutPaidButton";
import {
  deletePayout,
  markPayoutAnnounced,
  markPayoutPaid,
} from "@/lib/payout-actions";
import { prisma } from "@/lib/db";
import { formatNgn, PAYOUT_CATEGORIES } from "@/lib/league-config";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/payouts");
  }

  const payouts = await prisma.payout.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 100,
  });

  const categoryLabel = Object.fromEntries(
    PAYOUT_CATEGORIES.map((c) => [c.value, c.label]),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold">Admin</p>
          <h1 className="mt-2 font-display text-4xl text-white">Log payouts</h1>
          <p className="mt-3 text-white/60">
            Signed in as {session.user.email}. Prefer{" "}
            <Link href="/admin/gameweek" className="text-gold hover:underline">
              GW desk
            </Link>{" "}
            /{" "}
            <Link href="/motm" className="text-gold hover:underline">
              MOTM
            </Link>{" "}
            /{" "}
            <Link href="/admin/eos" className="text-gold hover:underline">
              EOS
            </Link>{" "}
            for auto-confirm.
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-gold/40 hover:text-gold"
          >
            Sign out
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <PayoutForm />

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="border-b border-white/10 bg-united/20 px-4 py-3 text-xs uppercase tracking-wider text-white/70">
            Recent payouts
          </div>
          {payouts.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-white/45">
              No payouts yet.
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {payouts.map((p) => (
                <li
                  key={p.id}
                  className={`flex items-start justify-between gap-3 px-4 py-3 ${
                    p.status === "paid" ? "bg-emerald-500/5" : ""
                  }`}
                >
                  <div>
                    <p className="font-medium text-white">{p.managerName}</p>
                    <p className="text-xs text-white/50">
                      {categoryLabel[p.category] ?? p.category}
                      {p.gameweek ? ` · GW${p.gameweek}` : ""}
                      {" · "}
                      {p.placeLabel}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gold">
                      {formatNgn(p.amountNgn)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {p.status !== "paid" ? (
                      <form action={markPayoutPaid}>
                        <input type="hidden" name="id" value={p.id} />
                        <MarkPayoutPaidButton paid={false} />
                      </form>
                    ) : (
                      <MarkPayoutPaidButton paid />
                    )}
                    {p.status === "paid" ? (
                      <form action={markPayoutAnnounced}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="text-xs text-white/40 transition hover:text-white/70"
                        >
                          Undo paid
                        </button>
                      </form>
                    ) : null}
                    <form action={deletePayout}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="text-xs text-white/40 transition hover:text-red-400"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
