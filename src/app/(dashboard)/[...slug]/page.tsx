import { Suspense } from "react";
import DevelopmentPage from "@/components/layout/DevelopmentPage";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default function Page({ params }: PageProps) {
  return (
    <Suspense fallback={<DevelopmentPageFallback />}>
      <DevelopmentRoute params={params} />
    </Suspense>
  );
}

async function DevelopmentRoute({ params }: PageProps) {
  const { slug } = await params;
  return <DevelopmentPage slug={slug} />;
}

function DevelopmentPageFallback() {
  return (
    <section aria-busy="true" className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
      <div className="material-medium h-48 animate-pulse" />
    </section>
  );
}
