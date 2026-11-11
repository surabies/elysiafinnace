"use client";

import Link from "next/link";
import { useState } from "react";
import { FormField } from "@/components/form-field";
import { UseLocationButton } from "@/components/use-location-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NETWORK_ERROR, apiErrorMessage, formatCoordinate, formatDistance } from "@/lib/api-errors";
import { getApi } from "@/lib/api-client";
import { LIMITS, nearbyFormSchema } from "@/lib/validation";

type NearbyResult = {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  distanceMeters: number;
};

export function NearbyPanel() {
  const [values, setValues] = useState({ longitude: "2.2945", latitude: "48.8584", radius: "1000" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [results, setResults] = useState<{ items: NearbyResult[]; radius: number } | null>(null);

  function update(name: keyof typeof values) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [name]: event.target.value }));
  }

  async function onSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const parsed = nearbyFormSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setPending(true);
    let response: Awaited<ReturnType<ReturnType<typeof getApi>["places"]["nearby"]["get"]>>;
    try {
      response = await getApi().places.nearby.get({
        query: { lon: parsed.data.longitude, lat: parsed.data.latitude, radius: parsed.data.radius },
      });
    } catch {
      setPending(false);
      setResults(null);
      setFormError(NETWORK_ERROR);
      return;
    }
    setPending(false);
    if (response.error) {
      setResults(null);
      setFormError(apiErrorMessage(response.error.value));
      return;
    }
    setResults({ items: response.data.data, radius: parsed.data.radius });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Search nearby</CardTitle>
        <CardDescription>
          <code className="font-mono text-xs">GET /api/places/nearby</code> finds places within a radius
          in metres, nearest first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              name="longitude"
              label="Longitude"
              inputMode="decimal"
              value={values.longitude}
              onChange={update("longitude")}
              error={errors.longitude}
              hint={`${LIMITS.lonMin} to ${LIMITS.lonMax}`}
              className="font-mono"
            />
            <FormField
              name="latitude"
              label="Latitude"
              inputMode="decimal"
              value={values.latitude}
              onChange={update("latitude")}
              error={errors.latitude}
              hint={`${LIMITS.latMin} to ${LIMITS.latMax}`}
              className="font-mono"
            />
          </div>
          <FormField
            name="radius"
            label="Radius (metres)"
            inputMode="numeric"
            value={values.radius}
            onChange={update("radius")}
            error={errors.radius}
            hint={`Up to ${LIMITS.radiusMaxMeters.toLocaleString("en-US")} m`}
            className="font-mono"
          />
          <div className="flex flex-wrap items-start gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Searching…" : "Search"}
            </Button>
            <UseLocationButton
              onLocate={({ longitude, latitude }) =>
                setValues((current) => ({
                  ...current,
                  longitude: String(longitude),
                  latitude: String(latitude),
                }))
              }
            />
          </div>
        </form>

        {formError ? (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        {results ? (
          results.items.length > 0 ? (
            <ul className="mt-4 divide-y rounded-md border" aria-label="Nearby places">
              {results.items.map((place) => (
                <li key={place.id} className="flex items-baseline justify-between gap-4 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{place.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {formatCoordinate(place.longitude)}, {formatCoordinate(place.latitude)}
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-sm">{formatDistance(place.distanceMeters)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p role="status" className="mt-4 text-sm text-muted-foreground">
              Nothing within {formatDistance(results.radius)}. Raise the radius, or{" "}
              <Link href="/dashboard" className="text-foreground underline underline-offset-4">
                add a place from your dashboard
              </Link>
              .
            </p>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}
