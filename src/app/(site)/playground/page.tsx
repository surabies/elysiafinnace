import type { Metadata } from "next";
import { EchoPanel } from "@/app/(site)/playground/_components/echo-panel";

export const metadata: Metadata = { title: "API Playground" };

export default function PlaygroundPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Playground</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">
        Uji endpoint publik dan periksa respons runtime API Elysia.
      </p>
      <div className="mt-8 max-w-xl">
        <EchoPanel />
      </div>
    </main>
  );
}
