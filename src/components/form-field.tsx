import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormFieldProps = Omit<React.ComponentProps<typeof Input>, "id" | "name"> & {
  name: string;
  label: string;
  error?: string | undefined;
  hint?: string;
};

/** Label + input + inline error, wired together for screen readers. */
export function FormField({ name, label, error, hint, ...inputProps }: FormFieldProps) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ");
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...inputProps}
      />
      {hint && !error ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
