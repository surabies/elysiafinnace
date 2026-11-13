import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

/**
 * Membuat dropdown terbuka saat kursor mouse masuk dan menutup setelah jeda singkat
 * saat kursor keluar dari trigger maupun kontennya. Sentuhan dan keyboard tetap
 * memakai perilaku bawaan Radix (klik / Enter).
 */
export function useHoverMenu(closeDelay = 150) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const onPointerEnter = useCallback(
    (event: ReactPointerEvent) => {
      if (event.pointerType !== "mouse") return;
      clearTimer();
      setOpen(true);
    },
    [clearTimer],
  );

  const onPointerLeave = useCallback(
    (event: ReactPointerEvent) => {
      if (event.pointerType !== "mouse") return;
      clearTimer();
      timer.current = setTimeout(() => setOpen(false), closeDelay);
    },
    [clearTimer, closeDelay],
  );

  const onOpenChange = useCallback(
    (next: boolean) => {
      clearTimer();
      setOpen(next);
    },
    [clearTimer],
  );

  return { open, onOpenChange, onPointerEnter, onPointerLeave };
}