"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FormField } from "@/components/form-field";
import { UseLocationButton } from "@/components/use-location-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NETWORK_ERROR, apiErrorMessage, formatCoordinate } from "@/lib/api-errors";
import { getApi } from "@/lib/api-client";
import { placeFormSchema } from "@/lib/validation";

export type ManagedPlace = {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  ownerId: string;
};

type Props = {
  places: ManagedPlace[];
  total: number;
  currentUserId: string;
};

/**
 * The list comes from the server (props). After a change we call router.refresh(),
 * which re-renders the Server Component with fresh data: no client-side fetching state.
 */
export function PlacesManager({ places, total, currentUserId }: Props) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [values, setValues] = useState({ name: "", longitude: "", latitude: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function update(name: keyof typeof values) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [name]: event.target.value }));
  }

  function refresh() {
    startRefresh(() => router.refresh());
  }

  async function onCreate(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const parsed = placeFormSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setSaving(true);
    let response: Awaited<ReturnType<ReturnType<typeof getApi>["places"]["post"]>>;
    try {
      response = await getApi().places.post(parsed.data);
    } catch {
      setSaving(false);
      setFormError(NETWORK_ERROR);
      return;
    }
    setSaving(false);
    if (response.error) {
      setFormError(
        response.status === 409
          ? "You already have a place with this name."
          : apiErrorMessage(response.error.value),
      );
      return;
    }
    setValues({ name: "", longitude: "", latitude: "" });
    refresh();
  }

  async function onDelete(id: string) {
    setListError(null);
    setDeletingId(id);
    let response: Awaited<ReturnType<ReturnType<ReturnType<typeof getApi>["places"]>["delete"]>>;
    try {
      response = await getApi().places({ id }).delete();
    } catch {
      setDeletingId(null);
      setListError(NETWORK_ERROR);
      return;
    }
    setDeletingId(null);
    if (response.error) {
      setListError(apiErrorMessage(response.error.value));
      return;
    }
    refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Card className="self-start">
        <CardHeader>
          <CardTitle className="text-xl">Add a place</CardTitle>
          <CardDescription>Names must be unique within your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} noValidate className="grid gap-4">
            {formError ? (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}
            <FormField name="name" label="Name" value={values.name} onChange={update("name")} error={errors.name} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                name="longitude"
                label="Longitude"
                inputMode="decimal"
                value={values.longitude}
                onChange={update("longitude")}
                error={errors.longitude}
                className="font-mono"
              />
              <FormField
                name="latitude"
                label="Latitude"
                inputMode="decimal"
                value={values.latitude}
                onChange={update("latitude")}
                error={errors.latitude}
                className="font-mono"
              />
            </div>
            <div className="flex flex-wrap items-start gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save place"}
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
        </CardContent>
      </Card>

      <Card className="self-start">
        <CardHeader>
          <CardTitle className="text-xl">All places</CardTitle>
          <CardDescription>
            {refreshing ? "Updating…" : `${total} saved. You can delete the ones you added.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listError ? (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{listError}</AlertDescription>
            </Alert>
          ) : null}
          {places.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No places yet. Save the first one with the form.
            </p>
          ) : (
            <ul className="divide-y rounded-md border" aria-label="Places">
              {places.map((place) => (
                <li key={place.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{place.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {formatCoordinate(place.longitude)}, {formatCoordinate(place.latitude)}
                    </p>
                  </div>
                  {place.ownerId === currentUserId ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${place.name}`}
                      disabled={deletingId === place.id}
                      onClick={() => onDelete(place.id)}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
