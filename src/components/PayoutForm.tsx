"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createPayout,
  type ActionState,
} from "@/lib/payout-actions";
import {
  formatNgn,
  PAYOUT_CATEGORIES,
  PRIZES,
  ordinal,
} from "@/lib/league-config";

const initial: ActionState = { ok: false, message: "" };

export function PayoutForm() {
  const [state, action] = useActionState(createPayout, initial);

  return (
    <form action={action} className="space-y-5 rounded-2xl border border-white/10 bg-panel/60 p-6">
      <Field label="Gameweek (optional for EOS / specials)">
        <input
          name="gameweek"
          type="number"
          min={1}
          max={38}
          placeholder="e.g. 1"
          className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-white outline-none focus:border-gold/50"
        />
      </Field>
      <Field label="Category">
        <select
          name="category"
          required
          defaultValue="classic_weekly"
          className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-white outline-none focus:border-gold/50"
        >
          {PAYOUT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Place / award label">
        <div className="space-y-1.5">
          <input
            name="placeLabel"
            required
            list="place-suggestions"
            placeholder="1st place"
            className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-white outline-none focus:border-gold/50"
          />
          <datalist id="place-suggestions">
            {[
              ...PRIZES.weekly.map(
                (row) => `${row.place}${ordinal(row.place)} place`,
              ),
              "Most Goals Scored",
              "Fewest Goals Conceded",
              "Manager of the Month",
            ].map((value) => (
              <option key={value} value={value} />
            ))}
          </datalist>
        </div>
      </Field>
      <Field label="Manager name">
        <input
          name="managerName"
          required
          placeholder="FPL manager name"
          className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-white outline-none focus:border-gold/50"
        />
      </Field>
      <Field label="Entry ID (optional)">
        <input
          name="entryId"
          type="number"
          min={1}
          placeholder="FPL entry ID"
          className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-white outline-none focus:border-gold/50"
        />
      </Field>
      <Field label="Amount (₦)">
        <div className="space-y-1.5">
          <input
            name="amountNgn"
            type="number"
            min={1}
            required
            defaultValue={PRIZES.weekly[0].amountNgn}
            className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-white outline-none focus:border-gold/50"
          />
          <p className="text-xs text-white/40">
            Weekly tips:{" "}
            {PRIZES.weekly.map((r) => formatNgn(r.amountNgn)).join(" · ")}
          </p>
        </div>
      </Field>
      {state.message ? (
        <p
          className={`text-sm ${state.ok ? "text-emerald-400" : "text-red-400"}`}
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
  children: React.ReactNode;
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
      className="w-full rounded-lg bg-united px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-united/90 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save payout"}
    </button>
  );
}
