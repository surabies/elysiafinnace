"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { LIMITS, signUpSchema } from "@/lib/validation";

export function SignUpForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const parsed = signUpSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setPending(true);
    const { error } = await authClient.signUp.email(parsed.data);
    setPending(false);
    if (error) {
      if (error.status === 429) {
        setFormError("Too many attempts. Wait a moment and try again.");
      } else if (error.status === 422 || error.status === 409) {
        setErrors({ email: "An account with this email already exists." });
      } else {
        setFormError(error.message || "Could not create the account. Try again.");
      }
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <FormField name="name" label="Name" autoComplete="name" error={errors.name} required />
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
        autoComplete="new-password"
        hint={`At least ${LIMITS.passwordMin} characters.`}
        error={errors.password}
        required
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Already registered?{" "}
        <Link href="/sign-in" className="font-medium text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}
