export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogEntry {
  waktu: string;
  level: LogLevel;
  pesan: string;
  requestId?: string;
  modul?: string;
  metode?: string;
  path?: string;
  statusHttp?: number;
  durasiMs?: number;
  data?: unknown;
  error?: string;
}

export function buatLog(level: LogLevel, pesan: string, konteks?: Partial<LogEntry>) {
  const entry: LogEntry = {
    waktu: new Date().toISOString(),
    level,
    pesan,
    ...konteks,
  };

  const line = JSON.stringify(entry);
  if (level === "ERROR") {
    console.error(line);
  } else if (level === "WARN") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (pesan: string, konteks?: Partial<LogEntry>) => buatLog("DEBUG", pesan, konteks),
  info: (pesan: string, konteks?: Partial<LogEntry>) => buatLog("INFO", pesan, konteks),
  warn: (pesan: string, konteks?: Partial<LogEntry>) => buatLog("WARN", pesan, konteks),
  error: (pesan: string, konteks?: Partial<LogEntry>) => buatLog("ERROR", pesan, konteks),
};
