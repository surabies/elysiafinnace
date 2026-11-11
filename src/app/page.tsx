import Link from "next/link";
import { ContourMap } from "@/components/contour-map";
import { Button } from "@/components/ui/button";

const endpoints = [
  { method: "GET", path: "/api/places/nearby?lon=&lat=&radius=", note: "Places within a radius, nearest first" },
  { method: "GET", path: "/api/places", note: "Paginated list of every place" },
  { method: "POST", path: "/api/places", note: "Save a place (signed in)" },
  { method: "DELETE", path: "/api/places/:id", note: "Remove a place you own" },
  { method: "GET", path: "/api/me", note: "The signed-in user" },
];

export default function Home() {
  return (
    <main>
      <section className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 py-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:py-16">
        <div>
          <h1 className="text-4xl font-semibold leading-[1.05] sm:text-5xl">
            Pin places. Ask what is within reach.
          </h1>
          <p className="mt-5 max-w-prose text-lg text-muted-foreground">
            Save locations to your account, then search by distance from any point. Distances run on
            PostGIS, so a 500 m radius really is 500 metres.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">Create an account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/playground">Try the search</Link>
            </Button>
          </div>
        </div>
        <ContourMap className="h-auto w-full" />
      </section>

      <section className="border-t">
        <div className="mx-auto w-full max-w-5xl px-4 py-10">
          <h2 className="text-2xl font-semibold">What the API offers</h2>
          <dl className="mt-5 divide-y rounded-lg border bg-card">
            {endpoints.map((endpoint) => (
              <div
                key={`${endpoint.method} ${endpoint.path}`}
                className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] sm:gap-6"
              >
                <dt className="font-mono text-sm break-all">
                  <span className="font-semibold text-primary">{endpoint.method}</span> {endpoint.path}
                </dt>
                <dd className="text-sm text-muted-foreground">{endpoint.note}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </main>
  );
}
