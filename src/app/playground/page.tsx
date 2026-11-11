import type { Metadata } from "next";
import { EchoPanel } from "@/components/echo-panel";
import { NearbyPanel } from "@/components/nearby-panel";

export const metadata: Metadata = { title: "Playground" };

export default function PlaygroundPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Playground</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">
        Call the public endpoints from the browser. Creating or deleting places needs an account.
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <EchoPanel />
        <NearbyPanel />
      </div>
    </main>
  );
}
