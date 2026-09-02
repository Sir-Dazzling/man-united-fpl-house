"use client";

import { useFormStatus } from "react-dom";
import { formatNgn } from "@/lib/league-config";
import {
  getPayoutWorkflowPhase,
  sumPayoutAmount,
  type PayoutWorkflowRow,
} from "@/lib/payout-workflow";

type AdminPayoutWorkflowProps = {
  trackLabel: string;
  gameweek: number;
  category: string;
  payouts: PayoutWorkflowRow[];
  confirmAction: (formData: FormData) => Promise<void>;
  /** Extra fields merged into the confirm form (e.g. monthKey for MOTM). */
  confirmHiddenFields?: Record<string, string | number>;
  /** Extra fields merged into the mark-paid form. */
  markPaidHiddenFields?: Record<string, string | number>;
  /** Omit when only confirmation is needed (no pay step). */
  markPaidAction?: (formData: FormData) => Promise<void>;
};

export function AdminPayoutWorkflow({
  trackLabel,
  gameweek,
  category,
  payouts,
  confirmAction,
  confirmHiddenFields,
  markPaidHiddenFields,
  markPaidAction,
}: AdminPayoutWorkflowProps) {
  const phase = getPayoutWorkflowPhase(payouts);
  const total = sumPayoutAmount(payouts);
  const paidCount = payouts.filter((p) => p.status === "paid").length;
  const showPayStep = Boolean(markPaidAction);

  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        phase === "paid"
          ? "border-emerald-500/40 bg-emerald-500/10"
          : phase === "announced"
            ? "border-amber-400/30 bg-amber-400/5"
            : "border-white/10 bg-panel/50"
      }`}
      data-export-exclude
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">
            Admin actions
          </p>
          <p className="mt-1 font-semibold text-white">{trackLabel}</p>
        </div>
        <PhaseBadge phase={phase} showPayStep={showPayStep} />
      </div>

      <WorkflowSteps phase={phase} showPayStep={showPayStep} />

      {payouts.length > 0 ? (
        <ul className="mt-4 space-y-2 rounded-xl border border-white/10 bg-ink/40 p-3">
          {payouts.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <div className="min-w-0">
                <span className="font-medium text-white">{p.managerName}</span>
                <span className="text-white/45"> · {p.placeLabel}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-semibold text-gold">
                  {formatNgn(p.amountNgn)}
                </span>
                <StatusPill status={p.status} />
              </div>
            </li>
          ))}
          <li className="flex items-center justify-between border-t border-white/10 pt-2 text-xs text-white/50">
            <span>
              {paidCount}/{payouts.length} paid
              {total > 0 ? ` · ${formatNgn(total)} total` : ""}
            </span>
          </li>
        </ul>
      ) : (
        <p className="mt-4 text-sm text-white/45">
          Confirm to log winners to the house ledger — then mark paid once
          you&apos;ve sent the money.
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <form action={confirmAction}>
          <input type="hidden" name="gameweek" value={gameweek} />
          {Object.entries(confirmHiddenFields ?? {}).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          <ConfirmButton
            payoutCount={payouts.length}
            disabled={phase === "paid" && showPayStep}
          />
        </form>

        {showPayStep && markPaidAction ? (
          <form action={markPaidAction}>
            <input type="hidden" name="gameweek" value={gameweek} />
            <input type="hidden" name="category" value={category} />
            {Object.entries(markPaidHiddenFields ?? {}).map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={value} />
            ))}
            <MarkPaidButton
              phase={phase}
              payoutCount={payouts.length}
              paidCount={paidCount}
            />
          </form>
        ) : null}
      </div>
    </div>
  );
}

function phaseToStepIndex(
  phase: ReturnType<typeof getPayoutWorkflowPhase>,
  showPayStep: boolean,
): number {
  if (phase === "preview") return 0;
  if (phase === "announced") return 1;
  return showPayStep ? 2 : 1;
}

function PhaseBadge({
  phase,
  showPayStep,
}: {
  phase: ReturnType<typeof getPayoutWorkflowPhase>;
  showPayStep: boolean;
}) {
  if (phase === "paid") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
        <CheckIcon className="h-3.5 w-3.5" />
        All paid
      </span>
    );
  }
  if (phase === "announced") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
        <MegaphoneIcon className="h-3.5 w-3.5" />
        {showPayStep ? "Awaiting payment" : "Confirmed"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/55">
      Preview only
    </span>
  );
}

function WorkflowSteps({
  phase,
  showPayStep,
}: {
  phase: ReturnType<typeof getPayoutWorkflowPhase>;
  showPayStep: boolean;
}) {
  const steps = showPayStep
    ? ([
        { key: "preview", label: "Preview" },
        { key: "announced", label: "Confirm" },
        { key: "paid", label: "Paid" },
      ] as const)
    : ([
        { key: "preview", label: "Preview" },
        { key: "announced", label: "Confirm" },
      ] as const);

  const stepCount = steps.length;
  const currentIndex = phaseToStepIndex(phase, showPayStep);

  return (
    <ol className="mt-4 flex items-center gap-1">
      {steps.map((step, i) => {
        const done = i < currentIndex || (phase === "paid" && i === stepCount - 1);
        const active = i === currentIndex && phase !== "paid";
        const isLast = i === steps.length - 1;
        return (
          <li key={step.key} className="flex min-w-0 flex-1 items-center gap-1">
            <div
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-center ${
                done
                  ? "bg-emerald-500/15 text-emerald-300"
                  : active
                    ? "bg-united/25 text-white ring-1 ring-united/50"
                    : "bg-white/5 text-white/40"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-united text-white"
                      : "bg-white/10 text-white/50"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className="truncate text-[10px] uppercase tracking-wider">
                {step.label}
              </span>
            </div>
            {!isLast ? (
              <div
                className={`h-0.5 w-2 shrink-0 sm:w-4 ${
                  i < currentIndex ? "bg-emerald-500/60" : "bg-white/10"
                }`}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "paid") {
    return (
      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
        Paid
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
      Due
    </span>
  );
}

function ConfirmButton({
  payoutCount,
  disabled,
}: {
  payoutCount: number;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();
  const confirmed = payoutCount > 0;

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
        confirmed
          ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
          : "bg-united text-white shadow-lg shadow-united/25 hover:bg-united/90"
      }`}
    >
      {pending ? (
        <>
          <Spinner />
          Confirming winners…
        </>
      ) : confirmed ? (
        <>
          <CheckIcon className="h-4 w-4" />
          {payoutCount} winner{payoutCount === 1 ? "" : "s"} confirmed
        </>
      ) : (
        <>
          <MegaphoneIcon className="h-4 w-4" />
          Confirm winners &amp; announce
        </>
      )}
    </button>
  );
}

