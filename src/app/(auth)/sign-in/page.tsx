import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/components/sign-in-form";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <Card>
        <CardHeader>
          <h1 className="font-display text-2xl leading-none font-semibold">Sign in</h1>
          <CardDescription>Use the email and password you registered with.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-muted" />}>
            <SignInForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
