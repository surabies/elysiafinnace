"use client";

import { LocateFixed } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = { onLocate: (coords: { longitude: number; latitude: number }) => void };

export function UseLocationButton({ onLocate }: Props) {
  const [state, setState] = useState<"idle" | "locating" | "denied" | "unsupported">("idle");

  function locate() {
    if (!("geolocation" in navigator)) {
      setState("unsupported");
      return;
    }
    setState("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState("idle");
        onLocate({
          longitude: Number(position.coords.longitude.toFixed(6)),
          latitude: Number(position.coords.latitude.toFixed(6)),
        });
      },
      () => setState("denied"),
      { timeout: 10_000, maximumAge: 60_000 },
    );
  }

  return (
    <div className="grid gap-1">
      <Button type="button" variant="outline" size="sm" onClick={locate} disabled={state === "locating"}>
        <LocateFixed aria-hidden />
        {state === "locating" ? "Locating…" : "Use my location"}
      </Button>
      {state === "denied" ? (
        <p role="status" className="text-sm text-muted-foreground">
          Location access was blocked. Enter coordinates by hand instead.
        </p>
      ) : null}
      {state === "unsupported" ? (
        <p role="status" className="text-sm text-muted-foreground">
          This browser cannot share its location. Enter coordinates by hand instead.
        </p>
      ) : null}
    </div>
  );
}
