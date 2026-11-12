import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Panel } from "@/app/(dashboard)/dashboard/_components/panel";
import { cn } from "@/lib/utils";
import type { PendingTask } from "../_lib/types";

const toneClass: Record<PendingTask["tone"], string> = {
  warning: "bg-signal/20 text-signal-foreground",
  neutral: "bg-muted text-foreground",
};

export function ActionList({ tasks }: { tasks: PendingTask[] }) {
  return (
    <Panel
      title="Perlu tindak lanjut"
      description="Pekerjaan yang menunggu di periode ini"
      className="h-full"
    >
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Tidak ada pekerjaan tertunda.
        </p>
      ) : (
        <ul className="-mx-2.5 flex flex-col gap-1">
          {tasks.map((task) => (
            <li key={task.id}>
              <Link
                href={task.href}
                className="group flex h-11 items-center gap-3 rounded-lg px-2.5 text-sm transition-colors duration-200 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={cn(
                    "grid min-w-7 place-items-center rounded-md px-1.5 py-0.5 font-mono text-xs font-medium tabular-nums",
                    toneClass[task.tone],
                  )}
                >
                  {task.count}
                </span>
                <span className="flex-1 truncate">{task.title}</span>
                <ChevronRight
                  aria-hidden
                  className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
