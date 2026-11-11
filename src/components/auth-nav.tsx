"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

/** Session-aware navigation. Reads the session on the client so the page shell stays static. */
export function AuthNav() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/");
    router.refresh();
    setSigningOut(false);
  }

  if (isPending) {
    return <span aria-hidden className="ml-2 h-8 w-28 animate-pulse rounded-md bg-muted" />;
  }

  if (!session) {
    return (
      <div className="ml-2 flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/sign-up">Create account</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="ml-2 flex items-center gap-2">
      <Button asChild variant="ghost" size="sm">
        <Link href="/dashboard">Dashboard</Link>
      </Button>
      <Button variant="outline" size="sm" onClick={signOut} disabled={signingOut}>
        {signingOut ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );
}
