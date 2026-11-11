import type { Metadata } from "next";
import { SignUpForm } from "@/components/sign-up-form";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <Card>
        <CardHeader>
          <h1 className="font-display text-2xl leading-none font-semibold">Create your account</h1>
          <CardDescription>Accounts let you pin places and delete the ones you added.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
    </main>
  );
}
