import Link from "next/link";
import { formatDate, formatRupiah } from "@/lib/format";
import type { DashboardJournalActivity } from "../_lib/types";
import { Panel } from "./panel";

export function RecentJournals({
  activity,
}: {
  activity: DashboardJournalActivity;
}) {
  return (
    <Panel
      title="Aktivitas jurnal"
      description="Jurnal terposting terbaru"
      action={
        <span className="text-xs text-muted-foreground">
          {activity.draftCount} draft
        </span>
      }
      className="min-w-0"
    >
      {activity.entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Belum ada jurnal terposting.
        </p>
      ) : (
        <ul className="divide-y">
          {activity.entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{entry.nomor}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {entry.deskripsi}
                </p>
                <time
                  dateTime={entry.tanggal}
                  className="mt-1 block text-xs text-muted-foreground"
                >
                  {formatDate(entry.tanggal)}
                </time>
              </div>
              <span className="shrink-0 text-sm font-medium">
                {formatRupiah(entry.total)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="border-t pt-3">
        <Link
          href="/jurnal"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Lihat semua jurnal
        </Link>
      </div>
    </Panel>
  );
}
