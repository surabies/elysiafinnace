"use client";

import type { ReactNode } from "react";
import { IconInbox } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex min-h-55 flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-background/50 p-8 text-center animate-fade-in",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground ring-4 ring-muted/30">
        {icon ?? <IconInbox className="size-6" aria-hidden="true" />}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
