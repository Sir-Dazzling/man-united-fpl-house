export function AdminFlashBanner({
  message,
  ok = true,
}: {
  message: string;
  ok?: boolean;
}) {
  return (
    <div
      role="status"
      className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
        ok
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
          : "border-red-500/40 bg-red-500/10 text-red-100"
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          ok ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
        }`}
        aria-hidden
      >
        {ok ? "✓" : "!"}
      </span>
      <p>{message}</p>
    </div>
  );
}