function MarkPaidButton({
  phase,
  payoutCount,
  paidCount,
}: {
  phase: ReturnType<typeof getPayoutWorkflowPhase>;
  payoutCount: number;
  paidCount: number;
}) {
  const { pending } = useFormStatus();
  const allPaid = phase === "paid";
  const canPay = payoutCount > 0 && !allPaid;

  return (
    <button
      type="submit"
      disabled={pending || !canPay}
      className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
        allPaid
          ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
          : canPay
            ? "border border-gold/50 bg-gold/15 text-gold shadow-lg shadow-gold/10 hover:bg-gold/25"
            : "border border-white/10 bg-white/5 text-white/35"
      }`}
    >
      {pending ? (
        <>
          <Spinner />
          Marking as paid…
        </>
      ) : allPaid ? (
        <>
          <CheckIcon className="h-4 w-4" />
          Everyone paid ({paidCount}/{payoutCount})
        </>
      ) : canPay ? (
        <>
          <CashIcon className="h-4 w-4" />
          I&apos;ve paid them — mark paid
        </>
      ) : (
        <>Confirm winners first</>
      )}
    </button>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden
    />
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1Z"
        strokeLinejoin="round"
      />
      <path d="M14 8.5a4 4 0 0 1 0 7" strokeLinecap="round" />
      <path d="M16 6a7 7 0 0 1 0 12" strokeLinecap="round" />
    </svg>
  );
}

function CashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 10h.01M18 14h.01" strokeLinecap="round" />
    </svg>
  );
}
