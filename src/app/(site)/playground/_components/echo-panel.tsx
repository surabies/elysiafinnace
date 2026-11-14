"use client";

import { useState } from "react";
import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NETWORK_ERROR, apiErrorMessage } from "@/lib/api-errors";
import { getApi } from "@/lib/api-client";
import { echoFormSchema } from "@/lib/validation";

export function EchoPanel() {
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setResult(null);
    const parsed = echoFormSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    setPending(true);
    let response: Awaited<ReturnType<ReturnType<typeof getApi>["echo"]["post"]>>;
    try {
      response = await getApi().echo.post({ message: parsed.data.message });
    } catch {
      setPending(false);
      setFormError(NETWORK_ERROR);
      return;
    }
    setPending(false);
    if (response.error) {
      setFormError(apiErrorMessage(response.error.value));
      return;
    }
    setResult(JSON.stringify(response.data, null, 2));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Echo</CardTitle>
        <CardDescription>
          <code className="font-mono text-xs">POST /api/echo</code> sends your message back, validated on the server.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <FormField name="message" label="Message" error={error} />
          <Button type="submit" disabled={pending} className="justify-self-start">
            {pending ? "Sending…" : "Send message"}
          </Button>
        </form>
        {formError ? (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}
        {result ? (
          <pre
            aria-label="Echo response"
            className="mt-4 overflow-x-auto rounded-md bg-muted p-3 font-mono text-sm"
          >
            {result}
          </pre>
        ) : null}
      </CardContent>
    </Card>
  );
}
