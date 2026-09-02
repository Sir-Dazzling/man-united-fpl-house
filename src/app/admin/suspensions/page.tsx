import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { SuspensionForm } from "@/components/SuspensionForm";
import { unsuspendEntry } from "@/lib/suspension-actions";
import { listActiveSuspensions } from "@/lib/suspensions";
import {
  getAllClassicStandings,
  getAllH2hStandings,
} from "@/lib/fpl/client";
import { LEAGUE } from "@/lib/league-config";

export const dynamic = "force-dynamic";

export default async function AdminSuspensionsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/suspensions");
  }

  const [suspensions, classic, h2h] = await Promise.all([
    listActiveSuspensions(),
    getAllClassicStandings(LEAGUE.classic.leagueId).catch(() => null),
    getAllH2hStandings(LEAGUE.h2h.leagueId).catch(() => null),
  ]);

  const picks = [
    ...(classic?.results ?? []).map((r) => ({
      entryId: r.entry,
      managerName: r.player_name,
      teamName: r.entry_name,
      league: "classic" as const,
    })),
    ...(h2h?.results ?? []).map((r) => ({
      entryId: r.entry,
      managerName: r.player_name,
      teamName: r.entry_name,
      league: "h2h" as const,
    })),
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold">Admin</p>
          <h1 className="mt-2 font-display text-4xl text-white">
            Suspend managers
          </h1>
          <p className="mt-3 max-w-xl text-white/60">
            Flag entries so house standings and prize math ignore them. Leaving
            or getting kicked on the FPL site does <strong className="text-white">not</strong>{" "}
            auto-update this app — you must suspend them here too. Suspended
            managers still appear on H2H fixtures (with a badge). Scope can be
            Classic, H2H, or both.
          </p>
          <p className="mt-2 text-sm text-white/45">
            <Link href="/admin/gameweek" className="text-gold hover:underline">
              GW desk
            </Link>
            {" · "}
            <Link href="/admin/payouts" className="text-gold hover:underline">
              Payouts
            </Link>
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
        <SuspensionForm picks={picks} />

        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="border-b border-white/10 bg-united/20 px-4 py-3 text-xs uppercase tracking-wider text-white/70">
            Active suspensions ({suspensions.length})
          </div>
          {suspensions.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-white/45">
              Nobody flagged yet.
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {suspensions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">{s.managerName}</p>
                    <p className="text-xs text-white/50">
                      {s.teamName || "—"} · entry #{s.entryId} ·{" "}
                      <span className="text-amber-300/90">{s.scope}</span>
                    </p>
                    {s.reason ? (
                      <p className="mt-1 text-xs text-white/40">{s.reason}</p>
                    ) : null}
                  </div>
                  <form action={unsuspendEntry}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-white/15 px-2.5 py-1 text-xs text-white/70 transition hover:border-gold/40 hover:text-gold"
                    >
                      Restore
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
