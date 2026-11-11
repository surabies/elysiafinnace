import type { Metadata } from "next";
import { PlacesManager } from "@/components/places-manager";
import { apiServer } from "@/lib/api-server";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

const PAGE_SIZE = 50;

export default async function DashboardPage() {
  const { user } = await requireSession();
  // In-process call to the Elysia app (no HTTP hop); `places` is public data.
  const response = await apiServer.places.get({ query: { limit: PAGE_SIZE } });
  if (response.error) throw new Error("Could not load places");

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Welcome, {user.name}</h1>
      <p className="mt-2 text-muted-foreground">Signed in as {user.email}.</p>
      <div className="mt-8">
        <PlacesManager
          places={response.data.data}
          total={response.data.pagination.total}
          currentUserId={user.id}
        />
      </div>
    </main>
  );
}
