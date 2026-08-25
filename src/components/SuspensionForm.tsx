"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  suspendEntry,
  type SuspendActionState,
} from "@/lib/suspension-actions";

const initial: SuspendActionState = { ok: false, message: "" };

type PickOption = {
  entryId: number;
  managerName: string;
  teamName: string;
  league: "classic" | "h2h";
};

export function SuspensionForm({ picks }: { picks: PickOption[] }) {
  const [state, action] = useActionState(suspendEntry, initial);

  return (
    <form
      action={action}
      className="space-y-5 rounded-2xl border border-white/10 bg-panel/60 p-6"
    >
      <Field label="Pick from live standings (optional)">
        <select
          defaultValue=""
          className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-white outline-none focus:border-gold/50"
          onChange={(e) => {
            const opt = e.currentTarget.selectedOptions[0];
            if (!opt?.value) return;
            const form = e.currentTarget.form;
            if (!form) return;
            (form.elements.namedItem("entryId") as HTMLInputElement).value =
              opt.dataset.entry ?? "";
            (form.elements.namedItem("managerName") as HTMLInputElement).value =
              opt.dataset.manager ?? "";
            (form.elements.namedItem("teamName") as HTMLInputElement).value =
              opt.dataset.team ?? "";
            const scope = form.elements.namedItem("scope") as HTMLSelectElement;
            if (opt.dataset.league === "classic" || opt.dataset.league === "h2h") {
              scope.value = opt.dataset.league;
            }
          }}
        >
          <option value="">— select manager —</option>
          <optgroup label="Classic">
            {picks
              .filter((p) => p.league === "classic")
              .map((p) => (
                <option
                  key={`c-${p.entryId}`}
                  value={p.entryId}
                  data-entry={p.entryId}
                  data-manager={p.managerName}
                  data-team={p.teamName}
                  data-league="classic"
                >
                  {p.managerName} · {p.teamName} (#{p.entryId})
                </option>
              ))}
          </optgroup>
          <optgroup label="H2H">
            {picks
              .filter((p) => p.league === "h2h")
              .map((p) => (
                <option
                  key={`h-${p.entryId}`}
                  value={p.entryId}
                  data-entry={p.entryId}
                  data-manager={p.managerName}
                  data-team={p.teamName}
                  data-league="h2h"
                >
                  {p.managerName} · {p.teamName} (#{p.entryId})
                </option>
              ))}
          </optgroup>
        </select>
      </Field>

      <Field label="Entry ID">
        <input
          name="entryId"
          type="number"
          required
          min={1}
          placeholder="FPL entry / team ID"
          className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-white outline-none focus:border-gold/50"
        />
      </Field>
      <Field label="Manager name">
        <input
          name="managerName"
          required
          placeholder="As shown in FPL"
          className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-white outline-none focus:border-gold/50"
        />
      </Field>
      <Field label="Team name">
        <input
          name="teamName"
          placeholder="Optional"
          className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-white outline-none focus:border-gold/50"
        />
      </Field>
      <Field label="Suspend from">
        <select
          name="scope"
          required
          defaultValue="classic"
          className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-white outline-none focus:border-gold/50"
        >
          <option value="classic">Classic only</option>
          <option value="h2h">H2H only</option>
          <option value="both">Both leagues</option>
        </select>
      </Field>
      <Field label="Reason (optional)">
        <input
          name="reason"
          placeholder="e.g. kicked from Classic, kept in H2H"
          className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-white outline-none focus:border-gold/50"
        />
      </Field>

      {state.message ? (
        <p
          className={
            state.ok ? "text-sm text-emerald-400" : "text-sm text-red-300"
          }
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs uppercase tracking-wider text-white/50">
        {label}
      </span>
      {children}
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-united px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-united/80 disabled:opacity-50"
    >
      {pending ? "Saving…" : "Suspend manager"}
    </button>
  );
}
