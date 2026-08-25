import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  if (session?.user) {
    redirect(params.callbackUrl || "/admin/payouts");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <p className="text-xs uppercase tracking-[0.25em] text-gold">Admin</p>
      <h1 className="mt-2 font-display text-4xl text-white">Sign in</h1>
      <p className="mt-3 text-sm text-white/60">
        League admins only — manage weekly and season payouts.
      </p>

      <form
        action={async (formData) => {
          "use server";
          try {
            await signIn("credentials", {
              email: String(formData.get("email") ?? ""),
              password: String(formData.get("password") ?? ""),
              redirectTo: params.callbackUrl || "/admin/payouts",
            });
          } catch (error) {
            if (error instanceof AuthError) {
              redirect("/login?error=CredentialsSignin");
            }
            throw error;
          }
        }}
        className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-panel/60 p-6"
      >
        <label className="block space-y-1.5">
          <span className="text-xs uppercase tracking-wider text-white/50">
            Email
          </span>
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            defaultValue="admin@fanhouse.local"
            className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-white outline-none focus:border-gold/50"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs uppercase tracking-wider text-white/50">
            Password
          </span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-white outline-none focus:border-gold/50"
          />
        </label>
        {params.error ? (
          <p className="text-sm text-red-400">Invalid email or password.</p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded-lg bg-united px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-united/90"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
