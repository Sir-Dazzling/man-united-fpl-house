import { Suspense } from "react";
import { FixturesClient } from "@/components/FixturesClient";

export default function FixturesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="text-xs uppercase tracking-[0.25em] text-gold">
            Fixtures
          </p>
          <h1 className="mt-2 font-display text-4xl text-white">H2H results</h1>
          <div className="mt-8 h-48 animate-pulse rounded-2xl border border-white/10 bg-panel/40" />
        </div>
      }
    >
      <FixturesClient />
    </Suspense>
  );
}
