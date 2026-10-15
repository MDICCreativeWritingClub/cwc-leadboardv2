"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Smoothly animates from the previous value to `target` over `duration`ms,
 * instead of the number just snapping (used so vote counts visibly "tick up"
 * rather than silently changing when a Realtime update comes in).
 */
export function useCountUp(target: number, duration: number = 500): number {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;

    const start = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = Math.round(from + (target - from) * eased);
      setDisplay(value);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}
