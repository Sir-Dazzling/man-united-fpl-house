import { auth } from "@/auth";
import { AppNavClient } from "@/components/AppNavClient";
import { signOutAction } from "@/lib/auth-actions";

export async function AppNav() {
  const session = await auth();
  const isAdmin = Boolean(session?.user);

  return (
    <AppNavClient
      isAdmin={isAdmin}
      adminEmail={session?.user?.email ?? null}
      signOutAction={signOutAction}
    />
  );
}
