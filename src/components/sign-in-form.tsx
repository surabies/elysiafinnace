"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { safeNextPath, signInSchema } from "@/lib/validation";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const parsed = signInSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setPending(true);
    const { error } = await authClient.signIn.email(parsed.data);
    setPending(false);
    if (error) {
      setFormError(
        error.status === 429
          ? "Too many attempts. Wait a moment and try again."
          : "Email or password is incorrect.",
      );
      return;
    }
    router.push(safeNextPath(searchParams.get("next")));
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <FormField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email}
        required
      />
      <FormField
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password}
        required
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-sm text-muted-foreground">
        No account yet?{" "}
        <Link href="/sign-up" className="font-medium text-foreground underline underline-offset-4">
          Create one
        </Link>
      </p>
    </form>
  );
}
