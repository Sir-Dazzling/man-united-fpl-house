"use client";

import { useFormStatus } from "react-dom";

export function MarkPayoutPaidButton({
  paid,
}: {
  paid: boolean;
}) {
  const { pending } = useFormStatus();

  if (paid) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
        ✓ Paid
      </span>
    );
  }

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold transition hover:bg-gold/20 active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? (
        <>
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Saving…
        </>
      ) : (
        <>Mark paid</>
      )}
    </button>
  );
}
